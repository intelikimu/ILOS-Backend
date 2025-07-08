// api/cashplus.js - cashplus endpoint
const { routerToServerless } = require('./_routerAdapter');
const cashplusRouter = require('../routes/cashplus');

module.exports = routerToServerless(cashplusRouter);
