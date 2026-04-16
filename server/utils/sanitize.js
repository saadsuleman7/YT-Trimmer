// Sanitize user input to prevent XSS and injection
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

// Validate and sanitize URL - prevent command injection
const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Block shell metacharacters
  if (/[;&|`$(){}[\]\\!#]/.test(trimmed)) {
    return null;
  }

  // Must be a valid URL pattern
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
};

// Sanitize filename
const sanitizeFilename = (name) => {
  if (typeof name !== 'string') return 'download';
  return name
    .replace(/[^a-zA-Z0-9._-\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 200);
};

module.exports = { sanitizeInput, sanitizeUrl, sanitizeFilename };
