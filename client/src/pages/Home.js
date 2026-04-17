import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiDownload, FiScissors, FiZap, FiShield, FiStar, FiArrowRight } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';
import api from '../utils/api';

const Home = () => {
  const [stats, setStats] = useState({ avgRating: 0, totalRatings: 0 });

  useEffect(() => {
    api.get('/ratings?limit=3').then(res => {
      setStats({
        avgRating: res.data.averageRating,
        totalRatings: res.data.totalRatings,
        testimonials: res.data.ratings,
      });
    }).catch(() => {});
  }, []);

  const features = [
    { icon: <FiDownload size={28} />, title: 'Download Videos', desc: 'Paste any video URL and download in your preferred format and quality.' },
    { icon: <FiScissors size={28} />, title: 'Trim & Cut', desc: 'Use our precision trimmer to extract exactly the portion you need.' },
    { icon: <FiZap size={28} />, title: 'Multiple Formats', desc: 'Download as MP4 video or MP3 audio. Choose quality up to 4K.' },
    { icon: <FiShield size={28} />, title: 'Safe & Secure', desc: 'Your data is protected. Files are auto-deleted after processing.' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/50 via-transparent to-primary-50/30 dark:from-primary-900/20 dark:via-transparent dark:to-primary-900/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-primary-100 dark:bg-primary-900/30 px-4 py-2 rounded-full mb-6">
              <FiZap className="text-primary-600" />
              <span className="text-sm font-medium text-primary-800 dark:text-primary-300">Free to use, no signup required</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-6 leading-tight">
              Download & Trim
              <span className="block gradient-text">Videos Instantly</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              Paste a video URL, select your trim points, choose your format, and download.
              It's that simple. Free up to 720p, premium for 4K.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/tool" className="btn-primary text-lg px-8 py-3.5 flex items-center space-x-2">
                <span>Start Trimming</span>
                <FiArrowRight />
              </Link>
              <Link to="/pricing" className="btn-outline text-lg px-8 py-3.5">
                View Plans
              </Link>
            </div>

            {stats.totalRatings > 0 && (
              <div className="mt-10 flex items-center justify-center space-x-2">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <FiStar key={s} size={18} className={s <= Math.round(stats.avgRating) ? 'text-primary-500 fill-primary-500' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.avgRating} avg from {stats.totalRatings} reviews
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-white dark:bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Powerful tools to download, trim, and convert videos from any platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="card-hover p-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-2xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 dark:text-gray-400">Three simple steps to get your trimmed video.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Paste URL', desc: 'Copy the video URL and paste it into our download tool.' },
              { step: '02', title: 'Set Trim Points', desc: 'Use our slider or manual input to select start and end times.' },
              { step: '03', title: 'Download', desc: 'Choose your format and quality, then click download.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl text-dark-900 text-2xl font-bold mb-4 shadow-glow">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers comparison */}
      <section className="section-padding bg-white dark:bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Free vs Premium</h2>
            <p className="text-gray-600 dark:text-gray-400">Upgrade for higher quality and more features.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="card p-8">
              <h3 className="text-xl font-bold mb-4">Free Tier</h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center space-x-2"><span className="text-green-500">&#10003;</span><span>Up to 720p quality</span></li>
                <li className="flex items-center space-x-2"><span className="text-green-500">&#10003;</span><span>24fps maximum</span></li>
                <li className="flex items-center space-x-2"><span className="text-green-500">&#10003;</span><span>MP4 & MP3 formats</span></li>
                <li className="flex items-center space-x-2"><span className="text-green-500">&#10003;</span><span>Video trimming</span></li>
                <li className="flex items-center space-x-2"><span className="text-gray-300">&#10007;</span><span>No download history</span></li>
              </ul>
              <Link to="/tool" className="btn-secondary w-full text-center mt-6 block">
                Use Free
              </Link>
            </div>

            <div className="card p-8 border-2 border-primary-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-dark-900 px-4 py-1 rounded-full text-sm font-bold">
                POPULAR
              </div>
              <h3 className="text-xl font-bold mb-4">Premium</h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center space-x-2"><span className="text-green-500">&#10003;</span><span>Up to 4K quality</span></li>
                <li className="flex items-center space-x-2"><span className="text-green-500">&#10003;</span><span>High frame rates (60fps+)</span></li>
                <li className="flex items-center space-x-2"><span className="text-green-500">&#10003;</span><span>MP4 & MP3 formats</span></li>
                <li className="flex items-center space-x-2"><span className="text-green-500">&#10003;</span><span>Video trimming</span></li>
                <li className="flex items-center space-x-2"><span className="text-green-500">&#10003;</span><span>Download history</span></li>
              </ul>
              <Link to="/pricing" className="btn-primary w-full text-center mt-6 block">
                From $2/week
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Discord CTA */}
      <section className="section-padding">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card p-8 sm:p-12 bg-gradient-to-r from-indigo-600 to-purple-600 border-none text-white">
            <FaDiscord size={48} className="mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="mb-6 opacity-90">
              Get help, suggest features, and connect with other users on Discord.
            </p>
            <a
              href="https://discord.gg/SVbCbYQ7xN"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-white text-indigo-600 font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <FaDiscord size={20} />
              <span>Join Discord</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
