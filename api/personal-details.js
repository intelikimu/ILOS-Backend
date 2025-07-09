const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const personalDetailsRouter = require('../routes/personal-details');

// Convert router to serverless function
module.exports = routerToServerless(personalDetailsRouter);
