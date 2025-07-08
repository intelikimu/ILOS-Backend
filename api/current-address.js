// api/current-address.js - current address endpoint
const { routerToServerless } = require('./_routerAdapter');
const currentAddressRouter = require('../routes/currentAddress');

module.exports = routerToServerless(currentAddressRouter);
