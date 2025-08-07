const express = require('express');
const router = express.Router();
const db = require('../db1'); // Use db1.js like other routes

// GET all
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT sr_no,cust_name,client_no,global_id,id_type,remarks
         FROM consumer_companies_list
      ORDER BY client_no`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET by Client No
router.get('/:client_no', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM consumer_companies_list WHERE client_no = $1`,
      [req.params.client_no]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { cust_name, client_no, global_id, id_type, remarks } = req.body;
    const { rows } = await db.query(
      `INSERT INTO consumer_companies_list
         (cust_name,client_no,global_id,id_type,remarks)
       VALUES($1,$2,$3,$4,$5)
     RETURNING *`,
      [cust_name, client_no, global_id, id_type, remarks]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update
router.put('/:client_no', async (req, res) => {
  try {
    const { cust_name, global_id, id_type, remarks } = req.body;
    const { rows } = await db.query(
      `UPDATE consumer_companies_list
          SET cust_name=$1, global_id=$2, id_type=$3, remarks=$4
        WHERE client_no=$5
      RETURNING *`,
      [cust_name, global_id, id_type, remarks, req.params.client_no]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE
router.delete('/:client_no', async (req, res) => {
  try {
    await db.query('DELETE FROM consumer_companies_list WHERE client_no = $1', [
      req.params.client_no,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /check - Check if CNIC exists in consumer companies list
router.post('/check', async (req, res) => {
  try {
    const { cnic } = req.body;
    
    if (!cnic) {
      return res.status(400).json({ 
        success: false, 
        message: 'CNIC is required' 
      });
    }

    console.log(`🔍 CCL Check: Searching for CNIC: ${cnic}`);

    // Search for the CNIC in the consumer_companies_list table
    const { rows } = await db.query(
      `SELECT sr_no, cust_name, client_no, global_id, id_type, remarks
       FROM consumer_companies_list 
       WHERE global_id = $1 OR client_no = $1`,
      [cnic]
    );

    if (rows.length > 0) {
      console.log(`✅ CCL Check: Found ${rows.length} record(s) for CNIC: ${cnic}`);
      res.json({
        success: true,
        exists: true,
        cust_name: rows[0].cust_name,
        client_no: rows[0].client_no,
        global_id: rows[0].global_id,
        id_type: rows[0].id_type,
        remarks: rows[0].remarks,
        record: rows[0]
      });
    } else {
      console.log(`✅ CCL Check: No records found for CNIC: ${cnic}`);
      res.json({
        success: true,
        exists: false,
        message: 'No CCL record found'
      });
    }
  } catch (err) {
    console.error('❌ CCL Check Error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: err.message 
    });
  }
});

module.exports = router;
