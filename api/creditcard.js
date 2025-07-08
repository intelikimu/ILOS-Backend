// api/creditcard.js - creditcard endpoint
const { routerToServerless } = require('./_routerAdapter');
const creditcardRouter = require('../routes/creditcard');

module.exports = routerToServerless(creditcardRouter);
