const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const contactDetailsRouter = require('../routes/contact-details');

// Convert router to serverless function
module.exports = routerToServerless(contactDetailsRouter);
