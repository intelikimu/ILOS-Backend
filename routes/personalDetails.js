const express = require('express');
const router = express.Router();
const db = require('../db');
const { z } = require('zod');

// Zod Schema
const personalDetailsSchema = z.object({
  loan_application_id: z.number().int(),
  title: z.string(),
  first_name: z.string(),
  old_nic: z.string(),
  new_nic: z.string(),
  expiry_date: z.string(),
  ntn: z.string(),
  marital_status: z.string(),
  no_of_children: z.number().int(),
  mother_maiden_name: z.string(),
  father_husband_name: z.string(),
  passport_no: z.string(),
  gender: z.string(),
  no_of_dependents: z.number().int(),
  father_husband: z.string(),
  last_name: z.string(),
  issue_date: z.string(),
  date_of_birth: z.string(),
  education: z.string(),
  father_husband_cnic: z.string(),
  nationality: z.string()
});

// GET all applications
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM personal_details ORDER BY id LIMIT 60');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching applications:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// GET one application by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM personal_details WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching application:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// POST route to insert personal details
router.post('/', async (req, res) => {
  const parsed = personalDetailsSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.errors });
  }

  const data = parsed.data;

  try {
    const result = await db.query(
      `INSERT INTO personal_details (
        loan_application_id, title, first_name, old_nic, new_nic, expiry_date, ntn, marital_status,
        no_of_children, mother_maiden_name, father_husband_name, passport_no, gender,
        no_of_dependents, father_husband, last_name, issue_date, date_of_birth, education,
        father_husband_cnic, nationality
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *`,
      [
        data.loan_application_id,
        data.title,
        data.first_name,
        data.old_nic,
        data.new_nic,
        data.expiry_date,
        data.ntn,
        data.marital_status,
        data.no_of_children,
        data.mother_maiden_name,
        data.father_husband_name,
        data.passport_no,
        data.gender,
        data.no_of_dependents,
        data.father_husband,
        data.last_name,
        data.issue_date,
        data.date_of_birth,
        data.education,
        data.father_husband_cnic,
        data.nationality
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting personal details:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// DELETE an application by ID
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM personal_details WHERE id = $1', [req.params.id]);
    res.json({ message: 'Application deleted' });
  } catch (err) {
    console.error('Error deleting application:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
