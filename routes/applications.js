const express = require('express');
const router = express.Router();
const db = require('../db1');
const { z } = require('zod');

// Define Zod validation schema
const applicationSchema = z.object({
  quick_de_application_id: z.string().uuid(),
  reference_number: z.string().min(3),
  product_sub_class: z.string(),
  product_type: z.string(),
  program_type: z.string(),
  id_no: z.string().regex(/^\d{5}-\d{7}-\d{1}$/),
  application_date: z.string(), // ISO string or adjust to z.coerce.date()
  desired_financing: z.number(),
  currency: z.string().length(3),
  tenure_years: z.number().int(),
  purpose: z.string(),
  name_on_card: z.string(),
  key_secret_word: z.string(),
  auto_loan_no: z.string(),
  pmdc_no: z.string(),
  pmdc_issue_date: z.string(),
  pmdc_expiry_date: z.string(),
});

// Test endpoint to check table structure
router.get('/test/tables', async (req, res) => {
  try {
    const tables = [
      'cashplus_applications',
      'autoloan_applications', 
      'smeasaan_applications',
      'commercial_vehicle_applications',
      'ameendrive_applications',
      'platinum_card_applications',
      'creditcard_applications'
    ];

    const results = {};
    
    for (const table of tables) {
      try {
        const result = await db.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table]);
        results[table] = result.rows;
      } catch (err) {
        results[table] = { error: err.message };
      }
    }

    res.json(results);
  } catch (err) {
    console.error('Error checking table structure:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET recent applications for Personal Banker dashboard
router.get('/recent/pb', async (req, res) => {
  try {
    // Get recent applications from all application types
    const queries = [
      // CashPlus applications
      db.query(`
        SELECT 
          id,
          'CashPlus' as application_type,
          COALESCE(CONCAT(first_name, ' ', last_name), 'Unknown Applicant') as applicant_name,
          'CashPlus Loan' as loan_type,
          COALESCE(amount_requested, 0) as amount,
          CASE 
            WHEN created_at IS NOT NULL THEN 'submitted_to_spu'
            ELSE 'draft'
          END as status,
          'medium' as priority,
          created_at as submitted_date,
          created_at as last_update,
          85 as completion_percentage,
          'Karachi Main' as branch
        FROM cashplus_applications 
        ORDER BY created_at DESC 
        LIMIT 4
      `),
      
      // Auto Loan applications
      db.query(`
        SELECT 
          id,
          'AutoLoan' as application_type,
          COALESCE(CONCAT(first_name, ' ', last_name), 'Unknown Applicant') as applicant_name,
          'Auto Loan' as loan_type,
          COALESCE(desired_loan_amount, 0) as amount,
          CASE 
            WHEN created_at IS NOT NULL THEN 'submitted_to_spu'
            ELSE 'draft'
          END as status,
          'medium' as priority,
          created_at as submitted_date,
          created_at as last_update,
          90 as completion_percentage,
          'Lahore Main' as branch
        FROM autoloan_applications 
        ORDER BY created_at DESC 
        LIMIT 4
      `),
      
      // SME ASAAN applications - check if table exists and has correct columns
      db.query(`
        SELECT 
          id,
          'SMEASAAN' as application_type,
          COALESCE(CONCAT(first_name, ' ', last_name), 'Unknown Applicant') as applicant_name,
          'Business Loan' as loan_type,
          COALESCE(desired_loan_amount, 0) as amount,
          CASE 
            WHEN created_at IS NOT NULL THEN 'submitted_to_spu'
            ELSE 'draft'
          END as status,
          'high' as priority,
          created_at as submitted_date,
          created_at as last_update,
          95 as completion_percentage,
          'Islamabad' as branch
        FROM smeasaan_applications 
        ORDER BY created_at DESC 
        LIMIT 4
      `).catch(() => null), // Ignore if table doesn't exist
      
      // Commercial Vehicle applications - check if table exists and has correct columns
      db.query(`
        SELECT 
          id,
          'CommercialVehicle' as application_type,
          COALESCE(CONCAT(first_name, ' ', last_name), 'Unknown Applicant') as applicant_name,
          'Commercial Vehicle Loan' as loan_type,
          COALESCE(desired_loan_amount, 0) as amount,
          CASE 
            WHEN created_at IS NOT NULL THEN 'submitted_to_spu'
            ELSE 'draft'
          END as status,
          'high' as priority,
          created_at as submitted_date,
          created_at as last_update,
          88 as completion_percentage,
          'Karachi Main' as branch
        FROM commercial_vehicle_applications 
        ORDER BY created_at DESC 
        LIMIT 4
      `).catch(() => null), // Ignore if table doesn't exist
      
      // AmeenDrive applications - check if table exists and has correct columns
      db.query(`
        SELECT 
          id,
          'AmeenDrive' as application_type,
          COALESCE(CONCAT(first_name, ' ', last_name), 'Unknown Applicant') as applicant_name,
          'AmeenDrive Loan' as loan_type,
          COALESCE(facility_amount, 0) as amount,
          CASE 
            WHEN created_at IS NOT NULL THEN 'submitted_to_spu'
            ELSE 'draft'
          END as status,
          'medium' as priority,
          created_at as submitted_date,
          created_at as last_update,
          92 as completion_percentage,
          'Lahore Main' as branch
        FROM ameendrive_applications 
        ORDER BY created_at DESC 
        LIMIT 4
      `).catch(() => null), // Ignore if table doesn't exist
      
      // Platinum Credit Card applications
      db.query(`
        SELECT 
          id,
          'PlatinumCreditCard' as application_type,
          COALESCE(CONCAT(first_name, ' ', last_name), 'Unknown Applicant') as applicant_name,
          'Platinum Credit Card' as loan_type,
          COALESCE(credit_limit, 0) as amount,
          CASE 
            WHEN created_at IS NOT NULL THEN 'submitted_to_spu'
            ELSE 'draft'
          END as status,
          'low' as priority,
          created_at as submitted_date,
          created_at as last_update,
          78 as completion_percentage,
          'Karachi Main' as branch
        FROM platinum_card_applications 
        ORDER BY created_at DESC 
        LIMIT 4
      `).catch(() => null), // Ignore if table doesn't exist
      
      // Classic Credit Card applications
      db.query(`
        SELECT 
          id,
          'ClassicCreditCard' as application_type,
          COALESCE(CONCAT(first_name, ' ', last_name), 'Unknown Applicant') as applicant_name,
          'Classic Credit Card' as loan_type,
          COALESCE(credit_limit, 0) as amount,
          CASE 
            WHEN created_at IS NOT NULL THEN 'submitted_to_spu'
            ELSE 'draft'
          END as status,
          'low' as priority,
          created_at as submitted_date,
          created_at as last_update,
          82 as completion_percentage,
          'Islamabad' as branch
        FROM creditcard_applications 
        ORDER BY created_at DESC 
        LIMIT 4
      `).catch(() => null) // Ignore if table doesn't exist
    ];

    const results = await Promise.allSettled(queries);
    
    // Combine all results and sort by submitted_date
    let allApplications = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value && result.value.rows && result.value.rows.length > 0) {
        allApplications = allApplications.concat(result.value.rows);
      }
    });

    // Sort by submitted_date (most recent first) and take only the last 4
    allApplications.sort((a, b) => {
      const dateA = new Date(a.submitted_date || a.created_at || 0);
      const dateB = new Date(b.submitted_date || b.created_at || 0);
      return dateB - dateA;
    });

    // Take only the last 4 applications
    const recentApplications = allApplications.slice(0, 4);

    // Format the response to match the frontend expectations
    const formattedApplications = recentApplications.map((app, index) => ({
      id: `UBL-2024-${String(index + 1).padStart(6, '0')}`,
      applicantName: app.applicant_name || 'Unknown Applicant',
      loanType: app.loan_type || 'Personal Loan',
      amount: app.amount ? `PKR ${Number(app.amount).toLocaleString()}` : 'PKR 0',
      status: app.status || 'draft',
      priority: app.priority || 'medium',
      submittedDate: app.submitted_date || app.created_at || new Date().toISOString(),
      lastUpdate: app.last_update || app.created_at || new Date().toISOString(),
      completionPercentage: app.completion_percentage || 0,
      branch: app.branch || 'Main Branch',
      // Mock data for fields not in database
      creditScore: Math.floor(Math.random() * 200) + 600,
      monthlyIncome: `PKR ${Math.floor(Math.random() * 200000) + 50000}`,
      age: Math.floor(Math.random() * 30) + 25,
      riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      estimatedProcessingTime: `${Math.floor(Math.random() * 5) + 2}-${Math.floor(Math.random() * 3) + 5} days`,
      documents: [
        { name: "CNIC Copy", status: "submitted", required: true },
        { name: "Salary Slip", status: "submitted", required: true },
        { name: "Bank Statement", status: "submitted", required: true },
        { name: "Employment Letter", status: "submitted", required: false },
      ],
      timeline: [
        { date: new Date(app.submitted_date || app.created_at).toISOString().split('T')[0], event: "Application Created", status: "completed" },
        { date: new Date(app.submitted_date || app.created_at).toISOString().split('T')[0], event: "Documents Uploaded", status: "completed" },
        { date: new Date(app.submitted_date || app.created_at).toISOString().split('T')[0], event: "Initial Review", status: "completed" },
        { date: "TBD", event: "SPU Verification", status: "pending" },
      ],
    }));

    res.json(formattedApplications);
  } catch (err) {
    console.error('Error fetching recent applications:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET all applications
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM loan_applications ORDER BY id DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching applications:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// GET one application by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM loan_applications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching application:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// CREATE a new application
router.post('/', async (req, res) => {
  const parsed = applicationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.errors });
  }

  const {
    quick_de_application_id,
    reference_number,
    product_sub_class,
    product_type,
    program_type,
    id_no,
    application_date,
    desired_financing,
    currency,
    tenure_years,
    purpose,
    name_on_card,
    key_secret_word,
    auto_loan_no,
    pmdc_no,
    pmdc_issue_date,
    pmdc_expiry_date,
  } = parsed.data;

  try {
    const result = await db.query(
      `INSERT INTO loan_applications (
        quick_de_application_id,
        reference_number,
        product_sub_class,
        product_type,
        program_type,
        id_no,
        application_date,
        desired_financing,
        currency,
        tenure_years,
        purpose,
        name_on_card,
        key_secret_word,
        auto_loan_no,
        pmdc_no,
        pmdc_issue_date,
        pmdc_expiry_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [
        quick_de_application_id,
        reference_number,
        product_sub_class,
        product_type,
        program_type,
        id_no,
        application_date,
        desired_financing,
        currency,
        tenure_years,
        purpose,
        name_on_card,
        key_secret_word,
        auto_loan_no,
        pmdc_no,
        pmdc_issue_date,
        pmdc_expiry_date,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting application:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// DELETE an application by ID
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM loan_applications WHERE id = $1', [req.params.id]);
    res.json({ message: 'Application deleted' });
  } catch (err) {
    console.error('Error deleting application:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// UPDATE an existing application
router.put('/:id', async (req, res) => {
  const parsed = applicationSchema.partial().safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.errors });
  }

  const fields = parsed.data;

  // Dynamically generate SET clause for only provided fields
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'No fields provided to update' });
  }

  const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const query = `UPDATE loan_applications SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;

  try {
    const result = await db.query(query, [...values, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating application:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
