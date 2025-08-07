const express = require('express');
const router = express.Router();
const db = require('../db1');

// GET all
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, cnic, customer
         FROM sbp_blacklist
      ORDER BY cnic`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// GET by CNIC
router.get('/:cnic', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, cnic, customer
         FROM sbp_blacklist
        WHERE cnic = $1`,
      [req.params.cnic]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// POST /api/sbp-blacklist/check
// body: { cnic: '...' }
router.post('/check', async (req, res) => {
  const { cnic } = req.body;
  try {
    const { rows } = await db.query(
      `SELECT id, cnic, customer
         FROM sbp_blacklist
        WHERE cnic = $1`,
      [cnic]
    );

    if (rows.length) {
      return res.json({
        blacklisted: true,
        record: rows[0]
      });
    } else {
      return res.json({
        blacklisted: false
      });
    }
  } catch (err) {
    console.error('Blacklist check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// PUT update
router.put('/:cnic', async (req, res) => {
  try {
    const { customer } = req.body;
    const { rows } = await db.query(
      `UPDATE sbp_blacklist
          SET customer = $2
        WHERE cnic = $1
      RETURNING id, cnic, customer`,
      [req.params.cnic, customer]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE
router.delete('/:cnic', async (req, res) => {
  try {
    await db.query(`DELETE FROM sbp_blacklist WHERE cnic = $1`, [
      req.params.cnic,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
