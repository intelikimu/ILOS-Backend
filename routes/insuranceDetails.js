const express = require('express');
const router = express.Router();
const db = require('../db');
const { z } = require('zod');

const insuranceSchema = z.object({
  loan_application_id: z.number().int(),
  deductable_amount_currency: z.string(),
  deductible_amount: z.number(),
  insurance_company: z.string(),
  rate: z.number()
});

// POST
router.post('/', async (req, res) => {
  const parsed = insuranceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;
  try {
    const result = await db.query(
      `INSERT INTO insurance_details (
        loan_application_id, deductable_amount_currency, deductible_amount,
        insurance_company, rate
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [d.loan_application_id, d.deductable_amount_currency, d.deductible_amount, d.insurance_company, d.rate]
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
    const result = await db.query('SELECT * FROM insurance_details ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM insurance_details WHERE id = $1', [req.params.id]);
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
    await db.query('DELETE FROM insurance_details WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT
router.put('/:id', async (req, res) => {
  const parsed = insuranceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;
  try {
    const result = await db.query(
      `UPDATE insurance_details SET
        loan_application_id = $1,
        deductable_amount_currency = $2,
        deductible_amount = $3,
        insurance_company = $4,
        rate = $5
      WHERE id = $6 RETURNING *`,
      [d.loan_application_id, d.deductable_amount_currency, d.deductible_amount, d.insurance_company, d.rate, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
