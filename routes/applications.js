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

// Helper function to get status range for each department
const getStatusRangeForDepartment = (department) => {
  const statusRanges = {
    'PB': ['PB_SUBMITTED', 'SUBMITTED_TO_COPS', 'SUBMITTED_TO_EAMVU', 'SUBMITTED_TO_CIU', 'SUBMITTED_TO_RRU', 'Application_Accepted', 'Application_Rejected', 'Application_Returned'],
    'SPU': ['PB_SUBMITTED', 'SUBMITTED_TO_COPS', 'SUBMITTED_TO_EAMVU', 'SUBMITTED_TO_CIU', 'SUBMITTED_TO_RRU'],
    'COPS': ['SUBMITTED_TO_COPS', 'SUBMITTED_TO_EAMVU', 'SUBMITTED_TO_CIU', 'SUBMITTED_TO_RRU', 'Application_Accepted', 'Application_Rejected', 'Application_Returned'],
    'EAMVU': ['SUBMITTED_TO_COPS', 'SUBMITTED_TO_EAMVU', 'SUBMITTED_TO_CIU', 'SUBMITTED_TO_RRU', 'Application_Accepted', 'Application_Rejected', 'Application_Returned'],
    'CIU': ['SUBMITTED_TO_CIU', 'SUBMITTED_TO_RRU', 'Application_Accepted', 'Application_Rejected', 'Application_Returned'],
    'RRU': ['SUBMITTED_TO_RRU', 'Application_Accepted', 'Application_Rejected', 'Application_Returned']
  }
  
  return statusRanges[department] || []
}

// Helper function to build WHERE clause for status filtering
const buildStatusWhereClause = (department) => {
  const allowedStatuses = getStatusRangeForDepartment(department)
  
  if (department === 'PB') {
    return 'WHERE 1=1' // PB can see all applications
  }
  
  if (allowedStatuses.length === 0) {
    return 'WHERE 1=0' // No access for unknown department
  }
  
  const statusConditions = allowedStatuses.map((status, index) => `status = $${index + 1}`).join(' OR ')
  return `WHERE ${statusConditions}`
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
    console.error('Error testing Platinum Credit Card:', err);
    res.status(500).json({ 
      error: err.message,
      stack: err.stack 
    });
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
    const statusWhereClause = buildStatusWhereClause(department)
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
          COALESCE(ca.status, 'PB_SUBMITTED') as status,
          'medium' as priority,
          ca.created_at,
          'Karachi Main' as branch
        FROM cashplus_applications ca
        ${statusWhereClause}
        AND ca.created_at IS NOT NULL
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
          COALESCE(al.status, 'PB_SUBMITTED') as status,
          'medium' as priority,
          al.created_at,
          'Lahore Main' as branch
        FROM autoloan_applications al
        ${statusWhereClause}
        AND al.created_at IS NOT NULL
        ORDER BY al.created_at DESC 
        LIMIT 50
      `, statusParams).catch(() => null),
      
      // SME ASAAN applications
      db.query(`
        SELECT 
          sa.id,
          'SMEASAAN' as application_type,
          COALESCE(sa.applicant_name, 'Unknown Applicant') as applicant_name,
          'SME Loan' as loan_type,
          COALESCE(sa.desired_loan_amount, 0) as loan_amount,
          COALESCE(sa.status, 'PB_SUBMITTED') as status,
          'high' as priority,
          sa.created_at,
          'Islamabad' as branch
        FROM smeasaan_applications sa
        ${statusWhereClause}
        AND sa.created_at IS NOT NULL
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
          COALESCE(cv.status, 'PB_SUBMITTED') as status,
          'high' as priority,
          cv.created_at,
          'Karachi Main' as branch
        FROM commercial_vehicle_applications cv
        ${statusWhereClause}
        AND cv.created_at IS NOT NULL
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
          COALESCE(ad.status, 'PB_SUBMITTED') as status,
          'medium' as priority,
          ad.created_at,
          'Lahore Main' as branch
        FROM ameendrive_applications ad
        ${statusWhereClause}
        AND ad.created_at IS NOT NULL
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
          COALESCE(pc.status, 'PB_SUBMITTED') as status,
          'low' as priority,
          pc.created_at,
          'Karachi Main' as branch
        FROM platinum_card_applications pc
        ${statusWhereClause}
        AND pc.created_at IS NOT NULL
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
          COALESCE(cc.status, 'PB_SUBMITTED') as status,
          'low' as priority,
          cc.created_at,
          'Islamabad' as branch
        FROM creditcard_applications cc
        ${statusWhereClause}
        AND cc.created_at IS NOT NULL
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
          actualLosId = `LOS-${app.id}` // Fallback to generated los_id
        }
      } catch (error) {
        console.error(`❌ Error fetching los_id for ${app.application_type} application ${app.id}:`, error.message)
        actualLosId = `LOS-${app.id}` // Fallback to generated los_id
      }

      return {
        id: `${app.application_type}-${app.id}`, // Create unique ID by combining type and database ID
        los_id: `LOS-${actualLosId}`, // Use actual los_id from ilos_applications
        applicant_name: app.applicant_name || 'Unknown Applicant',
        loan_type: app.loan_type || 'Personal Loan',
        loan_amount: app.loan_amount || 0,
        status: app.status || 'PB_SUBMITTED',
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

module.exports = router;
