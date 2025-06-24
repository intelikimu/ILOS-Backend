const express = require('express');
const router = express.Router();
const db = require('../db');
const { z } = require('zod');

// Zod schema for validation
const currentAddressSchema = z.object({
  loan_application_id: z.number().int(),
  house_flat_shop_no: z.string(),
  country: z.string(),
  area: z.string(),
  residing_since_years: z.number().int(),
  residing_since_months: z.number().int(),
  street: z.string(),
  state: z.string(),
  post_code: z.string(),
  residence_type: z.string(),
  tehsil_district: z.string(),
  city: z.string(),
  nearest_landmark: z.string(),
  type_of_accommodation: z.string(),
  district: z.string(),
  living_in_city_years: z.number().int(),
  living_in_city_months: z.number().int(),
  monthly_rent: z.number()
});

// POST - create
router.post('/', async (req, res) => {
  const parsed = currentAddressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.errors });
  }

  const d = parsed.data;

  try {
    const result = await db.query(
      `INSERT INTO current_address (
        loan_application_id, house_flat_shop_no, country, area, residing_since_years,
        residing_since_months, street, state, post_code, residence_type, tehsil_district,
        city, nearest_landmark, type_of_accommodation, district, living_in_city_years,
        living_in_city_months, monthly_rent
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *`,
      [
        d.loan_application_id, d.house_flat_shop_no, d.country, d.area, d.residing_since_years,
        d.residing_since_months, d.street, d.state, d.post_code, d.residence_type,
        d.tehsil_district, d.city, d.nearest_landmark, d.type_of_accommodation,
        d.district, d.living_in_city_years, d.living_in_city_months, d.monthly_rent
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
    const result = await db.query('SELECT * FROM current_address ORDER BY id DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET one by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM current_address WHERE id = $1', [req.params.id]);
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
    await db.query('DELETE FROM current_address WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// PUT - update current address by ID
router.put('/:id', async (req, res) => {
  const parsed = currentAddressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.errors });
  }

  const d = parsed.data;
  const id = req.params.id;

  try {
    const result = await db.query(
      `UPDATE current_address SET
        loan_application_id = $1,
        house_flat_shop_no = $2,
        country = $3,
        area = $4,
        residing_since_years = $5,
        residing_since_months = $6,
        street = $7,
        state = $8,
        post_code = $9,
        residence_type = $10,
        tehsil_district = $11,
        city = $12,
        nearest_landmark = $13,
        type_of_accommodation = $14,
        district = $15,
        living_in_city_years = $16,
        living_in_city_months = $17,
        monthly_rent = $18
      WHERE id = $19
      RETURNING *`,
      [
        d.loan_application_id,
        d.house_flat_shop_no,
        d.country,
        d.area,
        d.residing_since_years,
        d.residing_since_months,
        d.street,
        d.state,
        d.post_code,
        d.residence_type,
        d.tehsil_district,
        d.city,
        d.nearest_landmark,
        d.type_of_accommodation,
        d.district,
        d.living_in_city_years,
        d.living_in_city_months,
        d.monthly_rent,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



module.exports = router;
