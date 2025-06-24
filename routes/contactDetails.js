const express = require('express');
const router = express.Router();
const db = require('../db');
const { z } = require('zod');

const contactSchema = z.object({
  loan_application_id: z.number().int(),
  phone_current: z.string(),
  phone_permanent: z.string(),
  mobile: z.string(),
  email: z.string().email()
});

// POST
router.post('/', async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;
  try {
    const result = await db.query(
      `INSERT INTO contact_details (
        loan_application_id, phone_current, phone_permanent, mobile, email
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [d.loan_application_id, d.phone_current, d.phone_permanent, d.mobile, d.email]
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
    const result = await db.query('SELECT * FROM contact_details ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM contact_details WHERE id = $1', [req.params.id]);
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
    await db.query('DELETE FROM contact_details WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT
router.put('/:id', async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;
  try {
    const result = await db.query(
      `UPDATE contact_details SET
        loan_application_id = $1,
        phone_current = $2,
        phone_permanent = $3,
        mobile = $4,
        email = $5
      WHERE id = $6 RETURNING *`,
      [d.loan_application_id, d.phone_current, d.phone_permanent, d.mobile, d.email, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
