const express = require('express');
const router = express.Router();
const db = require('../db');
const { z } = require('zod');

const employmentSchema = z.object({
  loan_application_id: z.number().int(),
  occupation_category: z.string(),
  employment_status: z.string(),
  others: z.string(),
  industry: z.string(),
  department: z.string(),
  type_of_business: z.string(),
  status: z.string(),
  occupation_profession: z.string(),
  employment_segment: z.string(),
  nature_of_business: z.string(),
  grade_level: z.string(),
  shares_hold_in_business: z.string(),
  name: z.string(),
  company_name: z.string(),
  date_of_joining: z.string(), // ISO date string
  source_of_business: z.string(),
  emp_no: z.string(),
  experience_months: z.number().int(),
  other_company_name: z.string(),
  family_business: z.boolean(),
  designation: z.string(),
  no_of_employees: z.number().int(),
  years_experience: z.number().int()
});

// POST
router.post('/', async (req, res) => {
  const parsed = employmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;
  try {
    const result = await db.query(
      `INSERT INTO employment_details (
        loan_application_id, occupation_category, employment_status, others, industry,
        department, type_of_business, status, occupation_profession, employment_segment,
        nature_of_business, grade_level, shares_hold_in_business, name, company_name,
        date_of_joining, source_of_business, emp_no, experience_months, other_company_name,
        family_business, designation, no_of_employees, years_experience
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
      ) RETURNING *`,
      [
        d.loan_application_id, d.occupation_category, d.employment_status, d.others, d.industry,
        d.department, d.type_of_business, d.status, d.occupation_profession, d.employment_segment,
        d.nature_of_business, d.grade_level, d.shares_hold_in_business, d.name, d.company_name,
        d.date_of_joining, d.source_of_business, d.emp_no, d.experience_months, d.other_company_name,
        d.family_business, d.designation, d.no_of_employees, d.years_experience
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
    const result = await db.query('SELECT * FROM employment_details ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM employment_details WHERE id = $1', [req.params.id]);
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
    await db.query('DELETE FROM employment_details WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT - update
router.put('/:id', async (req, res) => {
  const parsed = employmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;
  try {
    const result = await db.query(
      `UPDATE employment_details SET
        loan_application_id = $1, occupation_category = $2, employment_status = $3,
        others = $4, industry = $5, department = $6, type_of_business = $7, status = $8,
        occupation_profession = $9, employment_segment = $10, nature_of_business = $11,
        grade_level = $12, shares_hold_in_business = $13, name = $14, company_name = $15,
        date_of_joining = $16, source_of_business = $17, emp_no = $18, experience_months = $19,
        other_company_name = $20, family_business = $21, designation = $22, no_of_employees = $23,
        years_experience = $24
      WHERE id = $25 RETURNING *`,
      [
        d.loan_application_id, d.occupation_category, d.employment_status, d.others, d.industry,
        d.department, d.type_of_business, d.status, d.occupation_profession, d.employment_segment,
        d.nature_of_business, d.grade_level, d.shares_hold_in_business, d.name, d.company_name,
        d.date_of_joining, d.source_of_business, d.emp_no, d.experience_months, d.other_company_name,
        d.family_business, d.designation, d.no_of_employees, d.years_experience, req.params.id
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
