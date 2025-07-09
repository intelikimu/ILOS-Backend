const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const verificationRouter = require('../routes/verification');

// Convert router to serverless function
module.exports = routerToServerless(verificationRouter);
