console.log('🔄 Loading applications route module...');

const express = require('express');
const router = express.Router();

console.log('🔄 Loading database connection...');
const db = require('../db1');

console.log('🔄 Loading zod validation...');
const { z } = require('zod');

console.log('✅ Applications route module loaded successfully');

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

// Helper function to get status range for each department
const getStatusRangeForDepartment = (department) => {
  const statusRanges = {
    'PB': [ 'PB_SUBMITTED','submitted_by_pb', 'submitted_by_spu', 'assigned_to_eavmu_officer', 'returned_by_eavmu_officer', 'submitted_by_eavmu', 'submitted_by_cops', 'submitted_to_ciu', 'application_completed', 'rejected_by_spu', 'rejected_by_cops', 'rejected_by_eavmu', 'rejected_by_ciu', 'rejected_by_rru'], // PB can see all applications
    'SPU': ['submitted_by_pb', 'PB_SUBMITTED'], // SPU only sees applications submitted by PB
    'COPS': ['submitted_by_spu', 'assigned_to_eavmu_officer', 'returned_by_eavmu_officer', 'submitted_by_eavmu'], // COPS sees SPU submissions, EAMVU assignments, officer returns, and EAMVU final submissions
    'EAMVU': ['submitted_by_spu', 'submitted_by_cops', 'assigned_to_eavmu_officer', 'returned_by_eavmu_officer'], // EAMVU HEAD sees SPU submissions, COPS submissions, assignments, and officer returns
    'EAMVU_OFFICER': ['assigned_to_eavmu_officer'], // EAMVU OFFICER sees applications assigned by EAMVU HEAD
    'CIU': ['submitted_to_ciu', 'application_completed', 'resolved_by_rru'], // CIU sees applications submitted to them and resolved by RRU
    'RRU': ['rejected_by_spu', 'rejected_by_cops', 'rejected_by_eavmu', 'rejected_by_ciu', 'rejected_by_rru', 'resolved_by_rru'] // RRU handles all rejected applications and resolved applications
  }
  
  return statusRanges[department] || []
}

// Helper function to build WHERE clause for status filtering
const buildStatusWhereClause = (department, tableAlias = 'ca') => {
  const allowedStatuses = getStatusRangeForDepartment(department)
  
  if (department === 'PB') {
    return 'WHERE 1=1' // PB can see all applications
  }
  
  if (allowedStatuses.length === 0) {
    return 'WHERE 1=0' // No access for unknown department
  }
  
  const statusConditions = allowedStatuses.map((status, index) => `${tableAlias}.status = $${index + 1}`).join(' OR ')
  return `WHERE (${statusConditions})`
}

// Helper function to get parameters for status filtering
const getStatusParameters = (department) => {
  const allowedStatuses = getStatusRangeForDepartment(department)
  return department === 'PB' ? [] : allowedStatuses
}

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

// Test endpoint specifically for SME ASAAN applications
router.get('/test/smeasaan', async (req, res) => {
  try {
    console.log('Testing SME ASAAN applications...');
    
    // Test if the table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'smeasaan_applications'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({ 
        error: 'Table smeasaan_applications does not exist',
        tableExists: false 
      });
    }
    
    // Get column information
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'smeasaan_applications'
      ORDER BY ordinal_position;
    `);
    
    // Get sample data
    const sampleData = await db.query(`
      SELECT 
        id,
        applicant_name,
        desired_loan_amount,
        created_at,
        company_name,
        business_address
      FROM smeasaan_applications 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    // Test the actual query used in the main endpoint
    const testQuery = await db.query(`
      SELECT 
        id,
        'SMEASAAN' as application_type,
        COALESCE(applicant_name, 'Unknown Applicant') as applicant_name,
        'SME Loan' as loan_type,
        COALESCE(desired_loan_amount, 0) as amount,
        CASE 
          WHEN created_at IS NOT NULL THEN 'under_review'
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
    `);
    
    res.json({
      tableExists: true,
      columns: columns.rows,
      sampleData: sampleData.rows,
      testQueryResult: testQuery.rows,
      totalRecords: sampleData.rows.length
    });
    
  } catch (err) {
    console.error('Error testing SME ASAAN:', err);
    res.status(500).json({ 
      error: err.message,
      stack: err.stack 
    });
  }
});

// Test endpoint specifically for AmeenDrive applications
router.get('/test/ameendrive', async (req, res) => {
  try {
    console.log('Testing AmeenDrive applications...');
    
    // Test if the table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ameendrive_applications'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({ 
        error: 'Table ameendrive_applications does not exist',
        tableExists: false 
      });
    }
    
    // Get column information
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ameendrive_applications'
      ORDER BY ordinal_position;
    `);
    
    // Get sample data
    const sampleData = await db.query(`
      SELECT 
        id,
        applicant_full_name,
        price_value,
        created_at,
        vehicle_manufacturer,
        vehicle_model
      FROM ameendrive_applications 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    // Test the actual query used in the main endpoint
    const testQuery = await db.query(`
      SELECT 
        id,
        'AmeenDrive' as application_type,
        COALESCE(applicant_full_name, 'Unknown Applicant') as applicant_name,
        'AmeenDrive Loan' as loan_type,
        COALESCE(price_value, 0) as amount,
        CASE 
          WHEN created_at IS NOT NULL THEN 'under_review'
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
    `);
    
    res.json({
      tableExists: true,
      columns: columns.rows,
      sampleData: sampleData.rows,
      testQueryResult: testQuery.rows,
      totalRecords: sampleData.rows.length
    });
    
  } catch (err) {
    console.error('Error testing AmeenDrive:', err);
    res.status(500).json({ 
      error: err.message,
      stack: err.stack 
    });
  }
});

// Test endpoint specifically for Auto Loan applications
router.get('/test/autoloan', async (req, res) => {
  try {
    console.log('Testing Auto Loan applications...');
    
    // Test if the table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'autoloan_applications'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({ 
        error: 'Table autoloan_applications does not exist',
        tableExists: false 
      });
    }
    
    // Get column information
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'autoloan_applications'
      ORDER BY ordinal_position;
    `);
    
    // Get sample data
    const sampleData = await db.query(`
      SELECT 
        id,
        first_name,
        last_name,
        price_value,
        created_at,
        vehicle_manufacturer,
        vehicle_model
      FROM autoloan_applications 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    // Test the actual query used in the main endpoint
    const testQuery = await db.query(`
      SELECT 
        id,
        'AutoLoan' as application_type,
        COALESCE(CONCAT(first_name, ' ', last_name), 'Unknown Applicant') as applicant_name,
        'Auto Loan' as loan_type,
        COALESCE(price_value, 0) as amount,
        CASE 
          WHEN created_at IS NOT NULL THEN 'under_review'
          ELSE 'draft'
        END as status,
        'medium' as priority,
        created_at as submitted_date,
        created_at as last_update,
        92 as completion_percentage,
        'Lahore Main' as branch
      FROM autoloan_applications 
      ORDER BY created_at DESC 
      LIMIT 4
    `);
    
    res.json({
      tableExists: true,
      columns: columns.rows,
      sampleData: sampleData.rows,
      testQueryResult: testQuery.rows,
      totalRecords: sampleData.rows.length
    });
    
  } catch (err) {
    console.error('Error testing Auto Loan:', err);
    res.status(500).json({ 
      error: err.message,
      stack: err.stack 
    });
  }
});

// Test endpoint specifically for Classic Credit Card applications
router.get('/test/creditcard', async (req, res) => {
  try {
    console.log('Testing Classic Credit Card applications...');
    
    // Test if the table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'creditcard_applications'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({ 
        error: 'Table creditcard_applications does not exist',
        tableExists: false 
      });
    }
    
    // Get column information
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'creditcard_applications'
      ORDER BY ordinal_position;
    `);
    
    // Get sample data
    const sampleData = await db.query(`
      SELECT 
        id,
        full_name,
        card_type,
        created_at,
        card_category,
        application_status
      FROM creditcard_applications 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    // Test the actual query used in the main endpoint
    const testQuery = await db.query(`
      SELECT 
        id,
        'ClassicCreditCard' as application_type,
        COALESCE(full_name, 'Unknown Applicant') as applicant_name,
        'Classic Credit Card' as loan_type,
        COALESCE(0, 0) as amount,
        CASE 
          WHEN created_at IS NOT NULL THEN 'under_review'
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
    `);
    
    res.json({
      tableExists: true,
      columns: columns.rows,
      sampleData: sampleData.rows,
      testQueryResult: testQuery.rows,
      totalRecords: sampleData.rows.length
    });
    
  } catch (err) {
    console.error('Error testing Classic Credit Card:', err);
    res.status(500).json({ 
      error: err.message,
      stack: err.stack 
    });
  }
});

// Test endpoint specifically for Platinum Credit Card applications
router.get('/test/platinum', async (req, res) => {
  try {
    console.log('Testing Platinum Credit Card applications...');
    
    // Test if the table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'platinum_card_applications'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({ 
        error: 'Table platinum_card_applications does not exist',
        tableExists: false 
      });
    }
    
    // Get column information
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'platinum_card_applications'
      ORDER BY ordinal_position;
    `);
    
    // Get sample data
    const sampleData = await db.query(`
      SELECT 
        id,
        CONCAT(first_name, ' ', last_name) as full_name,
        created_at,
        application_status
      FROM platinum_card_applications 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    // Test the actual query used in the main endpoint
    const testQuery = await db.query(`
      SELECT 
        id,
        'PlatinumCreditCard' as application_type,
        COALESCE(CONCAT(first_name, ' ', last_name), 'Unknown Applicant') as applicant_name,
        'Platinum Credit Card' as loan_type,
        COALESCE(0, 0) as amount,
        CASE 
          WHEN created_at IS NOT NULL THEN 'under_review'
          ELSE 'draft'
        END as status,
        'low' as priority,
        created_at as submitted_date,
        created_at as last_update,
        78 as completion_percentage,
        'Karachi Main' as branch
      FROM platinum_card_applications 
      ORDER BY created_at DESC 
      LIMIT 50
    `);
    
    res.json({
      tableExists: true,
      columns: columns.rows,
      sampleData: sampleData.rows,
      testQueryResult: testQuery.rows,
      totalRecords: sampleData.rows.length
    });
    
  } catch (err) {
    console.error('Error testing Platinum Credit Card:', err);
    res.status(500).json({ 
      error: err.message,
      stack: err.stack 
    });
  }
});

// Test endpoint to check actual status values in database
router.get('/test/status-values', async (req, res) => {
  try {
    console.log('Testing actual status values in database...');
    
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
        // Check if table exists
        const tableExists = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          );
        `, [table]);
        
        if (!tableExists.rows[0].exists) {
          results[table] = { error: 'Table does not exist' };
          continue;
        }
        
        // Get distinct status values
        const statusValues = await db.query(`
          SELECT DISTINCT status, COUNT(*) as count
          FROM ${table}
          WHERE status IS NOT NULL
          GROUP BY status
          ORDER BY status;
        `);
        
        // Get sample records with their status
        const sampleRecords = await db.query(`
          SELECT id, status, created_at
          FROM ${table}
          ORDER BY created_at DESC
          LIMIT 5;
        `);
        
        results[table] = {
          statusValues: statusValues.rows,
          sampleRecords: sampleRecords.rows,
          totalRecords: sampleRecords.rows.length
        };
        
      } catch (err) {
        results[table] = { error: err.message };
      }
    }

    res.json(results);
  } catch (err) {
    console.error('Error checking status values:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
  

// GET all applications
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ilos_applications ORDER BY los_id DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching applications:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// MOVED: Generic /:id route moved after specific routes to avoid conflicts


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
      `INSERT INTO ilos_applications (
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
    await db.query('DELETE FROM ilos_applications WHERE los_id = $1', [req.params.id]);
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
      const query = `UPDATE ilos_applications SET ${setClause} WHERE los_id = $${keys.length + 1} RETURNING *`;

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


// Update application status by los_id
router.post('/update-status', async (req, res) => {
  try {
    const { losId, status, applicationType } = req.body
    //change los to int
    const losIdInt = parseInt(losId)
    

    if (!losIdInt || !status || !applicationType) {
      return res.status(400).json({ 
        error: 'losIdInt, status, and applicationType are required' 
      })
    }

    // Map application type to table name
    const tableMap = {
      'CashPlus': 'cashplus_applications',
      'AutoLoan': 'autoloan_applications',
      'SMEASAAN': 'smeasaan_applications',
      'CommercialVehicle': 'commercial_vehicle_applications',
      'AmeenDrive': 'ameendrive_applications',
      'PlatinumCreditCard': 'platinum_card_applications',
      'ClassicCreditCard': 'creditcard_applications'
    }

    const tableName = tableMap[applicationType]
    if (!tableName) {
      return res.status(400).json({ 
        error: 'Invalid application type' 
      })
    }
    
    // Update status in the specific form table
    const result = await db.query(
      `select update_status_by_los_id($1, $2)`,
      [losIdInt, status]
    )
  

    console.log(`✅ Status updated to ${status} for ${applicationType} application ${losId}`)

    res.json({
      success: true,
      message: `New Status updated to ${status}`,
      losId: losIdInt,
      status: status,
      applicationType: applicationType
    })

  } catch (error) {
    console.error('❌ Error updating status:', error.message)
    res.status(500).json({ 
      error: 'Failed to update application status',
      details: error.message 
    })
  }
})

// Update application status with department approval workflow
router.post('/update-status-workflow', async (req, res) => {
  try {
    const { losId, status, applicationType, department, action } = req.body
    const losIdInt = parseInt(losId)
    
    if (!losIdInt || !status || !applicationType || !department || !action) {
      return res.status(400).json({ 
        error: 'losId, status, applicationType, department, and action are required' 
      })
    }

    // Map application type to table name
    const tableMap = {
      'CashPlus': 'cashplus_applications',
      'AutoLoan': 'autoloan_applications',
      'SMEASAAN': 'smeasaan_applications',
      'CommercialVehicle': 'commercial_vehicle_applications',
      'AmeenDrive': 'ameendrive_applications',
      'PlatinumCreditCard': 'platinum_card_applications',
      'ClassicCreditCard': 'creditcard_applications'
    }

    const tableName = tableMap[applicationType]
    if (!tableName) {
      return res.status(400).json({ 
        error: 'Invalid application type' 
      })
    }

    let finalStatus = status
    let approvalMessage = `Status updated to ${status}`

    // Handle department-specific workflow
    if (department === 'PB' && action === 'submit') {
      finalStatus = 'submitted_by_pb'
      approvalMessage = 'Application submitted by PB to SPU'
    } else if (department === 'SPU' && action === 'verify') {
      finalStatus = 'submitted_by_spu'
      approvalMessage = 'Application verified by SPU - submitted to COPS and EAMVU Head'
      console.log(`🔄 SPU: Starting fresh workflow - status set to submitted_by_spu`)
    } else if (department === 'SPU' && action === 'reject') {
      finalStatus = 'rejected_by_spu'
      approvalMessage = 'Application rejected by SPU'
    } else if (department === 'COPS' && action === 'approve') {
      // Check the current status passed from frontend
      console.log(`🔍 COPS workflow - Current status from frontend: ${status}`)
      
      if (status === 'submitted_by_spu') {
        // COPS submits first from SPU - set to submitted_by_cops and mark cops_submitted = true
        finalStatus = 'submitted_by_cops'
        approvalMessage = 'Application approved by COPS - waiting for EAMVU approval'
        console.log(`✅ COPS: First approval from SPU - setting status to submitted_by_cops`)
        
        // Update cops_submitted flag
        await db.query(`
          UPDATE ilos_applications 
          SET cops_submitted = true 
          WHERE los_id = $1
        `, [losIdInt]);
      } else if (status === 'assigned_to_eavmu_officer' || status === 'returned_by_eavmu_officer') {
        // COPS submits while application is with EAMVU officer - DON'T change status, only update flag
        finalStatus = status // Keep the current status unchanged
        approvalMessage = `Application approved by COPS while ${status === 'assigned_to_eavmu_officer' ? 'assigned to EAMVU officer' : 'returned by EAMVU officer'} - flag updated`
        console.log(`✅ COPS: Approval during officer workflow - keeping status as ${status}, updating flag only`)
        
        // Update cops_submitted flag only
        await db.query(`
          UPDATE ilos_applications 
          SET cops_submitted = true 
          WHERE los_id = $1
        `, [losIdInt]);
      } else if (status === 'submitted_by_eavmu') {
        // EAMVU already approved - both done, submit to CIU
        finalStatus = 'submitted_to_ciu'
        approvalMessage = 'Application approved by COPS - Both COPS and EAMVU approved, submitted to CIU'
        console.log(`✅ COPS: Second approval after EAMVU - setting status to submitted_to_ciu`)
        
        // Update cops_submitted flag
        await db.query(`
          UPDATE ilos_applications 
          SET cops_submitted = true 
          WHERE los_id = $1
        `, [losIdInt]);
      } else {
        // Default case - assume first approval
        finalStatus = 'submitted_by_cops'
        approvalMessage = 'Application approved by COPS - waiting for EAMVU approval'
        console.log(`✅ COPS: Default case - setting status to submitted_by_cops`)
        
        // Update cops_submitted flag
        await db.query(`
          UPDATE ilos_applications 
          SET cops_submitted = true 
          WHERE los_id = $1
        `, [losIdInt]);
      }
    } else if (department === 'COPS' && action === 'reject') {
      finalStatus = 'rejected_by_cops'
      approvalMessage = 'Application rejected by COPS'
    } else if (department === 'EAMVU' && action === 'assign') {
      // EAMVU HEAD assigns to EAMVU OFFICER with specific agent
      const { agentId, assignedBy, assignmentNotes } = req.body;
      console.log(`🔍 EAMVU HEAD: Assigning to agent ${agentId} - Current status: ${status}`)
      
      try {
        // Check if agent exists and is active
        const agentCheck = await db.query(`
          SELECT agent_id, name, status, 
            (SELECT COUNT(*) FROM agent_assignments WHERE agent_id = ea.agent_id AND status = 'active') as current_assignments,
            max_concurrent_assignments
          FROM eamvu_agents ea 
          WHERE agent_id = $1
        `, [agentId]);
        
        if (agentCheck.rows.length === 0) {
          console.error(`❌ Agent ${agentId} not found`)
          return res.status(400).json({ error: 'Agent not found' });
        }
        
        const agent = agentCheck.rows[0];
        if (agent.status !== 'active') {
          console.error(`❌ Agent ${agentId} is not active`)
          return res.status(400).json({ error: 'Agent is not active' });
        }
        
        // Check assignment limit
        if (agent.current_assignments >= agent.max_concurrent_assignments) {
          console.error(`❌ Agent ${agent.name} has reached maximum assignments`)
          return res.status(400).json({ 
            error: `Agent ${agent.name} has reached maximum assignments (${agent.max_concurrent_assignments})` 
          });
        }
        
        // Check if application is already assigned
        const existingAssignment = await db.query(`
          SELECT agent_id FROM agent_assignments 
          WHERE los_id = $1 AND status = 'active'
        `, [losIdInt]);
        
        if (existingAssignment.rows.length > 0) {
          console.error(`❌ Application ${losIdInt} already assigned to ${existingAssignment.rows[0].agent_id}`)
          return res.status(400).json({ 
            error: `Application is already assigned to agent ${existingAssignment.rows[0].agent_id}` 
          });
        }
        
        // Create new assignment
        await db.query(`
          INSERT INTO agent_assignments (los_id, agent_id, assigned_by, assignment_notes)
          VALUES ($1, $2, $3, $4)
        `, [losIdInt, agentId, assignedBy || 'EAMVU_HEAD', assignmentNotes || '']);
        
        finalStatus = 'assigned_to_eavmu_officer';
        approvalMessage = `Application assigned to ${agent.name} (${agentId})`;
        console.log(`✅ EAMVU HEAD: Assigned to agent ${agentId} - setting status to assigned_to_eavmu_officer`);
        
      } catch (error) {
        console.error('❌ Error assigning to agent:', error);
        return res.status(500).json({ error: 'Failed to assign application to agent' });
      }
    } else if (department === 'EAMVU' && action === 'approve') {
      // EAMVU HEAD final approval after officer completes work
      console.log(`🔍 EAMVU HEAD workflow - Current status from frontend: ${status}`)
      
      // Check if COPS has already submitted by checking the boolean flag
      const copsSubmissionCheck = await db.query(`
        SELECT cops_submitted FROM ilos_applications WHERE los_id = $1
      `, [losIdInt]);
      
      const copsAlreadySubmitted = copsSubmissionCheck.rows.length > 0 && copsSubmissionCheck.rows[0].cops_submitted === true;
      
      if (status === 'returned_by_eavmu_officer') {
        // Officer completed work, now HEAD decides based on whether COPS already submitted
        if (copsAlreadySubmitted) {
          // COPS already submitted - both done, submit to CIU
          finalStatus = 'submitted_to_ciu'
          approvalMessage = 'Application approved by EAMVU HEAD after officer review - Both COPS and EAMVU approved, submitted to CIU'
          console.log(`✅ EAMVU HEAD: Final approval after officer work (COPS already submitted) - setting status to submitted_to_ciu`)
        } else {
          // COPS hasn't submitted yet - wait for COPS approval
          finalStatus = 'submitted_by_eavmu'
          approvalMessage = 'Application approved by EAMVU HEAD after officer review - waiting for COPS approval'
          console.log(`✅ EAMVU HEAD: Final approval after officer work - setting status to submitted_by_eavmu`)
        }
        
        // Update eavmu_submitted flag
        await db.query(`
          UPDATE ilos_applications 
          SET eavmu_submitted = true 
          WHERE los_id = $1
        `, [losIdInt]);
      } else if (status === 'submitted_by_spu') {
        // EAMVU HEAD receives from SPU - direct approval should wait for COPS
        finalStatus = 'submitted_by_eavmu'
        approvalMessage = 'Application approved by EAMVU HEAD (direct approval) - waiting for COPS approval'
        console.log(`✅ EAMVU HEAD: Direct approval from SPU - setting status to submitted_by_eavmu`)
        
        // Update eavmu_submitted flag
        await db.query(`
          UPDATE ilos_applications 
          SET eavmu_submitted = true 
          WHERE los_id = $1
        `, [losIdInt]);
      } else if (status === 'submitted_by_cops') {
        // COPS already approved - both done, submit to CIU
        finalStatus = 'submitted_to_ciu'
        approvalMessage = 'Application approved by EAMVU HEAD - Both COPS and EAMVU approved, submitted to CIU'
        console.log(`✅ EAMVU HEAD: Second approval after COPS - setting status to submitted_to_ciu`)
        
        // Update eavmu_submitted flag
        await db.query(`
          UPDATE ilos_applications 
          SET eavmu_submitted = true 
          WHERE los_id = $1
        `, [losIdInt]);
      } else {
        // Default case
        finalStatus = 'submitted_by_eavmu'
        approvalMessage = 'Application approved by EAMVU HEAD - waiting for COPS approval'
        console.log(`✅ EAMVU HEAD: Default approval - setting status to submitted_by_eavmu`)
        
        // Update eavmu_submitted flag
        await db.query(`
          UPDATE ilos_applications 
          SET eavmu_submitted = true 
          WHERE los_id = $1
        `, [losIdInt]);
      }
    } else if (department === 'EAMVU' && action === 'reject') {
      finalStatus = 'rejected_by_eavmu'
      approvalMessage = 'Application rejected by EAMVU HEAD'
    } else if (department === 'EAMVU_OFFICER' && action === 'complete') {
      // EAMVU OFFICER completes work and returns to HEAD
      const { agentId } = req.body;
      console.log(`🔍 EAMVU OFFICER: Agent ${agentId} completing work - Current status: ${status}`)
      
      if (!agentId) {
        console.error('❌ Agent ID is required for EAMVU OFFICER actions')
        return res.status(400).json({ error: 'Agent ID is required for EAMVU OFFICER actions' });
      }
      
      try {
        // First, delete any existing completed assignments for this agent and LOS
        await db.query(`
          DELETE FROM agent_assignments 
          WHERE los_id = $1 AND agent_id = $2 AND status = 'completed'
        `, [losIdInt, agentId]);
        
        // Then update the active assignment to completed
        const updateResult = await db.query(`
          UPDATE agent_assignments 
          SET status = 'completed', completed_at = CURRENT_TIMESTAMP
          WHERE los_id = $1 AND agent_id = $2 AND status = 'active'
          RETURNING *
        `, [losIdInt, agentId]);
        
        if (updateResult.rows.length === 0) {
          console.error(`❌ No active assignment found for LOS ${losIdInt} and agent ${agentId}`)
          return res.status(400).json({ error: 'No active assignment found for this agent' });
        }
        
        finalStatus = 'returned_by_eavmu_officer'
        approvalMessage = `Application completed by EAMVU Officer (Agent: ${agentId}) - returned to EAMVU HEAD`
        console.log(`✅ EAMVU OFFICER: Agent ${agentId} work completed - setting status to returned_by_eavmu_officer`)
        
      } catch (error) {
        console.error('❌ Error completing assignment:', error);
        return res.status(500).json({ error: 'Failed to complete assignment' });
      }
    } else if (department === 'EAMVU_OFFICER' && action === 'reject') {
      const { agentId } = req.body;
      console.log(`🔍 EAMVU OFFICER: Agent ${agentId} rejecting application - Current status: ${status}`)
      
      if (!agentId) {
        console.error('❌ Agent ID is required for EAMVU OFFICER actions')
        return res.status(400).json({ error: 'Agent ID is required for EAMVU OFFICER actions' });
      }
      
      try {
        // First, delete any existing completed assignments for this agent and LOS
        await db.query(`
          DELETE FROM agent_assignments 
          WHERE los_id = $1 AND agent_id = $2 AND status = 'completed'
        `, [losIdInt, agentId]);
        
        // Then update the active assignment to completed
        const updateResult = await db.query(`
          UPDATE agent_assignments 
          SET status = 'completed', completed_at = CURRENT_TIMESTAMP
          WHERE los_id = $1 AND agent_id = $2 AND status = 'active'
          RETURNING *
        `, [losIdInt, agentId]);
        
        if (updateResult.rows.length === 0) {
          console.error(`❌ No active assignment found for LOS ${losIdInt} and agent ${agentId}`)
          return res.status(400).json({ error: 'No active assignment found for this agent' });
        }
        
        finalStatus = 'rejected_by_eavmu'
        approvalMessage = `Application rejected by EAMVU Officer (Agent: ${agentId})`
        console.log(`✅ EAMVU OFFICER: Agent ${agentId} rejected application`)
        
      } catch (error) {
        console.error('❌ Error rejecting assignment:', error);
        return res.status(500).json({ error: 'Failed to reject assignment' });
      }
    } else if (department === 'CIU' && action === 'approve') {
      finalStatus = 'application_completed'
      approvalMessage = 'Application completed by CIU'
    } else if (department === 'CIU' && action === 'reject') {
      finalStatus = 'rejected_by_ciu'
      approvalMessage = 'Application rejected by CIU'
    } else if (department === 'RRU' && action === 'resolve') {
      finalStatus = 'resolved_by_rru'
      approvalMessage = 'Application resolved by RRU'
    } else if (department === 'RRU' && action === 'reject') {
      finalStatus = 'rejected_by_rru'
      approvalMessage = 'Application rejected by RRU'
    }

    console.log(`🔄 Updating status to: ${finalStatus} for LOS ID: ${losIdInt} (${applicationType})`)
    
    // Update status in the specific form table
    const result = await db.query(
      `select update_status_by_los_id($1, $2)`,
      [losIdInt, finalStatus]
    )

    console.log(`📊 Database function result:`, result.rows[0])
    console.log(`✅ ${approvalMessage} for ${applicationType} application ${losId}`)

    res.json({
      success: true,
      message: approvalMessage,
      losId: losIdInt,
      status: finalStatus,
      applicationType: applicationType,
      department: department,
      action: action
    })

  } catch (error) {
    console.error('❌ Error updating status workflow:', error.message)
    res.status(500).json({ 
      error: 'Failed to update application status workflow',
      details: error.message 
    })
  }
})

// Update document checklist by los_id and field name
router.post('/update-checklist', async (req, res) => {
  try {
    const { losId, fieldName, isVerified } = req.body
    
    // Convert losId to int
    const losIdInt = parseInt(losId)
    
    if (!losIdInt || !fieldName || typeof isVerified !== 'boolean') {
      return res.status(400).json({ 
        error: 'losId, fieldName, and isVerified (boolean) are required' 
      })
    }

    console.log(`🔄 Backend: Updating checklist for LOS ID: ${losIdInt}, Field: ${fieldName}, Verified: ${isVerified}`)

    // Call the database function update_checklist
    const result = await db.query(
      `SELECT update_checklist($1, $2, $3)`,
      [losIdInt, fieldName, isVerified]
    )

    console.log(`✅ Checklist updated successfully for LOS ID: ${losIdInt}, Field: ${fieldName}, Verified: ${isVerified}`)

    res.json({
      success: true,
      message: `Checklist field ${fieldName} updated to ${isVerified ? 'verified' : 'rejected'}`,
      losId: losIdInt,
      fieldName: fieldName,
      isVerified: isVerified
    })

  } catch (error) {
    console.error('❌ Error updating checklist:', error.message)
    res.status(500).json({ 
      error: 'Failed to update checklist',
      details: error.message 
    })
  }
})

// Update comment by los_id and field name
router.post('/update-comment', async (req, res) => {
  try {
    const { losId, fieldName, commentText } = req.body
    
    // Convert losId to int
    const losIdInt = parseInt(losId)
    
    if (!losIdInt || !fieldName || !commentText) {
      return res.status(400).json({ 
        error: 'losId, fieldName, and commentText are required' 
      })
    }

    console.log(`🔄 Backend: Updating comment for LOS ID: ${losIdInt}, Field: ${fieldName}, Comment: ${commentText}`)

    // Call the database function update_comment
    const result = await db.query(
      `SELECT update_comment($1, $2, $3)`,
      [losIdInt, fieldName, commentText]
    )

    console.log(`✅ Comment updated successfully for LOS ID: ${losIdInt}, Field: ${fieldName}`)

    res.json({
      success: true,
      message: `Comment updated for field ${fieldName}`,
      losId: losIdInt,
      fieldName: fieldName,
      commentText: commentText
    })

  } catch (error) {
    console.error('❌ Error updating comment:', error.message)
    res.status(500).json({ 
      error: 'Failed to update comment',
      details: error.message 
    })
  }
})

// Get all comments for a specific LOS ID
router.get('/comments/:losId', async (req, res) => {
  try {
    const { losId } = req.params
    const losIdInt = parseInt(losId)

    if (!losIdInt) {
      return res.status(400).json({ 
        error: 'Valid los_id is required' 
      })
    }

    console.log(`🔄 Backend: Fetching all comments for LOS ID: ${losIdInt}`)

    // Call the database function fetch_comment_by_los_id
    const result = await db.query(
      `SELECT fetch_comment_by_los_id($1)`,
      [losIdInt]
    )

    if (!result.rows || result.rows.length === 0) {
      console.log(`❌ No comments found for LOS ID: ${losIdInt}`)
      return res.status(404).json({ 
        error: 'Comments not found',
        losId: losIdInt
      })
    }

    const commentsData = result.rows[0].fetch_comment_by_los_id

    // Transform the comments data into the expected format
    const allComments = []
    const departmentMap = {
      'pb_comments': 'PB',
      'spu_comments': 'SPU',
      'cops_comments': 'COPS',
      'eamvu_comments': 'EAMVU',
      'ciu_comments': 'CIU',
      'rru_comments': 'RRU'
    }

    Object.entries(commentsData).forEach(([fieldName, commentText]) => {
      if (commentText && commentText.trim() !== '') {
        allComments.push({
          field_name: fieldName,
          comment_text: commentText,
          department: departmentMap[fieldName] || fieldName.toUpperCase()
        })
      }
    })

    console.log(`✅ Successfully fetched ${allComments.length} comments for LOS ID: ${losIdInt}`)

    res.json({
      success: true,
      losId: losIdInt,
      comments: allComments
    })

  } catch (error) {
    console.error('❌ Error fetching comments:', error.message)
    res.status(500).json({ 
      error: 'Failed to fetch comments',
      details: error.message 
    })
  }
})

// Get form data by los_id using database function
router.get('/form/:losId', async (req, res) => {
  try {
    const { losId } = req.params
    const losIdInt = parseInt(losId)

    if (!losIdInt) {
      return res.status(400).json({ 
        error: 'Valid los_id is required' 
      })
    }

    console.log(`🔄 Backend: Fetching form data for LOS ID: ${losIdInt}`)

    // Call the database function get_form_by_los_id
    const result = await db.query(
      `SELECT get_form_by_los_id($1)`,
      [losIdInt]
    )

    if (!result.rows || result.rows.length === 0) {
      console.log(`❌ No form data found for LOS ID: ${losIdInt}`)
      return res.status(404).json({ 
        error: 'Form data not found',
        losId: losIdInt
      })
    }

    const formData = result.rows[0].get_form_by_los_id

    console.log(`✅ Successfully fetched form data for LOS ID: ${losIdInt}`)
    console.log(`📋 Form data:`, formData)

    res.json({
      success: true,
      losId: losIdInt,
      formData: formData
    })

  } catch (error) {
    console.error('❌ Error fetching form data:', error.message)
    res.status(500).json({ 
      error: 'Failed to fetch form data',
      details: error.message 
    })
  }
})

// Generic endpoint for getting applications by department
router.get('/department/:dept', async (req, res) => {
  try {
    const department = req.params.dept.toUpperCase()
    console.log(`🔄 Backend: Fetching applications for ${department} department...`)
    
    // Get status parameters for the department
    const statusParams = getStatusParameters(department)
    console.log(`📊 ${department} can view statuses:`, statusParams)
    
    if (department === 'PB') {
      console.log('📊 PB has access to ALL applications')
    }
    
    // Get applications accessible to the department from all application types
    const queries = [
      // CashPlus applications
      db.query(`
        SELECT 
          ca.id,
          'CashPlus' as application_type,
          COALESCE(CONCAT(ca.first_name, ' ', ca.last_name), 'Unknown Applicant') as applicant_name,
          'CashPlus Loan' as loan_type,
          COALESCE(ca.amount_requested, 0) as loan_amount,
          COALESCE(ca.status, 'submitted_by_pb') as status,
          'medium' as priority,
          ca.created_at,
          'Karachi Main' as branch
        FROM cashplus_applications ca
        LEFT JOIN ilos_applications ia ON ia.loan_type = 'cashplus_applications' AND ia.id = ca.id
        ${buildStatusWhereClause(department, 'ca')}
        AND ca.created_at IS NOT NULL
        ${department === 'COPS' ? 'AND (ia.cops_submitted IS NULL OR ia.cops_submitted = false)' : ''}
        ${department === 'EAMVU' ? 'AND (ia.eavmu_submitted IS NULL OR ia.eavmu_submitted = false)' : ''}
        ORDER BY ca.created_at DESC 
        LIMIT 50
      `, statusParams).catch(() => null),
      
      // Auto Loan applications
      db.query(`
        SELECT 
          al.id,
          'AutoLoan' as application_type,
          COALESCE(CONCAT(al.first_name, ' ', al.last_name), 'Unknown Applicant') as applicant_name,
          'Auto Loan' as loan_type,
          COALESCE(al.price_value, 0) as loan_amount,
          COALESCE(al.status, 'submitted_by_pb') as status,
          'medium' as priority,
          al.created_at,
          'Lahore Main' as branch
        FROM autoloan_applications al
        LEFT JOIN ilos_applications ia ON ia.loan_type = 'autoloan_applications' AND ia.id = al.id
        ${buildStatusWhereClause(department, 'al')}
        AND al.created_at IS NOT NULL
        ${department === 'COPS' ? 'AND (ia.cops_submitted IS NULL OR ia.cops_submitted = false)' : ''}
        ${department === 'EAMVU' ? 'AND (ia.eavmu_submitted IS NULL OR ia.eavmu_submitted = false)' : ''}
        ORDER BY al.created_at DESC 
        LIMIT 50
      `, statusParams).catch(() => null),
      
      // SME ASAAN applications
      db.query(`
        SELECT 
        id,
        'SMEASAAN' as application_type,
        COALESCE(applicant_name, 'Unknown Applicant') as applicant_name,
        'SME Loan' as loan_type,
        COALESCE(desired_loan_amount, 0) as loan_amount,
        COALESCE(sa.status, 'submitted_by_pb') as status,
        'high' as priority,
        sa.created_at,
        'Islamabad' as branch
      FROM smeasaan_applications sa
      LEFT JOIN ilos_applications ia ON ia.loan_type = 'smeasaan' AND ia.id = sa.id
      ${buildStatusWhereClause(department, 'sa')}
      AND sa.created_at IS NOT NULL
      ${department === 'COPS' ? 'AND (ia.cops_submitted IS NULL OR ia.cops_submitted = false)' : ''}
      ${department === 'EAMVU' ? 'AND (ia.eavmu_submitted IS NULL OR ia.eavmu_submitted = false)' : ''}
      ORDER BY sa.created_at DESC 
      LIMIT 50
      `, statusParams).catch(() => null),
      
      // Commercial Vehicle applications
      db.query(`
        SELECT 
          cv.id,
          'CommercialVehicle' as application_type,
          COALESCE(cv.applicant_name, 'Unknown Applicant') as applicant_name,
          'Commercial Vehicle Loan' as loan_type,
          COALESCE(cv.desired_loan_amount, 0) as loan_amount,
          COALESCE(cv.status, 'submitted_by_pb') as status,
          'high' as priority,
          cv.created_at,
          'Karachi Main' as branch
        FROM commercial_vehicle_applications cv
        LEFT JOIN ilos_applications ia ON ia.loan_type = 'commercial_vehicle' AND ia.id = cv.id
        ${buildStatusWhereClause(department, 'cv')}
        AND cv.created_at IS NOT NULL
        ${department === 'COPS' ? 'AND (ia.cops_submitted IS NULL OR ia.cops_submitted = false)' : ''}
        ${department === 'EAMVU' ? 'AND (ia.eavmu_submitted IS NULL OR ia.eavmu_submitted = false)' : ''}
        ORDER BY cv.created_at DESC 
        LIMIT 50
      `, statusParams).catch(() => null),
      
      // AmeenDrive applications
      db.query(`
        SELECT 
          ad.id,
          'AmeenDrive' as application_type,
          COALESCE(ad.applicant_full_name, 'Unknown Applicant') as applicant_name,
          'AmeenDrive Loan' as loan_type,
          COALESCE(ad.price_value, 0) as loan_amount,
          COALESCE(ad.status, 'submitted_by_pb') as status,
          'medium' as priority,
          ad.created_at,
          'Lahore Main' as branch
        FROM ameendrive_applications ad
        LEFT JOIN ilos_applications ia ON ia.loan_type = 'ameendrive' AND ia.id = ad.id
        ${buildStatusWhereClause(department, 'ad')}
        AND ad.created_at IS NOT NULL
        ${department === 'COPS' ? 'AND (ia.cops_submitted IS NULL OR ia.cops_submitted = false)' : ''}
        ${department === 'EAMVU' ? 'AND (ia.eavmu_submitted IS NULL OR ia.eavmu_submitted = false)' : ''}
        ORDER BY ad.created_at DESC 
        LIMIT 50
      `, statusParams).catch(() => null),
      
      // Platinum Credit Card applications
      db.query(`
        SELECT 
          pc.id,
          'PlatinumCreditCard' as application_type,
          COALESCE(CONCAT(pc.first_name, ' ', pc.last_name), 'Unknown Applicant') as applicant_name,
          'Platinum Credit Card' as loan_type,
          COALESCE(0, 0) as loan_amount,
          COALESCE(pc.status, 'submitted_by_pb') as status,
          'low' as priority,
          pc.created_at,
          'Karachi Main' as branch
        FROM platinum_card_applications pc
        LEFT JOIN ilos_applications ia ON ia.loan_type = 'platinum_card' AND ia.id = pc.id
        ${buildStatusWhereClause(department, 'pc')}
        AND pc.created_at IS NOT NULL
        ${department === 'COPS' ? 'AND (ia.cops_submitted IS NULL OR ia.cops_submitted = false)' : ''}
        ${department === 'EAMVU' ? 'AND (ia.eavmu_submitted IS NULL OR ia.eavmu_submitted = false)' : ''}
        ORDER BY pc.created_at DESC 
        LIMIT 50
      `, statusParams).catch(() => null),
      
      // Classic Credit Card applications
      db.query(`
        SELECT 
          cc.id,
          'ClassicCreditCard' as application_type,
          COALESCE(cc.full_name, 'Unknown Applicant') as applicant_name,
          'Classic Credit Card' as loan_type,
          COALESCE(0, 0) as loan_amount,
          COALESCE(cc.status, 'submitted_by_pb') as status,
          'low' as priority,
          cc.created_at,
          'Islamabad' as branch
        FROM creditcard_applications cc
        LEFT JOIN ilos_applications ia ON ia.loan_type = 'creditcard' AND ia.id = cc.id
        ${buildStatusWhereClause(department, 'cc')}
        AND cc.created_at IS NOT NULL
        ${department === 'COPS' ? 'AND (ia.cops_submitted IS NULL OR ia.cops_submitted = false)' : ''}
        ${department === 'EAMVU' ? 'AND (ia.eavmu_submitted IS NULL OR ia.eavmu_submitted = false)' : ''}
        ORDER BY cc.created_at DESC 
        LIMIT 50
      `, statusParams).catch(() => null)
    ]

    const results = await Promise.allSettled(queries)
    
    // Combine all results and sort by created_at
    let allApplications = []
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value && result.value.rows && result.value.rows.length > 0) {
        console.log(`✅ Table ${index + 1} returned ${result.value.rows.length} applications for ${department}`)
        allApplications = allApplications.concat(result.value.rows)
      } else {
        console.log(`❌ Table ${index + 1} failed or returned no data for ${department}`)
      }
    })

    console.log(`📊 Total ${department} applications collected: ${allApplications.length}`)

    // Sort by created_at (most recent first)
    allApplications.sort((a, b) => {
      const dateA = new Date(a.created_at || 0)
      const dateB = new Date(b.created_at || 0)
      return dateB - dateA
    })

    // Format the response to match the frontend expectations
    const formattedApplications = await Promise.all(allApplications.map(async (app, index) => {
      // Fetch the actual los_id from ilos_applications table
      let actualLosId = null
      try {
        const losIdResult = await db.query(
          `SELECT los_id FROM ilos_applications WHERE loan_type = $1 OR id = $2`,
          [app.application_type.toLowerCase(), app.id]
        )
        
        if (losIdResult.rows.length > 0) {
          actualLosId = losIdResult.rows[0].los_id
          console.log(`✅ Found los_id ${actualLosId} for ${app.application_type} application ${app.id}`)
        } else {
          console.log(`⚠️ No los_id found for ${app.application_type} application ${app.id}`)
          actualLosId = app.id // Fallback to database ID (will get LOS- prefix later)
        }
      } catch (error) {
        console.error(`❌ Error fetching los_id for ${app.application_type} application ${app.id}:`, error.message)
        actualLosId = app.id // Fallback to database ID (will get LOS- prefix later)
      }

      return {
        id: `${app.application_type}-${app.id}`, // Create unique ID by combining type and database ID
        los_id: `LOS-${actualLosId}`, // Use actual los_id from ilos_applications
        applicant_name: app.applicant_name || 'Unknown Applicant',
        loan_type: app.loan_type || 'Personal Loan',
        loan_amount: app.loan_amount || 0,
        status: app.status || 'submitted_by_pb',
        priority: app.priority || 'medium',
        assigned_officer: null, // Will be assigned by department
        created_at: app.created_at || new Date().toISOString(),
        branch: app.branch || 'Main Branch',
        application_type: app.application_type, // Keep the application type for reference
        // Mock documents for verification
        documents: [
          { id: `doc-${app.application_type}-${app.id}-1`, name: "CNIC Copy", status: "pending", required: true },
          { id: `doc-${app.application_type}-${app.id}-2`, name: "Salary Slip", status: "pending", required: true },
          { id: `doc-${app.application_type}-${app.id}-3`, name: "Bank Statement", status: "pending", required: true },
          { id: `doc-${app.application_type}-${app.id}-4`, name: "Employment Letter", status: "pending", required: false },
        ],
      }
    }))

    console.log(`✅ Sending ${formattedApplications.length} ${department} applications to frontend`)
    res.json(formattedApplications)
  } catch (err) {
    console.error(`Error fetching ${req.params.dept} applications:`, err.message)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Agent-specific applications endpoint
router.get('/department/EAMVU_OFFICER/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    console.log(`🔄 Backend: Fetching applications for agent ${agentId}...`);
    
    // Get all active assignments for this agent
    const query = `
      SELECT 
        aa.los_id,
        aa.assigned_at,
        aa.assignment_notes,
        aa.status as assignment_status,
        ia.loan_type as application_type,
        ia.id,
        -- Get applicant details from appropriate table
        CASE 
          WHEN ia.loan_type = 'cashplus_applications' THEN (
            SELECT CONCAT(ca.first_name, ' ', ca.last_name) 
            FROM cashplus_applications ca WHERE ca.id = ia.id
          )
          WHEN ia.loan_type = 'autoloan_applications' THEN (
            SELECT CONCAT(al.first_name, ' ', al.last_name) 
            FROM autoloan_applications al WHERE al.id = ia.id  
          )
          WHEN ia.loan_type = 'smeasaan_applications' THEN (
            SELECT sa.applicant_name FROM smeasaan_applications sa WHERE sa.id = ia.id
          )
          WHEN ia.loan_type = 'ameendrive_applications' THEN (
            SELECT ad.applicant_full_name FROM ameendrive_applications ad WHERE ad.id = ia.id
          )
          WHEN ia.loan_type = 'platinum_card_applications' THEN (
            SELECT CONCAT(pc.first_name, ' ', pc.last_name) FROM platinum_card_applications pc WHERE pc.id = ia.id
          )
          WHEN ia.loan_type = 'creditcard_applications' THEN (
            SELECT cc.full_name FROM creditcard_applications cc WHERE cc.id = ia.id
          )
          ELSE 'Unknown Applicant'
        END as applicant_name,
        -- Get application status
        CASE 
          WHEN ia.loan_type = 'cashplus_applications' THEN (SELECT ca.status FROM cashplus_applications ca WHERE ca.id = ia.id)
          WHEN ia.loan_type = 'autoloan_applications' THEN (SELECT al.status FROM autoloan_applications al WHERE al.id = ia.id)
          WHEN ia.loan_type = 'smeasaan_applications' THEN (SELECT sa.status FROM smeasaan_applications sa WHERE sa.id = ia.id)
          WHEN ia.loan_type = 'ameendrive_applications' THEN (SELECT ad.status FROM ameendrive_applications ad WHERE ad.id = ia.id)
          WHEN ia.loan_type = 'platinum_card_applications' THEN (SELECT pc.status FROM platinum_card_applications pc WHERE pc.id = ia.id)
          WHEN ia.loan_type = 'creditcard_applications' THEN (SELECT cc.status FROM creditcard_applications cc WHERE cc.id = ia.id)
          ELSE 'UNKNOWN'
        END as application_status,
        -- Get loan amount
        CASE 
          WHEN ia.loan_type = 'cashplus_applications' THEN (SELECT ca.amount_requested FROM cashplus_applications ca WHERE ca.id = ia.id)
          WHEN ia.loan_type = 'autoloan_applications' THEN (SELECT al.price_value FROM autoloan_applications al WHERE al.id = ia.id)
          WHEN ia.loan_type = 'smeasaan_applications' THEN (SELECT sa.desired_loan_amount FROM smeasaan_applications sa WHERE sa.id = ia.id)
          WHEN ia.loan_type = 'ameendrive_applications' THEN (SELECT ad.price_value FROM ameendrive_applications ad WHERE ad.id = ia.id)
          WHEN ia.loan_type = 'platinum_card_applications' THEN 0
          WHEN ia.loan_type = 'creditcard_applications' THEN 0
          ELSE 0
        END as loan_amount
      FROM agent_assignments aa
      JOIN ilos_applications ia ON aa.los_id = ia.los_id
      WHERE aa.agent_id = $1 
        AND aa.status = 'active'
        AND aa.assigned_at IS NOT NULL
      ORDER BY aa.assigned_at DESC;
    `;
    
    const result = await db.query(query, [agentId]);
    
    // Format the response to match frontend expectations
    const formattedApplications = result.rows.map(app => ({
      id: `${app.application_type}-${app.id}`,
      los_id: `LOS-${app.los_id}`,
      applicant_name: app.applicant_name || 'Unknown Applicant',
      loan_type: app.application_type,
      loan_amount: app.loan_amount || 0,
      status: app.application_status || 'assigned_to_eavmu_officer',
      priority: 'medium',
      assigned_officer: agentId,
      created_at: app.assigned_at || new Date().toISOString(),
      branch: 'Main Branch',
      application_type: app.application_type,
      assignment_notes: app.assignment_notes,
      documents: [
        { id: `doc-${app.application_type}-${app.id}-1`, name: "CNIC Copy", status: "pending", required: true },
        { id: `doc-${app.application_type}-${app.id}-2`, name: "Salary Slip", status: "pending", required: true },
        { id: `doc-${app.application_type}-${app.id}-3`, name: "Bank Statement", status: "pending", required: true },
        { id: `doc-${app.application_type}-${app.id}-4`, name: "Employment Letter", status: "pending", required: false },
      ],
    }))
    
    console.log(`✅ Found ${result.rows.length} active assignments for agent ${agentId}`);
    res.json(formattedApplications);
    
  } catch (error) {
    console.error(`❌ Error fetching applications for agent:`, error);
    res.status(500).json({ error: 'Failed to fetch agent applications' });
  }
});

// Simple test endpoint
router.get('/agents-test', (req, res) => {
  res.json({ message: 'Agents test route works!', timestamp: new Date().toISOString() });
});

// Get all agents
router.get('/agents', async (req, res) => {
  try {
    console.log('🔄 Backend: Fetching all EAMVU agents...');
    
    // Simple test first
    const testResult = await db.query('SELECT COUNT(*) as count FROM eamvu_agents');
    console.log(`📊 Total agents in database: ${testResult.rows[0].count}`);
    
    const result = await db.query(`
      SELECT 
        ea.agent_id,
        ea.name,
        ea.email,
        ea.phone,
        ea.status,
        ea.location,
        CASE 
          WHEN ea.expertise IS NULL THEN NULL
          ELSE array_to_string(ea.expertise, ', ')
        END as expertise,
        ea.max_concurrent_assignments,
        COALESCE(
          (SELECT COUNT(*) FROM agent_assignments WHERE agent_id = ea.agent_id AND status = 'active'), 
          0
        ) as assigned_applications
      FROM eamvu_agents ea
      WHERE ea.status = 'active'
      ORDER BY ea.name
    `);
    
    console.log(`✅ Found ${result.rows.length} active agents`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Error fetching agents:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch agents', details: error.message });
  }
});

// Get agent workload and statistics
router.get('/agents/:agentId/workload', async (req, res) => {
  try {
    const { agentId } = req.params;
    console.log(`🔄 Backend: Fetching workload for agent ${agentId}...`);
    
    const workloadQuery = `
      SELECT 
        ea.name,
        ea.status,
        ea.max_concurrent_assignments,
        COALESCE(
          (SELECT COUNT(*) FROM agent_assignments WHERE agent_id = ea.agent_id AND status = 'active'), 
          0
        ) as current_assignments,
        COALESCE(
          (SELECT COUNT(*) FROM agent_assignments WHERE agent_id = ea.agent_id AND assigned_at >= CURRENT_DATE - INTERVAL '7 days'), 
          0
        ) as assigned_this_week,
        COALESCE(
          (SELECT COUNT(*) FROM agent_assignments WHERE agent_id = ea.agent_id AND completed_at >= CURRENT_DATE - INTERVAL '7 days'), 
          0
        ) as completed_this_week,
        COALESCE(
          (SELECT AVG(EXTRACT(EPOCH FROM (completed_at - assigned_at))/3600) 
           FROM agent_assignments 
           WHERE agent_id = ea.agent_id AND completed_at IS NOT NULL), 
          0
        ) as avg_completion_hours
      FROM eamvu_agents ea
      WHERE ea.agent_id = $1
    `;
    
    const result = await db.query(workloadQuery, [agentId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    console.log(`✅ Fetched workload for agent ${agentId}`);
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Error fetching agent workload:', error);
    res.status(500).json({ error: 'Failed to fetch agent workload' });
  }
});

// MOVED: Generic /:id route after specific routes to avoid conflicts
// GET one application by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ilos_applications WHERE los_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching application:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
