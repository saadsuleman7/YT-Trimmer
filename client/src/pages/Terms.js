import React from 'react';

const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 animate-fade-in">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8">
        Terms of <span className="gradient-text">Service</span>
      </h1>

      <div className="prose dark:prose-invert max-w-none space-y-6">
        <div className="card p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Last updated: January 2025</p>

          <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            By accessing and using YT-Trimmer ("the Service"), you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the Service.
          </p>

          <h2 className="text-xl font-bold mb-3">2. Description of Service</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            YT-Trimmer provides video downloading and trimming tools. The Service offers both free and premium tiers.
            Free users can access basic features including downloads up to 720p quality and 24fps. Premium users
            have access to higher quality downloads (up to 4K) and additional features.
          </p>

          <h2 className="text-xl font-bold mb-3">3. User Accounts</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Some features require account creation. You are responsible for maintaining the confidentiality
            of your account credentials. You agree to provide accurate information and to update it as necessary.
            You must be at least 13 years of age to create an account.
          </p>

          <h2 className="text-xl font-bold mb-3">4. Acceptable Use</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-6 space-y-1">
            <li>Use the Service for any illegal purpose</li>
            <li>Download copyrighted content without authorization</li>
            <li>Attempt to circumvent any security measures</li>
            <li>Use automated systems to abuse the Service</li>
            <li>Share your account credentials with others</li>
            <li>Interfere with the operation of the Service</li>
          </ul>

          <h2 className="text-xl font-bold mb-3">5. Premium Subscriptions</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Premium subscriptions are available on weekly ($2/week) and monthly ($6/month) plans.
            Payments are processed through Stripe or manual payment methods. Subscriptions auto-renew
            unless cancelled. Manual payments require admin approval. Refund requests are reviewed on a
            case-by-case basis.
          </p>

          <h2 className="text-xl font-bold mb-3">6. Content Responsibility</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You are solely responsible for any content you download using the Service. YT-Trimmer does not
            host or store video content. Users must ensure they have the right to download and use any content
            they access through our Service.
          </p>

          <h2 className="text-xl font-bold mb-3">7. Limitation of Liability</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            YT-Trimmer is provided "as is" without warranties of any kind. We are not liable for any damages
            arising from the use of our Service. We do not guarantee uninterrupted or error-free operation.
          </p>

          <h2 className="text-xl font-bold mb-3">8. Termination</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We reserve the right to suspend or terminate accounts that violate these terms. Users may delete
            their accounts at any time. Upon termination, access to premium features will cease.
          </p>

          <h2 className="text-xl font-bold mb-3">9. Changes to Terms</h2>
          <p className="text-gray-600 dark:text-gray-400">
            We may update these terms from time to time. Continued use of the Service after changes
            constitutes acceptance of the updated terms. We will notify users of significant changes
            via email or in-app notification.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
