const express = require('express');
const router = express.Router();
const db = require('../db');
const { z } = require('zod');

const verificationSchema = z.object({
  loan_application_id: z.number().int(),
  inst_name: z.string(),
  new_nic: z.string(),
  middle_name: z.string(),
  date_of_birth: z.string().transform((val) => new Date(val)),
  last_name: z.string(),
  mother_maiden_name: z.string(),
  name_to_appear_on_card: z.string(),
  name: z.string(),
  first_shop_no: z.string(),
  source: z.string(),
  street: z.string(),
  nearest_landmark: z.string(),
  thesis_district_area: z.string(),
  phone: z.string(),
  address_4: z.string(),
  mobile: z.string(),
  company_name: z.string(),
  other_company_name: z.string(),
  house_fist_shop_no: z.string(),
  city: z.string(),
  card_destination: z.string(),
  work: z.string(),
  statement_destination: z.string(),
  employee_no: z.string()
});

// POST
router.post('/', async (req, res) => {
  const parsed = verificationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;
  try {
    const result = await db.query(
      `INSERT INTO verification (
        loan_application_id, inst_name, new_nic, middle_name, date_of_birth,
        last_name, mother_maiden_name, name_to_appear_on_card, name, first_shop_no,
        source, street, nearest_landmark, thesis_district_area, phone,
        address_4, mobile, company_name, other_company_name, house_fist_shop_no,
        city, card_destination, work, statement_destination, employee_no
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25
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
    const result = await db.query('SELECT * FROM verification ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM verification WHERE id = $1', [req.params.id]);
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
    await db.query('DELETE FROM verification WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT
router.put('/:id', async (req, res) => {
  const parsed = verificationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const d = parsed.data;
  try {
    const result = await db.query(
      `UPDATE verification SET
        loan_application_id = $1, inst_name = $2, new_nic = $3, middle_name = $4, date_of_birth = $5,
        last_name = $6, mother_maiden_name = $7, name_to_appear_on_card = $8, name = $9, first_shop_no = $10,
        source = $11, street = $12, nearest_landmark = $13, thesis_district_area = $14, phone = $15,
        address_4 = $16, mobile = $17, company_name = $18, other_company_name = $19, house_fist_shop_no = $20,
        city = $21, card_destination = $22, work = $23, statement_destination = $24, employee_no = $25
      WHERE id = $26 RETURNING *`,
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
