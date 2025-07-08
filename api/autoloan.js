// api/autoloan.js - Auto loan endpoint
const { routerToServerless } = require('./_routerAdapter');
const autoLoanRouter = require('../routes/autoloan');

module.exports = routerToServerless(autoLoanRouter); 