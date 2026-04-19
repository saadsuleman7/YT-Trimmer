import React from 'react';
import SEO from '../components/SEO';

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 animate-fade-in">
      <SEO
        title="Privacy Policy"
        description="Read YT-Trimmer's privacy policy. Learn how we handle your data, protect your privacy, and ensure files are automatically deleted after processing."
        canonical="/privacy"
      />
      <h1 className="text-3xl sm:text-4xl font-bold mb-8">
        Privacy <span className="gradient-text">Policy</span>
      </h1>

      <div className="prose dark:prose-invert max-w-none space-y-6">
        <div className="card p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Last updated: January 2025</p>

          <h2 className="text-xl font-bold mb-3">1. Information We Collect</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">We collect the following types of information:</p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-6 space-y-1">
            <li><strong>Account Information:</strong> Username, email address, and encrypted password when you create an account.</li>
            <li><strong>Usage Data:</strong> Download history, video URLs processed, quality selections, and timestamps.</li>
            <li><strong>Payment Information:</strong> Processed securely through Stripe. We do not store credit card details.</li>
            <li><strong>Technical Data:</strong> IP address, browser type, and device information for security and analytics.</li>
          </ul>

          <h2 className="text-xl font-bold mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-6 space-y-1">
            <li>To provide and maintain the Service</li>
            <li>To process payments and manage subscriptions</li>
            <li>To display your download history (for logged-in users)</li>
            <li>To improve the Service and user experience</li>
            <li>To detect and prevent abuse or fraud</li>
            <li>To communicate important updates about the Service</li>
          </ul>

          <h2 className="text-xl font-bold mb-3">3. Data Storage & Security</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your account data is stored securely in our database. Passwords are hashed using bcrypt.
            Downloaded video files are temporarily stored on our servers and automatically deleted
            within one hour of processing. We implement industry-standard security measures to protect
            your data.
          </p>

          <h2 className="text-xl font-bold mb-3">4. Data Sharing</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We do not sell your personal data to third parties. We may share data with:
            Stripe for payment processing, and law enforcement when legally required.
            Anonymous, aggregated statistics may be used for analytics.
          </p>

          <h2 className="text-xl font-bold mb-3">5. Cookies & Local Storage</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We use local storage to save your theme preference and authentication token.
            We do not use third-party tracking cookies. Essential cookies may be used for
            session management and security.
          </p>

          <h2 className="text-xl font-bold mb-3">6. Your Rights</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-6 space-y-1">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Export your data</li>
            <li>Opt out of non-essential communications</li>
          </ul>

          <h2 className="text-xl font-bold mb-3">7. Guest Users</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Guest users (without accounts) can use basic features. We may collect IP addresses
            and usage data for rate limiting and abuse prevention. No personal data is stored
            for guest users.
          </p>

          <h2 className="text-xl font-bold mb-3">8. Contact</h2>
          <p className="text-gray-600 dark:text-gray-400">
            For privacy-related questions or requests, contact us at privacy@yt-trimmer.com
            or through our Contact page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
