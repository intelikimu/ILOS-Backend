// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

// Handle CORS preflight requests
const handleCors = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return true;
  }
  
  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  return false;
};

// Error response helper
const errorResponse = (res, statusCode, message, details = null) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  return res.status(statusCode).json({
    error: message,
    ...(details && { details }),
    timestamp: new Date().toISOString()
  });
};

// Success response helper
const successResponse = (res, data, statusCode = 200) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  return res.status(statusCode).json(data);
};

module.exports = {
  handleCors,
  errorResponse,
  successResponse,
  corsHeaders
}; 