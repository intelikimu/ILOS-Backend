// _utils.js - Shared utilities for Vercel serverless functions
const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Apply CORS middleware
function applyCors(req, res) {
  return new Promise((resolve, reject) => {
    cors(corsOptions)(req, res, (result) => {
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve(result);
      }
    });
  });
}

// Handle preflight OPTIONS requests
function handleCors(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// Error handler
function handleError(res, error, message = 'Internal Server Error') {
  console.error(message, error);
  res.status(500).json({ 
    error: message, 
    details: error.message 
  });
}

// Success response
function sendSuccess(res, data, status = 200) {
  res.status(status).json(data);
}

// Validation error response
function sendValidationError(res, errors) {
  res.status(400).json({ errors });
}

// Not found response
function sendNotFound(res, message = 'Not found') {
  res.status(404).json({ message });
}

module.exports = {
  applyCors,
  handleCors,
  handleError,
  sendSuccess,
  sendValidationError,
  sendNotFound
}; 