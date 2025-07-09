const { handleCors, successResponse, errorResponse } = require('./_utils');
const { fetchCifDetails } = require('../customerService');

module.exports = async (req, res) => {
  // Handle CORS
  if (handleCors(req, res)) return;

  try {
    // Extract consumerId from URL path
    const urlParts = req.url.split('/').filter(Boolean);
    const consumerId = urlParts[urlParts.length - 1];
    
    if (!consumerId) {
      return errorResponse(res, 400, 'Consumer ID is required');
    }

    const cifDetails = await fetchCifDetails(consumerId);
    return successResponse(res, cifDetails);
    
  } catch (error) {
    console.error('Error fetching CIF details:', error);
    return errorResponse(res, 500, 'Failed to fetch CIF details', error.message);
  }
}; 