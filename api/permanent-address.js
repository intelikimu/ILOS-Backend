const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const permanentAddressRouter = require('../routes/permanent-address');

// Convert router to serverless function
module.exports = routerToServerless(permanentAddressRouter);
