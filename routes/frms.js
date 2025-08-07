const express = require('express');
const router = express.Router();
const db = require('../db1');

// GET all
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM frms ORDER BY cnic');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET by CNIC
router.get('/:cnic', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM frms WHERE cnic = $1', [req.params.cnic]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// POST /api/frms/check
// Body: { cnic: "..." }
router.post('/check', async (req, res) => {
  const { cnic } = req.body;
  try {
    const { rows } = await db.query(
      'SELECT status, risk_score, remarks FROM frms WHERE cnic = $1',
      [cnic]
    );
    if (rows.length) {
      // Fraudulent record exists
      return res.json({
        fraud: true,
        status: rows[0].status,
        risk_score: rows[0].risk_score,
        remarks: rows[0].remarks
      });
    } else {
      // Not found in FRMS
      return res.json({ fraud: false });
    }
  } catch (err) {
    console.error('FRMS check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE
router.delete('/:cnic', async (req, res) => {
  try {
    await db.query('DELETE FROM frms WHERE cnic = $1', [req.params.cnic]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
