const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const cashplusRouter = require('../routes/cashplus');

// Convert router to serverless function
module.exports = routerToServerless(cashplusRouter);
