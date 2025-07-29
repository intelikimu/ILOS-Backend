

const express = require('express');
const router = express.Router();
const db = require('../db1');

// Helper function to sanitize numeric fields
function sanitizeNumericFields(obj, numericKeys = []) {
  const clonedObj = { ...obj };
  numericKeys.forEach(key => {
    if (clonedObj[key] === '' || clonedObj[key] === undefined || clonedObj[key] === 'undefined') {
      clonedObj[key] = null;
    } else if (clonedObj[key] && !isNaN(clonedObj[key])) {
      clonedObj[key] = parseFloat(clonedObj[key]);
    }
  });
  return clonedObj;
}

// Helper function to ensure boolean fields are valid
function sanitizeBooleanFields(obj, booleanKeys = []) {
  const clonedObj = { ...obj };
  booleanKeys.forEach(key => {
    if (clonedObj[key] === '' || clonedObj[key] === undefined || clonedObj[key] === 'undefined') {
      clonedObj[key] = null;
    } else if (typeof clonedObj[key] === 'string') {
      const value = clonedObj[key].toLowerCase();
      if (value === 'yes' || value === 'true' || value === '1') {
        clonedObj[key] = true;
      } else if (value === 'no' || value === 'false' || value === '0') {
        clonedObj[key] = false;
      } else {
        clonedObj[key] = null;
      }
    }
  });
  return clonedObj;
}

// Define the keys for each type of field
const numericKeys = [
  "current_rate_kibor", "current_rate_spread", "price_value", "takaful_rate",
  "musharakah_share_percent", "musharakah_share_amount", "auto_financing_percent", 
  "auto_financing_amount", "monthly_rental", "curr_monthly_rent", "percent_shareholding",
  "regular_monthly", "gross_income", "net_take_home", "other_monthly_income", "monthly_income",
  "avg_monthly_savings"
];

const smallintKeys = [
  "year_of_manufacture", "loan_period", "dependents_children", "other_dependents", 
  "curr_rented_years", "perm_car_year", "years_in_business", "prev_experience_years"
];

const booleanKeys = [
  "co_applicant_case", "tracker_company_arranged", "agreement_understanding", 
  "spouse_employed", "nontax_applied_financing", "nontax_no_ntn"
];

const dateFields = [
  "date_of_birth" // Remove signature_date
];

// BYTEA fields for handling signatures and stamps
const byteaFields = [
  "applicant_signature", "co_applicant_signature", "applicant_signature_cnic", 
  "co_applicant_signature_cnic", "nontax_applicant_signature", "dealer_stamp", "branch_stamp"
];

// POST: Create new Ameen Drive application with children
router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    // Sanitize the data before inserting
    req.body = sanitizeNumericFields(req.body, numericKeys);
    req.body = sanitizeBooleanFields(req.body, booleanKeys);
    
    // Handle smallint fields specifically
    for (const key of smallintKeys) {
      if (req.body[key] === "" || req.body[key] === undefined) {
        req.body[key] = null;
      } else if (req.body[key] !== null) {
        const parsed = parseInt(req.body[key]);
        req.body[key] = !isNaN(parsed) ? parsed : null;
      }
    }
    
    // Handle date fields
    for (const key of dateFields) {
      if (req.body[key] === "" || req.body[key] === undefined) {
        req.body[key] = null;
      }
    }

    // Handle BYTEA fields - typically these would be base64 strings or file paths
    // For now, just ensure they're not empty strings
    for (const key of byteaFields) {
      if (req.body[key] === "") {
        req.body[key] = null;
      }
    }

    console.log('Sanitized request body:', req.body);

    await client.query('BEGIN');
    // Insert main application
    const fields = [
      "customer_id", "city", "auto_application_id", "product_type", "pricing_plan", "payment_mode", "current_rate_kibor",
      "current_rate_spread", "co_applicant_case", "co_applicant_name", "co_applicant_relationship",
      "vehicle_manufacturer", "vehicle_model", "year_of_manufacture", "vehicle_class_engine_size", "price_value",
      "used_seller_name", "used_seller_cnic", "used_house_no", "used_street", "used_area", "used_landmark", "used_city", "used_country", "used_postal_code", "used_contact_no", "used_bank", "used_branch", "used_account_no",
      "takaful_company_name", "takaful_rate", "tracker_company_arranged", "facility_type", "musharakah_share_percent", "musharakah_share_amount", "auto_financing_percent", "auto_financing_amount", "monthly_rental", "monthly_rental_in_words", "loan_period", "delivery_option", "agreement_understanding",
      "applicant_full_name", "father_husband_name", "mother_maiden_name", "date_of_birth", "gender", "marital_status", "applicant_cnic", "national_tax_no", "passport_no", "dependents_children", "other_dependents", "educational_qualification",
      "curr_house_no", "curr_street", "curr_area", "curr_landmark", "curr_city", "curr_country", "curr_postal_code", "residence_status", "curr_monthly_rent", "curr_accommodation_type", "curr_residence_no", "curr_rented_years", "curr_mobile_no", "curr_fax_no", "curr_email",
      "perm_house_no", "perm_street", "perm_area", "perm_landmark", "perm_city", "perm_country", "perm_postal_code", "existing_car_info", "perm_car_manufacturer", "perm_car_model", "perm_car_year", "perm_car_status",
      "employment_type", "company_name", "business_type", "business_type_other", "profession", "nature_of_business", "years_in_business", "percent_shareholding", "employment_status", "designation", "department", "grade", 
      "business_address", "business_street", "business_tehsil_district_area", "business_city", "business_country", "business_postal_code", "business_telephone_no", "business_fax_no", "business_nearest_landmark",
      "prev_employer_name", "prev_designation", "prev_experience_years", "prev_employer_tel", "prof_company_name", "prof_address", "prof_profession",
      "regular_monthly", "gross_income", "net_take_home", "other_monthly_income", "source_of_other_income", "monthly_income", "avg_monthly_savings", "spouse_employed", "spouse_income_source",
      "applicant_signature", "co_applicant_signature", "applicant_signature_cnic", "co_applicant_signature_cnic", // BYTEA fields
      "channel_code", "pb_so_employee_no", "program_code", "referral_id", "branch_code", "sm_employee_no", "application_source", "branch_name_code", "dealership_name",
      "nontax_full_name", "nontax_resident_of", "nontax_applied_financing", "nontax_no_ntn", "nontax_applicant_signature", // BYTEA field
      "dealer_stamp", "branch_stamp" // BYTEA fields, removed signature_date
    ];
    
    // Create an array of values that matches the fields array
    const values = [];
    for (const field of fields) {
      values.push(req.body[field]);
    }
    
    const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(', ');
    const insertQuery = `
      INSERT INTO ameendrive_applications (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *;
    `;
    
    console.log('Executing SQL:', insertQuery);
    console.log('With values:', values);
    
    const result = await client.query(insertQuery, values);
    const application = result.rows[0];
    const applicationId = application.id;

    // --- Insert bank accounts ---
    if (Array.isArray(req.body.bank_accounts)) {
      for (const acc of req.body.bank_accounts) {
        await client.query(
          `INSERT INTO ameendrive_bank_accounts (application_id, bank_name, branch, account_no, account_type, currency_type)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [applicationId, acc.bank_name, acc.branch, acc.account_no, acc.account_type, acc.currency_type]
        );
      }
    }
    // --- Insert bank facilities ---
    if (Array.isArray(req.body.bank_facilities)) {
      for (const fac of req.body.bank_facilities) {
        await client.query(
          `INSERT INTO ameendrive_bank_facilities (application_id, financing_payable_to, purpose_of_financing, date_financing_taken, outstanding_balance, monthly_installment)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [applicationId, fac.financing_payable_to, fac.purpose_of_financing, fac.date_financing_taken, fac.outstanding_balance, fac.monthly_installment]
        );
      }
    }
    // --- Insert references ---
    if (Array.isArray(req.body.references)) {
      for (const ref of req.body.references) {
        await client.query(
          `INSERT INTO ameendrive_references (
            application_id, reference_no, name, cnic, relationship, relationship_other, address, residence_no, mobile_no, email, business_address, office_telephone_no
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            applicationId, ref.reference_no, ref.name, ref.cnic, ref.relationship, ref.relationship_other,
            ref.address, ref.residence_no, ref.mobile_no, ref.email, ref.business_address, ref.office_telephone_no
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, application, application_id: applicationId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating AmeenDrive application and children:', err);
    res.status(500).json({ error: `Error creating AmeenDrive application: ${err.message}` });
  } finally {
    client.release();
  }
});

// GET: Fetch application and children by ID

// GET: Fetch application and children by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mainResult = await db.query('SELECT * FROM ameendrive_applications WHERE id = $1', [id]);
    if (mainResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    const application = mainResult.rows[0];
    const [bankAccounts, bankFacilities, references, Am_documents] = await Promise.all([
      db.query('SELECT * FROM ameendrive_bank_accounts WHERE application_id = $1', [id]),
      db.query('SELECT * FROM ameendrive_bank_facilities WHERE application_id = $1', [id]),
      db.query('SELECT * FROM ameendrive_references WHERE application_id = $1', [id]),
      db.query('SELECT * FROM ameendrive_documents WHERE application_id = $1', [id])
    ]);
    const response = {
      ...application,
      bank_accounts: bankAccounts.rows,
      bank_facilities: bankFacilities.rows,
      references: references.rows,
      documents: Am_documents.rows
      
    };
    res.json(response);
  } catch (err) {
    console.error('Error fetching AmeenDrive application:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
