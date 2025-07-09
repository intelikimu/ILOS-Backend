const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const currentAddressRouter = require('../routes/current-address');

// Convert router to serverless function
module.exports = routerToServerless(currentAddressRouter);
