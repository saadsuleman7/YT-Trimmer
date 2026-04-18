const cron = require('node-cron');
const User = require('../models/User');
const { sendExpiryWarningEmail, sendExpiredEmail } = require('./emailService');

const runCheck = async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const expired = await User.find({ isPremium: true, premiumExpiry: { $lte: now } });
    for (const user of expired) {
      user.isPremium = false;
      user.premiumPlan = null;
      user.warningEmailSent = false;
      await user.save();
      await sendExpiredEmail(user);
    }

    const expiringSoon = await User.find({
      isPremium: true,
      premiumExpiry: { $lte: threeDaysFromNow, $gt: now },
      warningEmailSent: false,
    });
    for (const user of expiringSoon) {
      await sendExpiryWarningEmail(user);
      user.warningEmailSent = true;
      await user.save();
    }

    if (expired.length || expiringSoon.length) {
      console.log(`[Cron] Expired ${expired.length} subscriptions, warned ${expiringSoon.length} users`);
    }
  } catch (err) {
    console.error('[Cron] Subscription check failed:', err.message);
  }
};

cron.schedule('0 0 * * *', runCheck);
runCheck();
