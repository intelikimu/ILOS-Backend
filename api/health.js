// api/health.js - Health check endpoint
const { applyCors, handleCors, sendSuccess } = require('./_utils');

module.exports = async (req, res) => {
  try {
    // Apply CORS
    await applyCors(req, res);
    
    // Handle preflight
    if (handleCors(req, res)) return;

    // Only accept GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Health check response
    sendSuccess(res, {
      status: 'OK',
      message: 'ILOS Backend Serverless Functions are running',
      timestamp: new Date().toISOString(),
      vercel: true
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
}; 