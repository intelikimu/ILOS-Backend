// api/customers.js
const db = require('../db');
const { getCustomer } = require('../customerService');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const customer = await getCustomer(req.query.id);
    return res.status(200).json(customer);
  }
  res.status(405).end(); // Method Not Allowed
}
