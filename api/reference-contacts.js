// api/reference-contacts.js - reference contacts endpoint
const { routerToServerless } = require('./_routerAdapter');
const referenceContactsRouter = require('../routes/referenceContacts');

module.exports = routerToServerless(referenceContactsRouter);
