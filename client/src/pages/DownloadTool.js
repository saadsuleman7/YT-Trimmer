import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiSearch, FiDownload, FiLock, FiMusic, FiFilm, FiClock } from 'react-icons/fi';
import api from '../utils/api';
import { formatTime, parseTime, isQualityLocked } from '../utils/helpers';
import RatingPopup from '../components/ratings/RatingPopup';

const DownloadTool = () => {
  const { isAuthenticated, isPremium } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [format, setFormat] = useState('mp4');
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [trimStartStr, setTrimStartStr] = useState('00:00:00');
  const [trimEndStr, setTrimEndStr] = useState('00:00:00');
  const [showRating, setShowRating] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const videoRef = useRef(null);
  const sliderRef = useRef(null);

  const fetchMetadata = async () => {
    if (!url.trim()) {
      toast.error('Please enter a video URL');
      return;
    }

    setLoading(true);
    setVideoData(null);

    try {
      const res = await api.post('/videos/metadata', { url: url.trim() });
      setVideoData(res.data);
      setTrimEnd(res.data.duration || 0);
      setTrimEndStr(formatTime(res.data.duration || 0));

      // Select default quality (best available for user tier)
      const available = res.data.formats.filter(f => !f.isLocked);
      if (available.length > 0) {
        setSelectedQuality(available[0]);
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

  const handleTrimStartChange = (value) => {
    const seconds = Math.max(0, Math.min(value, trimEnd - 1));
    setTrimStart(seconds);
    setTrimStartStr(formatTime(seconds));
  };

  const handleTrimEndChange = (value) => {
    const seconds = Math.max(trimStart + 1, Math.min(value, videoData?.duration || 0));
    setTrimEnd(seconds);
    setTrimEndStr(formatTime(seconds));
  };

  const handleStartTimeInput = (str) => {
    setTrimStartStr(str);
    const seconds = parseTime(str);
    if (!isNaN(seconds)) {
      setTrimStart(Math.max(0, Math.min(seconds, trimEnd - 1)));
    }
  };

  const handleEndTimeInput = (str) => {
    setTrimEndStr(str);
    const seconds = parseTime(str);
    if (!isNaN(seconds)) {
      setTrimEnd(Math.max(trimStart + 1, Math.min(seconds, videoData?.duration || 0)));
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
        fps: selectedQuality.fps || 24,
        trimStart,
        trimEnd,
        title: videoData.title,
        thumbnail: videoData.thumbnail,
      });

      // Trigger download
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

  const handleSliderChange = useCallback((e) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const time = percent * (videoData?.duration || 0);

    // Determine which handle is closer
    const distToStart = Math.abs(time - trimStart);
    const distToEnd = Math.abs(time - trimEnd);

    if (distToStart < distToEnd) {
      handleTrimStartChange(Math.floor(time));
    } else {
      handleTrimEndChange(Math.floor(time));
    }
  }, [trimStart, trimEnd, videoData]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
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
      <div className="card p-6 mb-6">
        <div className="flex gap-3">
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
            className="btn-primary flex items-center space-x-2 whitespace-nowrap"
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
          {/* Video preview */}
          <div className="card p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {videoData.thumbnail && (
                <div className="w-full md:w-72 flex-shrink-0">
                  <img
                    src={videoData.thumbnail}
                    alt={videoData.title}
                    className="w-full rounded-xl object-cover"
                  />
                </div>
              )}
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
                className="relative h-10 bg-gray-200 dark:bg-dark-700 rounded-full cursor-pointer select-none"
                onClick={handleSliderChange}
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
                  Select Quality
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
                      {q.fps && <span className="text-xs text-gray-500">{q.fps}fps</span>}
                      {q.requiresPremium && (
                        <span className="absolute -top-2 -right-2 bg-gradient-primary text-dark-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          PRO
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Download button */}
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
