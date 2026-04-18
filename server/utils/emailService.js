const nodemailer = require('nodemailer');

const DISCORD_URL = 'https://discord.gg/SVbCbYQ7xN';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
};

const sendEmail = async (to, subject, html) => {
  const t = getTransporter();
  if (!t) {
    console.warn('[Email] SMTP not configured — skipping email to', to);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || `"YT-Trimmer" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
  }
};

const wrap = (body) => `
  <div style="font-family:Arial,sans-serif;background:#0f0f23;color:#e2e8f0;padding:40px 20px;">
    <div style="max-width:500px;margin:0 auto;background:#1a1a3e;border-radius:16px;padding:40px;border:1px solid #2d2d5e;">
      ${body}
      <p style="color:#555;font-size:12px;margin-top:32px;border-top:1px solid #2d2d5e;padding-top:16px;">
        YT-Trimmer &copy; ${new Date().getFullYear()} &nbsp;|&nbsp;
        <a href="${DISCORD_URL}" style="color:#f59e0b;text-decoration:none;">Join Discord for support</a>
      </p>
    </div>
  </div>`;

const sendApprovalEmail = async (user, payment) => {
  const planLabel = payment.plan === 'weekly' ? 'Weekly' : 'Monthly';
  await sendEmail(user.email, 'Your YT-Trimmer Premium is Active!', wrap(`
    <h1 style="color:#f59e0b;margin-top:0;">Premium Activated!</h1>
    <p>Hi ${user.username},</p>
    <p>Your <strong>${planLabel} Premium</strong> is now active. You can now enjoy 4K quality, high frame rates, and download history.</p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/tool"
       style="display:inline-block;background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">
      Start Downloading
    </a>
  `));
};

const sendRejectionEmail = async (user, payment) => {
  await sendEmail(user.email, 'YT-Trimmer Payment Update', wrap(`
    <h1 style="color:#ef4444;margin-top:0;">Payment Not Approved</h1>
    <p>Hi ${user.username},</p>
    <p>Your payment submission could not be approved.</p>
    ${payment.adminNotes ? `<p><strong>Reason:</strong> ${payment.adminNotes}</p>` : ''}
    <p>If you believe this is a mistake, please <a href="${DISCORD_URL}" style="color:#f59e0b;">join our Discord</a> for help.</p>
  `));
};

const sendExpiryWarningEmail = async (user) => {
  const daysLeft = Math.ceil((new Date(user.premiumExpiry) - new Date()) / (1000 * 60 * 60 * 24));
  await sendEmail(user.email, 'Your YT-Trimmer Premium Expires Soon', wrap(`
    <h1 style="color:#f59e0b;margin-top:0;">Premium Expiring Soon</h1>
    <p>Hi ${user.username},</p>
    <p>Your Premium subscription expires in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/pricing"
       style="display:inline-block;background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">
      Renew Now
    </a>
  `));
};

const sendExpiredEmail = async (user) => {
  await sendEmail(user.email, 'Your YT-Trimmer Premium Has Expired', wrap(`
    <h1 style="color:#64748b;margin-top:0;">Premium Expired</h1>
    <p>Hi ${user.username},</p>
    <p>Your Premium subscription has expired. You've been moved back to the free plan.</p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/pricing"
       style="display:inline-block;background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">
      Renew Premium
    </a>
  `));
};

module.exports = { sendApprovalEmail, sendRejectionEmail, sendExpiryWarningEmail, sendExpiredEmail };
