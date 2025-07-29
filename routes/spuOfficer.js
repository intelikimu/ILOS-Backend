const express = require('express');
const app = express();
const db = require('../db1');

// SPU Officer: Get all pending reviews
app.get('/officer/pending-reviews', async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM spu_applications WHERE status = 'pending_review' ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pending reviews:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// SPU Officer: Approve an application
app.post('/officer/review/:id/approve', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("UPDATE spu_applications SET status = 'approved', verification_completed_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json({ message: 'Application approved', application: result.rows[0] });
  } catch (err) {
    console.error('Error approving application:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// SPU Officer: Reject an application
app.post('/officer/review/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  try {
    const result = await db.query("UPDATE spu_applications SET status = 'rejected', review_notes = $1, verification_completed_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *", [rejectionReason, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json({ message: 'Application rejected', application: result.rows[0] });
  } catch (err) {
    console.error('Error rejecting application:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = app;

