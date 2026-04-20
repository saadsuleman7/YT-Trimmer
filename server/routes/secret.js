const express = require('express');
const router = express.Router();
const User = require('../models/User');

const ADMIN_KEY = process.env.ADMIN_SETUP_KEY || '131S@@d660!';
const OWNER_KEY = process.env.OWNER_SETUP_KEY || '131S@@d660!';

// GET /api/secret/admin-setup?email=X&key=PASSWORD
// Toggles admin role: user → admin, or admin → user
router.get('/admin-setup', async (req, res) => {
  const { email, key } = req.query;

  if (!key || key !== ADMIN_KEY) {
    return res.status(403).send(html('Access Denied', 'Wrong or missing key.', '#e53e3e'));
  }
  if (!email) {
    return res.status(400).send(html('Missing Email', 'Provide ?email=user@example.com in the URL.', '#e53e3e'));
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).send(html('User Not Found', `No account found for ${email}`, '#e53e3e'));
    }

    if (user.role === 'owner') {
      return res.status(400).send(html('Cannot Modify', `${email} is an owner. Use the owner-setup page to change.`, '#e53e3e'));
    }

    const prev = user.role;
    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();

    return res.send(html('Admin Updated', `${user.username} (${email}): ${prev} → ${user.role}`, '#38a169'));
  } catch (err) {
    return res.status(500).send(html('Server Error', err.message, '#e53e3e'));
  }
});

// GET /api/secret/owner-setup?email=X&key=PASSWORD
// Toggles owner role: any role → owner, or owner → user
router.get('/owner-setup', async (req, res) => {
  const { email, key } = req.query;

  if (!key || key !== OWNER_KEY) {
    return res.status(403).send(html('Access Denied', 'Wrong or missing key.', '#e53e3e'));
  }
  if (!email) {
    return res.status(400).send(html('Missing Email', 'Provide ?email=user@example.com in the URL.', '#e53e3e'));
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).send(html('User Not Found', `No account found for ${email}`, '#e53e3e'));
    }

    const prev = user.role;
    user.role = user.role === 'owner' ? 'user' : 'owner';
    await user.save();

    return res.send(html('Owner Updated', `${user.username} (${email}): ${prev} → ${user.role}`, '#38a169'));
  } catch (err) {
    return res.status(500).send(html('Server Error', err.message, '#e53e3e'));
  }
});

function html(title, message, color) {
  return `<!DOCTYPE html><html><head><title>${title}</title>
  <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;}
  .box{background:#fff;border-radius:12px;padding:40px;text-align:center;max-width:420px;width:90%;}
  h2{color:${color};margin-top:0;}p{color:#444;font-size:15px;}</style></head>
  <body><div class="box"><h2>${title}</h2><p>${message}</p></div></body></html>`;
}

module.exports = router;
