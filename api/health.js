const { handleCors, successResponse } = require('./_utils');

module.exports = async (req, res) => {
  // Handle CORS
  if (handleCors(req, res)) return;

  return successResponse(res, {
    status: 'OK',
    message: 'ILOS Backend Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}; 