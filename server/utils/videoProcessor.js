const { exec, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { sanitizeUrl } = require('./sanitize');

const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');

if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

const isWindows = process.platform === 'win32';

const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 300000;
    const maxBuffer = 50 * 1024 * 1024;

    if (isWindows) {
      const escapedArgs = args.map(a => `"${a}"`).join(' ');
      const fullCmd = `${command} ${escapedArgs}`;
      exec(fullCmd, { timeout, maxBuffer }, (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve({ stdout, stderr });
      });
    } else {
      execFile(command, args, { timeout, maxBuffer }, (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve({ stdout, stderr });
      });
    }
  });
};

const fetchMetadata = async (url) => {
  const sanitized = sanitizeUrl(url);
  if (!sanitized) {
    throw new Error('Invalid URL');
  }

  try {
    const { stdout } = await runCommand('yt-dlp', [
      '--dump-json',
      '--no-download',
      '--no-warnings',
      sanitized,
    ], { timeout: 60000 });

    if (!stdout || !stdout.trim()) {
      throw new Error('No metadata returned');
    }

    const data = JSON.parse(stdout);
    const formats = (data.formats || [])
      .filter(f => f.vcodec !== 'none' || f.acodec !== 'none')
      .map(f => ({
        formatId: f.format_id,
        ext: f.ext,
        quality: f.height ? `${f.height}p` : (f.abr ? `${f.abr}kbps` : 'unknown'),
        height: f.height || null,
        fps: f.fps || null,
        filesize: f.filesize || f.filesize_approx || null,
        hasVideo: f.vcodec !== 'none',
        hasAudio: f.acodec !== 'none',
        vcodec: f.vcodec,
        acodec: f.acodec,
      }));

    const qualityMap = new Map();
    formats.forEach(f => {
      if (f.hasVideo && f.height) {
        const key = `${f.height}p`;
        if (!qualityMap.has(key) || (f.fps && (!qualityMap.get(key).fps || f.fps > qualityMap.get(key).fps))) {
          qualityMap.set(key, f);
        }
      }
    });

    const availableQualities = Array.from(qualityMap.values())
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    const standardFps = [24, 30, 48, 60, 120];
    let maxVideoFps = 0;
    formats.forEach(f => {
      if (f.hasVideo && f.fps && f.fps > maxVideoFps) maxVideoFps = f.fps;
    });
    const availableFps = standardFps.filter(fps => fps <= (maxVideoFps || 30));

    return {
      title: data.title,
      thumbnail: data.thumbnail,
      duration: data.duration,
      uploader: data.uploader,
      uploadDate: data.upload_date,
      viewCount: data.view_count,
      description: data.description ? data.description.substring(0, 500) : '',
      url: sanitized,
      formats: availableQualities,
      availableFps,
      audioFormats: formats.filter(f => !f.hasVideo && f.hasAudio),
    };
  } catch (error) {
    console.error('yt-dlp error:', error.message || error);
    if (error.stderr) console.error('yt-dlp stderr:', error.stderr);
    if (error.message === 'Invalid URL' || error.message === 'No metadata returned') {
      throw error;
    }
    throw new Error('Failed to fetch video metadata. Make sure yt-dlp is installed and the URL is valid.');
  }
};

const downloadVideo = async (options) => {
  const { url, quality, format, trimStart, trimEnd, fps } = options;

  const sanitized = sanitizeUrl(url);
  if (!sanitized) {
    throw new Error('Invalid URL');
  }

  const outputId = uuidv4();
  const outputExt = format === 'mp3' ? 'mp3' : 'mp4';
  const outputFile = path.join(DOWNLOADS_DIR, `${outputId}.${outputExt}`);
  const tempTemplate = path.join(DOWNLOADS_DIR, `${outputId}_temp.%(ext)s`);

  const needsTrim = trimStart !== undefined && trimEnd !== undefined && (trimStart > 0 || trimEnd);
  const args = [];

  if (format === 'mp3') {
    args.push('-x', '--audio-format', 'mp3');
  } else {
    const height = parseInt(quality, 10) || 720;
    args.push('-f', `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`);
  }

  if (needsTrim) {
    args.push('--download-sections', `*${trimStart}-${trimEnd}`);
    args.push('--force-keyframes-at-cuts');
  }

  args.push('-o', tempTemplate, '--no-warnings', '--no-playlist', sanitized);

  try {
    await runCommand('yt-dlp', args, { timeout: 300000 });
  } catch (err) {
    console.error('yt-dlp download error:', err.message || err);
    throw new Error('Download failed');
  }

  const files = fs.readdirSync(DOWNLOADS_DIR)
    .filter(f => f.startsWith(`${outputId}_temp`));

  if (files.length === 0) {
    throw new Error('Downloaded file not found');
  }

  const downloadedFile = path.join(DOWNLOADS_DIR, files[0]);

  if (fps && format !== 'mp3') {
    const ffmpegArgs = [
      '-i', downloadedFile,
      '-c:v', 'libx264', '-preset', 'ultrafast',
      '-r', String(fps),
      '-c:a', 'copy',
      '-y', outputFile,
    ];

    try {
      await runCommand('ffmpeg', ffmpegArgs, { timeout: 300000 });
    } catch (err) {
      console.error('ffmpeg fps error:', err.message || err);
      try { fs.unlinkSync(downloadedFile); } catch {}
      throw new Error('FPS conversion failed');
    }

    try { fs.unlinkSync(downloadedFile); } catch {}
  } else {
    fs.renameSync(downloadedFile, outputFile);
  }

  const stats = fs.statSync(outputFile);
  return {
    filePath: outputFile,
    fileName: `${outputId}.${outputExt}`,
    fileSize: stats.size,
  };
};

const cleanupOldFiles = () => {
  const maxAge = 60 * 60 * 1000;
  const now = Date.now();

  fs.readdirSync(DOWNLOADS_DIR).forEach(file => {
    const filePath = path.join(DOWNLOADS_DIR, file);
    try {
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  });
};

setInterval(cleanupOldFiles, 30 * 60 * 1000);

module.exports = { fetchMetadata, downloadVideo, cleanupOldFiles };
