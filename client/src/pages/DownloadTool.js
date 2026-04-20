import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiSearch, FiDownload, FiLock, FiMusic, FiFilm, FiClock, FiInfo } from 'react-icons/fi';
import api from '../utils/api';
import { formatTime, parseTime, isQualityLocked } from '../utils/helpers';
import RatingPopup from '../components/ratings/RatingPopup';
import SEO from '../components/SEO';

const DownloadTool = () => {
  const { isAuthenticated, isPremium } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [format, setFormat] = useState('mp4');
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [selectedFps, setSelectedFps] = useState(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [trimStartStr, setTrimStartStr] = useState('00:00:00');
  const [trimEndStr, setTrimEndStr] = useState('00:00:00');
  const [showRating, setShowRating] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const videoRef = useRef(null);
  const sliderRef = useRef(null);
  const playerRef = useRef(null);
  const draggingRef = useRef(null);

  useEffect(() => {
    if (!videoData?.videoId || videoData.extractor !== 'Youtube') return;

    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }

    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = createPlayer;
    return () => { window.onYouTubeIframeAPIReady = null; };
  }, [videoData?.videoId]);

  const createPlayer = () => {
    if (playerRef.current) {
      playerRef.current.destroy();
    }
    playerRef.current = new window.YT.Player('yt-player', {
      videoId: videoData.videoId,
      playerVars: { controls: 1, modestbranding: 1, rel: 0 },
      events: {
        onReady: () => setPlayerReady(true),
      },
    });
  };

  const seekPlayer = (seconds) => {
    if (playerRef.current && playerReady && playerRef.current.seekTo) {
      playerRef.current.seekTo(seconds, true);
    }
  };

  const fetchMetadata = async () => {
    if (!url.trim()) {
      toast.error('Please enter a video URL');
      return;
    }

    setLoading(true);
    setVideoData(null);
    setPlayerReady(false);
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    try {
      const res = await api.post('/videos/metadata', { url: url.trim() });
      setVideoData(res.data);
      setTrimStart(0);
      setTrimStartStr('00:00:00');
      setTrimEnd(res.data.duration || 0);
      setTrimEndStr(formatTime(res.data.duration || 0));

      const available = res.data.formats.filter(f => !f.isLocked);
      if (available.length > 0) {
        setSelectedQuality(available[0]);
      }
      const availableFps = (res.data.fpsOptions || []).filter(f => !f.isLocked);
      if (availableFps.length > 0) {
        setSelectedFps(availableFps[availableFps.length - 1]);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch video information');
    } finally {
      setLoading(false);
    }
  };

  const handleQualitySelect = (quality) => {
    if (quality.isLocked) {
      setShowUpgradePrompt(true);
      return;
    }
    setSelectedQuality(quality);
  };

  const handleFpsSelect = (fpsOption) => {
    if (fpsOption.isLocked) {
      setShowUpgradePrompt(true);
      return;
    }
    setSelectedFps(fpsOption);
  };

  const handleTrimStartChange = (value) => {
    const seconds = Math.max(0, Math.min(value, trimEnd - 1));
    setTrimStart(seconds);
    setTrimStartStr(formatTime(seconds));
    seekPlayer(seconds);
  };

  const handleTrimEndChange = (value) => {
    const seconds = Math.max(trimStart + 1, Math.min(value, videoData?.duration || 0));
    setTrimEnd(seconds);
    setTrimEndStr(formatTime(seconds));
    seekPlayer(seconds);
  };

  const handleStartTimeInput = (str) => {
    setTrimStartStr(str);
    const seconds = parseTime(str);
    if (!isNaN(seconds)) {
      const clamped = Math.max(0, Math.min(seconds, trimEnd - 1));
      setTrimStart(clamped);
      seekPlayer(clamped);
    }
  };

  const handleEndTimeInput = (str) => {
    setTrimEndStr(str);
    const seconds = parseTime(str);
    if (!isNaN(seconds)) {
      const clamped = Math.max(trimStart + 1, Math.min(seconds, videoData?.duration || 0));
      setTrimEnd(clamped);
      seekPlayer(clamped);
    }
  };

  const handleDownload = async () => {
    if (!videoData || !selectedQuality) return;

    setDownloading(true);
    try {
      const res = await api.post('/downloads/start', {
        url: videoData.url,
        format,
        quality: selectedQuality.height?.toString() || '720',
        fps: selectedFps?.fps || 24,
        trimStart,
        trimEnd,
        title: videoData.title,
        thumbnail: videoData.thumbnail,
      });

      const downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${res.data.downloadUrl}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${videoData.title || 'download'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download started!');
      setShowRating(true);
    } catch (err) {
      if (err.response?.data?.requiresUpgrade) {
        setShowUpgradePrompt(true);
      } else {
        toast.error(err.response?.data?.error || 'Download failed');
      }
    } finally {
      setDownloading(false);
    }
  };

  const getSliderTime = useCallback((e) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    return Math.floor(percent * (videoData?.duration || 0));
  }, [videoData]);

  const handleSliderMouseDown = useCallback((e) => {
    e.preventDefault();
    const time = getSliderTime(e);
    const distToStart = Math.abs(time - trimStart);
    const distToEnd = Math.abs(time - trimEnd);
    draggingRef.current = distToStart < distToEnd ? 'start' : 'end';

    if (draggingRef.current === 'start') {
      handleTrimStartChange(time);
    } else {
      handleTrimEndChange(time);
    }
  }, [trimStart, trimEnd, getSliderTime]);

  const handleSliderMove = useCallback((e) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    const time = getSliderTime(e);
    if (draggingRef.current === 'start') {
      handleTrimStartChange(time);
    } else {
      handleTrimEndChange(time);
    }
  }, [getSliderTime]);

  const handleSliderUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  useEffect(() => {
    if (!downloading) {
      if (progress > 0) {
        setProgress(100);
        setProgressStage('Complete!');
        const t = setTimeout(() => { setProgress(0); setProgressStage(''); }, 1500);
        return () => clearTimeout(t);
      }
      return;
    }

    setProgress(0);
    setProgressStage('Extracting video info...');

    const stages = [
      { at: 5, pct: 8, label: 'Extracting video info...' },
      { at: 10, pct: 15, label: 'Extracting video info...' },
      { at: 15, pct: 20, label: 'Downloading video...' },
      { at: 25, pct: 30, label: 'Downloading video...' },
      { at: 40, pct: 45, label: 'Downloading video...' },
      { at: 55, pct: 55, label: 'Processing & converting...' },
      { at: 70, pct: 65, label: 'Processing & converting...' },
      { at: 90, pct: 75, label: 'Processing & converting...' },
      { at: 120, pct: 82, label: 'Finalizing...' },
      { at: 150, pct: 88, label: 'Finalizing...' },
      { at: 200, pct: 92, label: 'Almost there...' },
      { at: 260, pct: 95, label: 'Almost there...' },
    ];

    const timers = stages.map(s =>
      setTimeout(() => {
        setProgress(s.pct);
        setProgressStage(s.label);
      }, s.at * 1000)
    );

    return () => timers.forEach(clearTimeout);
  }, [downloading]);

  useEffect(() => {
    window.addEventListener('mousemove', handleSliderMove);
    window.addEventListener('mouseup', handleSliderUp);
    window.addEventListener('touchmove', handleSliderMove, { passive: false });
    window.addEventListener('touchend', handleSliderUp);
    return () => {
      window.removeEventListener('mousemove', handleSliderMove);
      window.removeEventListener('mouseup', handleSliderUp);
      window.removeEventListener('touchmove', handleSliderMove);
      window.removeEventListener('touchend', handleSliderUp);
    };
  }, [handleSliderMove, handleSliderUp]);

  const isYouTube = videoData?.extractor === 'Youtube' && videoData?.videoId;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      <SEO
        title="Video Download &amp; Trim Tool"
        description="Paste a YouTube or video URL to download and trim. Choose MP4 or MP3, set start/end times, and download your clip instantly. Free up to 720p."
        canonical="/tool"
        schemas={[{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'YT-Trimmer Video Tool',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Web',
          url: 'https://yt-trimmer.com/tool',
          description: 'Paste a video URL, set trim points, choose MP4 or MP3 format and quality, then download your trimmed clip instantly.',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }]}
      />
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          <span className="gradient-text">Download & Trim</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Paste a video URL to get started
          {!isPremium && (
            <span className="text-primary-600 dark:text-primary-400"> (Free: max 720p, 24fps)</span>
          )}
        </p>
      </div>

      {/* URL Input */}
      <div className="card p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMetadata()}
            placeholder="Paste video URL here (YouTube, Vimeo, etc.)"
            className="input-field flex-1"
          />
          <button
            onClick={fetchMetadata}
            disabled={loading}
            className="btn-primary flex items-center justify-center space-x-2 whitespace-nowrap"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiSearch size={20} />
            )}
            <span>{loading ? 'Fetching...' : 'Fetch'}</span>
          </button>
        </div>
      </div>

      {/* Video info + controls */}
      {videoData && (
        <div className="space-y-6 animate-slide-up">
          {/* Video preview / player */}
          <div className="card p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-96 flex-shrink-0">
                {isYouTube ? (
                  <div className="aspect-video rounded-xl overflow-hidden bg-black">
                    <div id="yt-player" className="w-full h-full" />
                  </div>
                ) : videoData.thumbnail ? (
                  <img
                    src={videoData.thumbnail}
                    alt={videoData.title}
                    className="w-full rounded-xl object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold mb-2 truncate">{videoData.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  By {videoData.uploader || 'Unknown'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <FiClock className="inline mr-1" />
                  Duration: {formatTime(videoData.duration)}
                </p>
                {videoData.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {videoData.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Trim controls */}
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
              <FiClock />
              <span>Trim Video</span>
            </h3>

            {/* Slider */}
            <div className="mb-6">
              <div
                ref={sliderRef}
                className="relative h-10 bg-gray-200 dark:bg-dark-700 rounded-full cursor-pointer select-none touch-none"
                onMouseDown={handleSliderMouseDown}
                onTouchStart={handleSliderMouseDown}
              >
                {/* Selected range */}
                <div
                  className="absolute top-0 h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full opacity-30"
                  style={{
                    left: `${(trimStart / (videoData.duration || 1)) * 100}%`,
                    width: `${((trimEnd - trimStart) / (videoData.duration || 1)) * 100}%`,
                  }}
                />

                {/* Start handle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-primary-500 rounded-full shadow-glow border-2 border-white dark:border-dark-900 cursor-grab z-10"
                  style={{ left: `calc(${(trimStart / (videoData.duration || 1)) * 100}% - 10px)` }}
                />

                {/* End handle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-primary-700 rounded-full shadow-glow border-2 border-white dark:border-dark-900 cursor-grab z-10"
                  style={{ left: `calc(${(trimEnd / (videoData.duration || 1)) * 100}% - 10px)` }}
                />
              </div>

              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{formatTime(0)}</span>
                <span>{formatTime(videoData.duration)}</span>
              </div>
            </div>

            {/* Manual time inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Start Time
                </label>
                <input
                  type="text"
                  value={trimStartStr}
                  onChange={(e) => handleStartTimeInput(e.target.value)}
                  placeholder="HH:MM:SS"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  End Time
                </label>
                <input
                  type="text"
                  value={trimEndStr}
                  onChange={(e) => handleEndTimeInput(e.target.value)}
                  placeholder="HH:MM:SS"
                  className="input-field"
                />
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Selected: {formatTime(trimStart)} - {formatTime(trimEnd)} ({formatTime(trimEnd - trimStart)} duration)
            </p>
          </div>

          {/* Format & Quality */}
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Format & Quality</h3>

            {/* Format toggle */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setFormat('mp4')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  format === 'mp4'
                    ? 'bg-gradient-primary text-dark-900 shadow-glow'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                }`}
              >
                <FiFilm size={18} />
                <span>MP4 Video</span>
              </button>
              <button
                onClick={() => setFormat('mp3')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  format === 'mp3'
                    ? 'bg-gradient-primary text-dark-900 shadow-glow'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                }`}
              >
                <FiMusic size={18} />
                <span>MP3 Audio</span>
              </button>
            </div>

            {/* Quality selection */}
            {format === 'mp4' && videoData.formats && (
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                  Select Resolution
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {videoData.formats.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleQualitySelect(q)}
                      className={`relative p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        selectedQuality?.quality === q.quality
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : q.isLocked
                            ? 'border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'border-gray-200 dark:border-dark-600 hover:border-primary-400 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{q.quality}</span>
                        {q.isLocked && <FiLock size={14} className="text-gray-400" />}
                      </div>
                      {q.requiresPremium && (
                        <span className="absolute -top-2 -right-2 bg-gradient-primary text-dark-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          PRO
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {videoData.maxVideoHeight && (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <FiInfo size={14} />
                    This video supports up to {videoData.maxVideoHeight}p resolution
                  </p>
                )}
              </div>
            )}

            {/* FPS selection */}
            {format === 'mp4' && videoData.fpsOptions && videoData.fpsOptions.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                  Select Frame Rate (FPS)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {videoData.fpsOptions.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => handleFpsSelect(f)}
                      className={`relative p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        selectedFps?.fps === f.fps
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : f.isLocked
                            ? 'border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'border-gray-200 dark:border-dark-600 hover:border-primary-400 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{f.fps} FPS</span>
                        {f.isLocked && <FiLock size={14} className="text-gray-400" />}
                      </div>
                      {f.requiresPremium && (
                        <span className="absolute -top-2 -right-2 bg-gradient-primary text-dark-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          PRO
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {videoData.maxVideoFps && (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <FiInfo size={14} />
                    This video supports up to {videoData.maxVideoFps} FPS
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Download button */}
          <div className="space-y-3">
            <button
              onClick={handleDownload}
              disabled={downloading || !selectedQuality}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <div className="w-6 h-6 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FiDownload size={22} />
                  <span>Download {format.toUpperCase()}</span>
                </>
              )}
            </button>

            {/* Progress bar */}
            {(downloading || progress === 100) && (
              <div className="card p-4 animate-slide-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {progressStage}
                  </span>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    {progress}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      progress === 100
                        ? 'bg-green-500'
                        : 'bg-gradient-to-r from-primary-500 to-primary-700'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {downloading && progress < 90 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Please don't close this page while processing...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade prompt modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="card p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiLock size={28} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Premium Feature</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {!isAuthenticated
                  ? 'Please log in and subscribe to access higher quality downloads (1080p, 1440p, 4K) and higher frame rates.'
                  : 'Upgrade to Premium to access higher quality downloads (1080p, 1440p, 4K) and higher frame rates.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <a
                  href={isAuthenticated ? '/pricing' : '/login'}
                  className="btn-primary flex-1 text-center"
                >
                  {isAuthenticated ? 'View Plans' : 'Log In'}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating popup */}
      {showRating && (
        <RatingPopup onClose={() => setShowRating(false)} />
      )}
    </div>
  );
};

export default DownloadTool;
