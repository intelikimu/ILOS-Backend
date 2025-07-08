// api/insurance-details.js - insurance details endpoint
const { routerToServerless } = require('./_routerAdapter');
const insuranceDetailsRouter = require('../routes/insuranceDetails');

module.exports = routerToServerless(insuranceDetailsRouter);
