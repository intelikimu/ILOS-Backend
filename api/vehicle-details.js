// api/vehicle-details.js - vehicle details endpoint
const { routerToServerless } = require('./_routerAdapter');
const vehicleDetailsRouter = require('../routes/vehicleDetails');

module.exports = routerToServerless(vehicleDetailsRouter);
