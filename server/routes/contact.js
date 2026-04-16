const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const Contact = require('../models/Contact');
const validate = require('../middleware/validate');
const { sanitizeInput } = require('../utils/sanitize');

// POST /api/contact
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('subject').trim().isLength({ min: 2, max: 200 }).withMessage('Subject is required'),
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters'),
], validate, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    await Contact.create({
      name: sanitizeInput(name),
      email,
      subject: sanitizeInput(subject),
      message: sanitizeInput(message),
    });

    res.status(201).json({ message: 'Message sent successfully. We will get back to you soon!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
