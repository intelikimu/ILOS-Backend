const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const autoloanRouter = require('../routes/autoloan');

// Convert router to serverless function
module.exports = routerToServerless(autoloanRouter);
