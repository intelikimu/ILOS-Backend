const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const vehicleDetailsRouter = require('../routes/vehicle-details');

// Convert router to serverless function
module.exports = routerToServerless(vehicleDetailsRouter);
