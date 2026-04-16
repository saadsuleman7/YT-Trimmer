const { execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { sanitizeUrl } = require('./sanitize');

const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Fetch video metadata using yt-dlp
const fetchMetadata = (url) => {
  return new Promise((resolve, reject) => {
    const sanitized = sanitizeUrl(url);
    if (!sanitized) {
      return reject(new Error('Invalid URL'));
    }

    execFile('yt-dlp', [
      '--dump-json',
      '--no-download',
      '--no-warnings',
      sanitized,
    ], { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error('Failed to fetch video metadata'));
      }

      try {
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

        // Deduplicate by quality and pick the best format per resolution
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

        resolve({
          title: data.title,
          thumbnail: data.thumbnail,
          duration: data.duration,
          uploader: data.uploader,
          uploadDate: data.upload_date,
          viewCount: data.view_count,
          description: data.description ? data.description.substring(0, 500) : '',
          url: sanitized,
          formats: availableQualities,
          audioFormats: formats.filter(f => !f.hasVideo && f.hasAudio),
        });
      } catch (parseErr) {
        reject(new Error('Failed to parse video metadata'));
      }
    });
  });
};

// Download and optionally trim video
const downloadVideo = (options) => {
  return new Promise((resolve, reject) => {
    const {
      url, quality, format, trimStart, trimEnd, fps,
    } = options;

    const sanitized = sanitizeUrl(url);
    if (!sanitized) {
      return reject(new Error('Invalid URL'));
    }

    const outputId = uuidv4();
    const outputExt = format === 'mp3' ? 'mp3' : 'mp4';
    const outputFile = path.join(DOWNLOADS_DIR, `${outputId}.${outputExt}`);
    const tempFile = path.join(DOWNLOADS_DIR, `${outputId}_temp.%(ext)s`);

    const args = [];

    if (format === 'mp3') {
      args.push('-x', '--audio-format', 'mp3');
    } else {
      // Select format by quality
      const height = parseInt(quality, 10) || 720;
      args.push('-f', `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`);
    }

    args.push('-o', tempFile, '--no-warnings', '--no-playlist', sanitized);

    execFile('yt-dlp', args, { timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error('Download failed'));
      }

      // Find the downloaded file
      const files = fs.readdirSync(DOWNLOADS_DIR)
        .filter(f => f.startsWith(`${outputId}_temp`));

      if (files.length === 0) {
        return reject(new Error('Downloaded file not found'));
      }

      const downloadedFile = path.join(DOWNLOADS_DIR, files[0]);

      // If trimming is needed, use ffmpeg
      if (trimStart !== undefined && trimEnd !== undefined && (trimStart > 0 || trimEnd)) {
        const ffmpegArgs = ['-i', downloadedFile, '-ss', String(trimStart)];

        if (trimEnd) {
          ffmpegArgs.push('-to', String(trimEnd));
        }

        if (format === 'mp3') {
          ffmpegArgs.push('-vn', '-acodec', 'libmp3lame');
        } else {
          ffmpegArgs.push('-c', 'copy');
          if (fps) {
            // Re-encode if FPS filter is needed
            ffmpegArgs.splice(ffmpegArgs.indexOf('-c'), 2);
            ffmpegArgs.push('-c:a', 'copy', '-r', String(fps));
          }
        }

        ffmpegArgs.push('-y', outputFile);

        execFile('ffmpeg', ffmpegArgs, { timeout: 300000 }, (ffErr) => {
          // Clean up temp file
          try { fs.unlinkSync(downloadedFile); } catch {}

          if (ffErr) {
            return reject(new Error('Trimming failed'));
          }

          const stats = fs.statSync(outputFile);
          resolve({
            filePath: outputFile,
            fileName: `${outputId}.${outputExt}`,
            fileSize: stats.size,
          });
        });
      } else {
        // Rename temp to output if no trimming
        const finalFile = path.join(DOWNLOADS_DIR, `${outputId}.${path.extname(downloadedFile).slice(1) || outputExt}`);
        fs.renameSync(downloadedFile, outputFile);

        const stats = fs.statSync(outputFile);
        resolve({
          filePath: outputFile,
          fileName: `${outputId}.${outputExt}`,
          fileSize: stats.size,
        });
      }
    });
  });
};

// Clean up old files (run periodically)
const cleanupOldFiles = () => {
  const maxAge = 60 * 60 * 1000; // 1 hour
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

// Run cleanup every 30 minutes
setInterval(cleanupOldFiles, 30 * 60 * 1000);

module.exports = { fetchMetadata, downloadVideo, cleanupOldFiles };
