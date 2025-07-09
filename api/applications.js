const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const applicationsRouter = require('../routes/applications');

// Convert router to serverless function
module.exports = routerToServerless(applicationsRouter); 