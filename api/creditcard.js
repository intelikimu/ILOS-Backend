const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const creditcardRouter = require('../routes/creditcard');

// Convert router to serverless function
module.exports = routerToServerless(creditcardRouter);
