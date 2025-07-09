const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const employmentDetailsRouter = require('../routes/employment-details');

// Convert router to serverless function
module.exports = routerToServerless(employmentDetailsRouter);
