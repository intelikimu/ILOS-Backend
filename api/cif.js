// api/cif.js - CIF details endpoint
const { applyCors, handleCors, sendSuccess, handleError } = require('./_utils');
const { fetchCifDetails } = require('../customerService');

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

    // Extract consumerId from URL path
    const url = new URL(req.url, 'http://localhost');
    const pathSegments = url.pathname.split('/');
    const consumerId = pathSegments[pathSegments.length - 1];

    if (!consumerId) {
      return res.status(400).json({ error: 'Consumer ID is required' });
    }

    const cifDetails = await fetchCifDetails(consumerId);
    sendSuccess(res, cifDetails);
  } catch (error) {
    handleError(res, error, 'Failed to fetch CIF details');
  }
}; 