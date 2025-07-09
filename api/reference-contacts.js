const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const referenceContactsRouter = require('../routes/reference-contacts');

// Convert router to serverless function
module.exports = routerToServerless(referenceContactsRouter);
