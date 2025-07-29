const express = require('express');
const router = express.Router();
const db = require('../db1');

// Get all applications submitted to SPU (from loan_applications table)
router.get('/applications', async (req, res) => {
  try {
    // First, let's check if spu_applications table is empty and populate it
    const checkSpu = await db.query('SELECT COUNT(*) FROM spu_applications');
    
    if (parseInt(checkSpu.rows[0].count) === 0) {
      // Populate SPU applications from loan_applications for testing
      const loanApps = await db.query(`
        SELECT id, reference_number, id_no, 
               product_type, desired_financing 
        FROM loan_applications 
        LIMIT 10
      `);
      
      for (const app of loanApps.rows) {
        await db.query(`
          INSERT INTO spu_applications (los_id, applicant_name, cnic, loan_type, loan_amount, status)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          app.reference_number || `LOS-${app.id}`,
          'Test Applicant', // You can extract from personal_details if available
          app.id_no,
          app.product_type,
          app.desired_financing,
          'pending_review'
        ]);
      }
    }
    
    // Fetch SPU applications with proper formatting
    const query = `
      SELECT 
        id,
        los_id,
        applicant_name,
        cnic,
        loan_type,
        loan_amount,
        status,
        priority,
        assigned_officer,
        review_notes,
        documents_verified,
        created_at,
        updated_at
      FROM spu_applications 
      WHERE status IN ('pending_review', 'under_review', 'documents_pending')
      ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        created_at DESC
      LIMIT 100
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching SPU applications:', err);
    res.status(500).json({ 
      error: 'Failed to fetch applications',
      details: err.message 
    });
  }
});

// Get application details by ID
router.get('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const appQuery = `
      SELECT * FROM spu_applications WHERE id = $1
    `;
    
    const docQuery = `
      SELECT * FROM spu_documents WHERE spu_application_id = $1
    `;
    
    const [appResult, docResult] = await Promise.all([
      db.query(appQuery, [id]),
      db.query(docQuery, [id])
    ]);
    
    if (appResult.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json({
      application: appResult.rows[0],
      documents: docResult.rows
    });
  } catch (err) {
    console.error('Error fetching application details:', err);
    res.status(500).json({ error: 'Failed to fetch application details' });
  }
});

// Update application status by SPU officer
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    const result = await db.query('UPDATE spu_applications SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating application status:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Verify document
router.post('/:id/verify-document', async (req, res) => {
  const { documentId, verified } = req.body;
  const { id } = req.params;

  try {
    // Assuming there is a spu_documents table
    await db.query(
      'UPDATE spu_documents SET verified = $1 WHERE application_id = $2 AND id = $3',
      [verified, id, documentId]
    );
    res.json({ message: 'Document verification status updated' });
  } catch (err) {
    console.error('Error verifying document:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;

