const express = require('express');
const router = express.Router();
const db = require('../db1');

// GET all
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM nadra_verisys ORDER BY cnic');
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
      'SELECT * FROM nadra_verisys WHERE cnic = $1',
      [req.params.cnic]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// POST /api/nadra-verisys/check
// Body: { cnic: "..." }
router.post('/check', async (req, res) => {
  const { cnic } = req.body;
  try {
    const { rows } = await db.query(
      `SELECT * FROM nadra_verisys WHERE cnic = $1`,
      [cnic]
    );
    if (rows.length) {
      return res.json({
        exists: true,
        ...rows[0]
      });
    } else {
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error('NADRA Verisys check error:', err);
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
      `UPDATE nadra_verisys
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
    await db.query('DELETE FROM nadra_verisys WHERE cnic = $1', [req.params.cnic]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
