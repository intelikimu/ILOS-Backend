const { handleCors, errorResponse } = require('./_utils');

// Convert Express router to serverless function
const routerToServerless = (routerModule) => {
  return async (req, res) => {
    try {
      // Handle CORS
      if (handleCors(req, res)) return;

      // Create Express-like app mock
      const app = {
        get: (path, handler) => {
          if (req.method === 'GET' && matchPath(req.url, path)) {
            return handler(req, res);
          }
        },
        post: (path, handler) => {
          if (req.method === 'POST' && matchPath(req.url, path)) {
            return handler(req, res);
          }
        },
        put: (path, handler) => {
          if (req.method === 'PUT' && matchPath(req.url, path)) {
            return handler(req, res);
          }
        },
        delete: (path, handler) => {
          if (req.method === 'DELETE' && matchPath(req.url, path)) {
            return handler(req, res);
          }
        },
        use: (middleware) => {
          if (typeof middleware === 'function') {
            middleware(req, res, () => {});
          }
        }
      };

      // Set up params and query
      req.params = extractParams(req.url);
      req.query = extractQuery(req.url);

      // Execute the router
      routerModule(app);

      // If no route matched, return 404
      return errorResponse(res, 404, 'Route not found');

    } catch (error) {
      console.error('Router adapter error:', error);
      return errorResponse(res, 500, 'Internal server error', error.message);
    }
  };
};

// Helper function to match paths
const matchPath = (url, pattern) => {
  const urlParts = url.split('?')[0].split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  
  if (urlParts.length !== patternParts.length) {
    return false;
  }
  
  return patternParts.every((part, index) => {
    return part.startsWith(':') || part === urlParts[index];
  });
};

// Extract parameters from URL
const extractParams = (url) => {
  const params = {};
  const urlParts = url.split('?')[0].split('/').filter(Boolean);
  
  // Simple parameter extraction - can be enhanced based on needs
  if (urlParts.length > 2) {
    params.id = urlParts[urlParts.length - 1];
  }
  
  return params;
};

// Extract query parameters
const extractQuery = (url) => {
  const query = {};
  const queryString = url.split('?')[1];
  
  if (queryString) {
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      query[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
  }
  
  return query;
};

module.exports = { routerToServerless }; 