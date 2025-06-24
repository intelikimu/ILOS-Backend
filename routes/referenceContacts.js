const express = require('express');
const router = express.Router();
const db = require('../db');
const { z } = require('zod');

const referenceSchema = z.object({
  loan_application_id: z.number().int(),
  title: z.string(),
  first_name: z.string(),
  middle_name: z.string(),
  last_name: z.string(),
  gender: z.string(),
  relationship: z.string(),
  new_nic: z.string(),
  house_flat_shop_no: z.string(),
  street: z.string(),
  tehsil_district_area: z.string(),
  address: z.string(),
  nearest_landmark: z.string(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  phone_residence: z.string(),
  phone_office: z.string(),
  mobile_no: z.string(),
  email_address: z.string().email()
});

// POST
router.post('/', async (req, res) => {
  const parsed = referenceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;
  try {
    const result = await db.query(
      `INSERT INTO reference_contacts (
        loan_application_id, title, first_name, middle_name, last_name,
        gender, relationship, new_nic, house_flat_shop_no, street,
        tehsil_district_area, address, nearest_landmark, country, state,
        city, phone_residence, phone_office, mobile_no, email_address
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20
      ) RETURNING *`,
      Object.values(d)
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
    const result = await db.query('SELECT * FROM reference_contacts ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM reference_contacts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fetch by ID error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM reference_contacts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT
router.put('/:id', async (req, res) => {
  const parsed = referenceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;
  try {
    const result = await db.query(
      `UPDATE reference_contacts SET
        loan_application_id = $1, title = $2, first_name = $3, middle_name = $4, last_name = $5,
        gender = $6, relationship = $7, new_nic = $8, house_flat_shop_no = $9, street = $10,
        tehsil_district_area = $11, address = $12, nearest_landmark = $13, country = $14, state = $15,
        city = $16, phone_residence = $17, phone_office = $18, mobile_no = $19, email_address = $20
      WHERE id = $21 RETURNING *`,
      [...Object.values(d), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
