// _routerAdapter.js - Adapter to convert Express routers to serverless functions
const { applyCors, handleCors } = require('./_utils');

/**
 * Converts an Express router to a Vercel serverless function
 * @param {Router} router - Express router instance
 * @returns {Function} - Serverless function
 */
function routerToServerless(router) {
  return async (req, res) => {
    try {
      // Apply CORS
      await applyCors(req, res);
      
      // Handle preflight
      if (handleCors(req, res)) return;

      // Parse URL to extract path components
      const url = new URL(req.url, 'http://localhost');
      const pathSegments = url.pathname.split('/').filter(Boolean);
      
      // Remove 'api' prefix if present
      const apiIndex = pathSegments.indexOf('api');
      if (apiIndex !== -1) {
        pathSegments.splice(0, apiIndex + 1);
      }
      
      // Reconstruct the path for the router
      const routerPath = '/' + pathSegments.join('/');
      
      // Create a new URL with the cleaned path
      const cleanUrl = new URL(routerPath, 'http://localhost');
      req.url = cleanUrl.pathname + cleanUrl.search;
      
      // Create mock Express app for the router
      const mockApp = {
        use: () => {},
        locals: {}
      };
      
      // Add Express-like properties to req
      req.app = mockApp;
      req.baseUrl = '';
      req.originalUrl = req.url;
      req.path = cleanUrl.pathname;
      req.params = {};
      req.query = Object.fromEntries(cleanUrl.searchParams);
      
      // Add Express-like methods to res
      if (!res.locals) res.locals = {};
      if (!res.status) {
        res.status = function(code) {
          res.statusCode = code;
          return res;
        };
      }
      
      // Execute the router
      await new Promise((resolve, reject) => {
        router(req, res, (err) => {
          if (err) {
            console.error('Router error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

    } catch (error) {
      console.error('Router adapter error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  };
}

module.exports = { routerToServerless }; 