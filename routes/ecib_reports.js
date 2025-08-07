const express = require('express');
const router = express.Router();
const db = require('../db1');

// GET all
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM ecib_reports ORDER BY cnic');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET by CNIC
router.get('/:cnic', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM ecib_reports WHERE cnic = $1', [req.params.cnic]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /api/ecib-reports/check
// Body: { cnic: "..." }
router.post('/check', async (req, res) => {
  const { cnic } = req.body;
  try {
    const { rows } = await db.query(
      `SELECT customer_name, total_balance_outstanding
         FROM ecib_reports
        WHERE cnic = $1`,
      [cnic]
    );
    if (rows.length) {
      return res.json({
        exists: true,
        customer_name: rows[0].customer_name,
        total_balance_outstanding: rows[0].total_balance_outstanding
      });
    } else {
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error('ECIB check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// PUT update
router.put('/:cnic', async (req, res) => {
  try {
    const cols   = Object.keys(req.body);
    const sets   = cols.map((c,i) => `${c}=$${i+1}`).join(',');
    const params = [...cols.map(c => req.body[c]), req.params.cnic];
    const { rows } = await db.query(
      `UPDATE ecib_reports
          SET ${sets}
        WHERE cnic = $${params.length}
      RETURNING *`,
      params
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
    await db.query('DELETE FROM ecib_reports WHERE cnic = $1', [req.params.cnic]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
