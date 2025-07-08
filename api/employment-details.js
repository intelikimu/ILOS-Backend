// api/employment-details.js - employment details endpoint
const { routerToServerless } = require('./_routerAdapter');
const employmentDetailsRouter = require('../routes/employmentDetails');

module.exports = routerToServerless(employmentDetailsRouter);
