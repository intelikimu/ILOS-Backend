const express = require('express');
const router = express.Router();
const db = require('../db');
const { z } = require('zod');

// Define Zod validation schema
const applicationSchema = z.object({
  quick_de_application_id: z.string().uuid(),
  reference_number: z.string().min(3),
  product_sub_class: z.string(),
  product_type: z.string(),
  program_type: z.string(),
  id_no: z.string().regex(/^\d{5}-\d{7}-\d{1}$/),
  application_date: z.string(), // ISO string or adjust to z.coerce.date()
  desired_financing: z.number(),
  currency: z.string().length(3),
  tenure_years: z.number().int(),
  purpose: z.string(),
  name_on_card: z.string(),
  key_secret_word: z.string(),
  auto_loan_no: z.string(),
  pmdc_no: z.string(),
  pmdc_issue_date: z.string(),
  pmdc_expiry_date: z.string(),
});


// GET all applications
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM loan_applications ORDER BY id DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching applications:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// GET one application by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM loan_applications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching application:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// CREATE a new application
router.post('/', async (req, res) => {
  const parsed = applicationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.errors });
  }

  const {
    quick_de_application_id,
    reference_number,
    product_sub_class,
    product_type,
    program_type,
    id_no,
    application_date,
    desired_financing,
    currency,
    tenure_years,
    purpose,
    name_on_card,
    key_secret_word,
    auto_loan_no,
    pmdc_no,
    pmdc_issue_date,
    pmdc_expiry_date,
  } = parsed.data;

  try {
    const result = await db.query(
      `INSERT INTO loan_applications (
        quick_de_application_id,
        reference_number,
        product_sub_class,
        product_type,
        program_type,
        id_no,
        application_date,
        desired_financing,
        currency,
        tenure_years,
        purpose,
        name_on_card,
        key_secret_word,
        auto_loan_no,
        pmdc_no,
        pmdc_issue_date,
        pmdc_expiry_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [
        quick_de_application_id,
        reference_number,
        product_sub_class,
        product_type,
        program_type,
        id_no,
        application_date,
        desired_financing,
        currency,
        tenure_years,
        purpose,
        name_on_card,
        key_secret_word,
        auto_loan_no,
        pmdc_no,
        pmdc_issue_date,
        pmdc_expiry_date,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting application:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// DELETE an application by ID
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM loan_applications WHERE id = $1', [req.params.id]);
    res.json({ message: 'Application deleted' });
  } catch (err) {
    console.error('Error deleting application:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// UPDATE an existing application
router.put('/:id', async (req, res) => {
  const parsed = applicationSchema.partial().safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.errors });
  }

  const fields = parsed.data;

  // Dynamically generate SET clause for only provided fields
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'No fields provided to update' });
  }

  const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const query = `UPDATE loan_applications SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;

  try {
    const result = await db.query(query, [...values, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating application:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
