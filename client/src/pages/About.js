import React from 'react';
import { Link } from 'react-router-dom';
import { FiTarget, FiHeart, FiShield, FiZap } from 'react-icons/fi';

const About = () => {
  const values = [
    { icon: <FiTarget size={24} />, title: 'Mission-Driven', desc: 'We believe everyone should have access to simple, powerful video tools without complex software.' },
    { icon: <FiHeart size={24} />, title: 'User-First', desc: 'Every feature we build starts with user feedback and is designed for the best possible experience.' },
    { icon: <FiShield size={24} />, title: 'Privacy Focused', desc: 'We don\'t store your videos. Files are automatically deleted after processing for your security.' },
    { icon: <FiZap size={24} />, title: 'Performance', desc: 'Optimized processing pipeline ensures fast downloads and trims, even for large videos.' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-primary-50 to-white dark:from-dark-900 dark:to-dark-950">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold mb-6">
            About <span className="gradient-text">YT-Trimmer</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            YT-Trimmer is a modern video download and trimming platform built for simplicity and speed.
            We make it easy to extract exactly the portion of any video you need, in the format and quality you want.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Our Story</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                YT-Trimmer was born from a simple frustration: existing video download tools were either
                too complicated, full of ads, or lacked basic trimming functionality.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We set out to build a clean, modern platform that combines downloading and trimming
                into one seamless experience. Whether you're a content creator, student, or casual user,
                YT-Trimmer gives you the tools you need without the hassle.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Our freemium model ensures everyone can access basic features, while premium users
                enjoy higher quality outputs and additional features.
              </p>
            </div>
            <div className="card p-8 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-800">
              <div className="space-y-6">
                <div>
                  <p className="text-3xl font-bold gradient-text">10K+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Videos processed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold gradient-text">5K+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Happy users</p>
                </div>
                <div>
                  <p className="text-3xl font-bold gradient-text">99.9%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-white dark:bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <div key={i} className="card-hover p-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-2xl mb-4">
                  {value.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Try YT-Trimmer for free. No signup required.
          </p>
          <Link to="/tool" className="btn-primary text-lg px-8 py-3.5">
            Start Trimming Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
