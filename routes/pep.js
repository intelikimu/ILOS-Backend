const express = require('express');
const router = express.Router();
const db = require('../db1');

// GET all PEP entries
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM pep ORDER BY code');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET one by CNIC
router.get('/:cnic', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM pep WHERE cnic = $1', [req.params.cnic]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /api/pep/check
// Body: { cnic: '...' }
router.post('/check', async (req, res) => {
  const { cnic } = req.body;
  try {
    const { rows } = await db.query(
      `SELECT name_of_individual_entity, category
         FROM pep
        WHERE cnic = $1`,
      [cnic]
    );

    if (rows.length) {
      // Record found
      return res.json({
        exists: true,
        name: rows[0].name_of_individual_entity,
        category: rows[0].category
      });
    } else {
      // Not found
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error('PEP check error:', err);
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
      `UPDATE pep
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
    await db.query('DELETE FROM pep WHERE cnic = $1', [req.params.cnic]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
