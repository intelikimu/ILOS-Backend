const express = require('express');
const router = express.Router();
const db = require('../db1');

// GET all
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM internal_watchlist ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET by ID Number
router.get('/:id_number', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM internal_watchlist WHERE id_number = $1',
      [req.params.id_number]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST check internal watchlist by CNIC
router.post('/check', async (req, res) => {
  try {
    const { cnic } = req.body;

    if (!cnic) {
      return res.status(400).json({ error: 'CNIC is required' });
    }

    const { rows } = await db.query(
      `SELECT name, action_required, remarks 
       FROM internal_watchlist 
       WHERE id_number = $1`,
      [cnic]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'CNIC not found in internal watchlist' });
    }

    res.status(200).json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// PUT update
router.put('/:id_number', async (req, res) => {
  try {
    const cols   = Object.keys(req.body);
    const sets   = cols.map((c,i) => `${c}=$${i+1}`).join(',');
    const params = [...cols.map(c => req.body[c]), req.params.id_number];
    const { rows } = await db.query(
      `UPDATE internal_watchlist
          SET ${sets}
        WHERE id_number = $${params.length}
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
router.delete('/:id_number', async (req, res) => {
  try {
    await db.query('DELETE FROM internal_watchlist WHERE id_number = $1', [req.params.id_number]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
