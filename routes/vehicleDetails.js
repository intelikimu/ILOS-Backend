const express = require('express');
const router = express.Router();
const db = require('../db');
const { z } = require('zod');

const vehicleSchema = z.object({
  loan_application_id: z.number().int(),
  manufacturer: z.string(),
  dealer: z.string(),
  make: z.string(),
  appraisal_agency: z.string(),
  model: z.string(),
  engine_number: z.string(),
  year: z.string(),
  engine_size: z.string(),
  weightage: z.number(),
  quality_rating: z.string(),
  chasis_no: z.string(),
  registration_no: z.string(),
  purchase_currency: z.string(),
  purchase_price: z.number(),
  market_price_currency: z.string(),
  market_price: z.number(),
  margin_percent: z.number(),
  usable_value_currency: z.string(),
  usable_value_amount: z.number()
});

// POST
router.post('/', async (req, res) => {
  const parsed = vehicleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;
  try {
    const result = await db.query(
      `INSERT INTO vehicle_details (
        loan_application_id, manufacturer, dealer, make, appraisal_agency,
        model, engine_number, year, engine_size, weightage,
        quality_rating, chasis_no, registration_no, purchase_currency, purchase_price,
        market_price_currency, market_price, margin_percent, usable_value_currency, usable_value_amount
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
    const result = await db.query('SELECT * FROM vehicle_details ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM vehicle_details WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM vehicle_details WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT
router.put('/:id', async (req, res) => {
  const parsed = vehicleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;
  try {
    const result = await db.query(
      `UPDATE vehicle_details SET
        loan_application_id = $1, manufacturer = $2, dealer = $3, make = $4, appraisal_agency = $5,
        model = $6, engine_number = $7, year = $8, engine_size = $9, weightage = $10,
        quality_rating = $11, chasis_no = $12, registration_no = $13, purchase_currency = $14,
        purchase_price = $15, market_price_currency = $16, market_price = $17, margin_percent = $18,
        usable_value_currency = $19, usable_value_amount = $20
      WHERE id = $21
      RETURNING *`,
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
