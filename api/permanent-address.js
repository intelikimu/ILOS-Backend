// api/permanent-address.js - permanent address endpoint
const { routerToServerless } = require('./_routerAdapter');
const permanentAddressRouter = require('../routes/permanentAddress');

module.exports = routerToServerless(permanentAddressRouter);
