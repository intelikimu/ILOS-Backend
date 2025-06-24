const express = require('express');
const router = express.Router();
const db = require('../db');
const { z } = require('zod');

// Zod schema
const permanentAddressSchema = z.object({
  loan_application_id: z.number().int(),
  same_as_current: z.boolean(),
  house_flat_shop_no: z.string(),
  street: z.string(),
  tehsil_district: z.string(),
  address_4: z.string(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  post_code: z.string()
});

// POST - create
router.post('/', async (req, res) => {
  const parsed = permanentAddressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;

  try {
    const result = await db.query(
      `INSERT INTO permanent_address (
        loan_application_id, same_as_current, house_flat_shop_no, street, tehsil_district,
        address_4, country, state, city, post_code
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        d.loan_application_id, d.same_as_current, d.house_flat_shop_no, d.street,
        d.tehsil_district, d.address_4, d.country, d.state, d.city, d.post_code
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Insert error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET all
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM permanent_address ORDER BY id DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM permanent_address WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fetch by ID error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE by ID
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM permanent_address WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT - update by ID
router.put('/:id', async (req, res) => {
  const parsed = permanentAddressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;
  const id = req.params.id;

  try {
    const result = await db.query(
      `UPDATE permanent_address SET
        loan_application_id = $1,
        same_as_current = $2,
        house_flat_shop_no = $3,
        street = $4,
        tehsil_district = $5,
        address_4 = $6,
        country = $7,
        state = $8,
        city = $9,
        post_code = $10
      WHERE id = $11
      RETURNING *`,
      [
        d.loan_application_id, d.same_as_current, d.house_flat_shop_no, d.street,
        d.tehsil_district, d.address_4, d.country, d.state, d.city, d.post_code, id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
