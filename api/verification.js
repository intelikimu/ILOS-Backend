// api/verification.js - verification endpoint
const { routerToServerless } = require('./_routerAdapter');
const verificationRouter = require('../routes/verification');

module.exports = routerToServerless(verificationRouter);
