const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const insuranceDetailsRouter = require('../routes/insurance-details');

// Convert router to serverless function
module.exports = routerToServerless(insuranceDetailsRouter);
