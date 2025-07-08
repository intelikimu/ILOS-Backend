// api/personal-details.js - Personal details endpoint
const { routerToServerless } = require('./_routerAdapter');
const personalDetailsRouter = require('../routes/personalDetails');

module.exports = routerToServerless(personalDetailsRouter); 