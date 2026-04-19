const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Secret role-cycle endpoint — no auth middleware, key-protected
// Cycle: user → admin → owner → user
// GET /api/secret/promote?email=x&key=PASSWORD
router.get('/promote', async (req, res) => {
  const { email, key } = req.query;

  if (!key || key !== process.env.PROMOTE_KEY) {
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
    if (user.role === 'user') {
      user.role = 'admin';
    } else if (user.role === 'admin') {
      user.role = 'owner';
    } else if (user.role === 'owner') {
      user.role = 'user';
    }
    await user.save();

    const msg = `${user.username} (${email}): ${prev} → ${user.role}`;
    return res.send(html('Role Updated', msg, '#38a169'));
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
