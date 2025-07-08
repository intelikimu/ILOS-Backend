// api/contact-details.js - contact details endpoint
const { routerToServerless } = require('./_routerAdapter');
const contactDetailsRouter = require('../routes/contactDetails');

module.exports = routerToServerless(contactDetailsRouter);
