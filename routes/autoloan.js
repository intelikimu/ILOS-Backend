

const express = require('express');
const router = express.Router();
const db = require('../db1');

// POST: Create new auto loan application with child tables
router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    // --- Insert main table ---
    const fields = [ // All columns except serial id and created_at
      "customer_id", "city", "auto_application_id", "product_type", "payment_mode", "pricing_plan", "fixed_rate",
      "kibor_rate", "margin", "vehicle_manufacturer", "vehicle_model", "year_of_manufacture", "vehicle_class_engine_size",
      "price_value", "down_payment_percent", "down_payment_amount", "desired_loan_amount", "installment_period",
      "used_seller_name", "used_seller_cnic", "used_house_no", "used_street", "used_area", "used_landmark",
      "used_city", "used_country", "used_postal_code", "used_contact_no", "used_bank", "used_branch", "used_account_no",
      "insurance_company_name", "insurance_rate", "dealer_name", "gender", "title", "first_name", "middle_name",
      "last_name", "applicant_cnic", "ntn", "date_of_birth", "passport_no", "educational_qualification",
      "mothers_maiden_name", "father_or_husband_name", "marital_status", "num_children", "num_other_dependents",
      "dependents_specify", "next_of_kin", "next_of_kin_relation", "next_of_kin_cnic", "next_of_kin_contact",
      "curr_house_no", "curr_street", "curr_area", "curr_landmark", "curr_city", "curr_country", "curr_postal_code",
      "curr_tel_residence", "curr_mobile", "curr_email", "curr_years_address", "curr_years_city", "residential_status",
      "monthly_rent", "perm_house_no", "perm_street", "perm_area", "perm_city", "perm_country", "perm_postal_code",
      "perm_tel_residence", "co_borrower_case", "co_borrower_name", "co_borrower_relationship", "co_borrower_cnic",
      "employment_type", "company_name", "business_type", "business_type_other", "profession", "nature_of_business",
      "years_in_business", "shareholding_percent", "employment_status", "designation", "department", "grade_level",
      "business_address", "business_street", "business_area", "business_city", "business_country", "business_postal_code",
      "business_tel", "business_landmark", "prev_employer_name", "prev_designation", "prev_experience_years",
      "prev_employer_tel", "gross_monthly_salary", "other_monthly_income", "total_gross_monthly_income",
      "net_monthly_income", "other_income_type", "other_income_specify", "spouse_employed", "spousal_income",
      "spouse_income_source", "statement_to_be_sent", "repayment_bank_name", "repayment_branch", "repayment_account_no",
      "repayment_account_type", "repayment_currency_type", "application_source", "channel_code", "program_code",
      "branch_code", "so_employee_no", "so_employee_name", "pb_bm_employee_no", "pb_bm_employee_name", "sm_employee_no",
      "sm_employee_name", "dealership_name", "branch_name_code", "financing_option", "applicant_signature_date",
      "co_borrower_signature_date"
      // Add signature BYTEA fields if required, handling file uploads
    ];
    const values = fields.map(f => req.body[f]);
    const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(', ');
    const insertQuery = `INSERT INTO autoloan_applications (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *;`;
    const result = await client.query(insertQuery, values);
    const application = result.rows[0];
    const applicationId = application.id;

    // --- Insert child tables ---
    // Other bank accounts
    if (Array.isArray(req.body.other_bank_accounts)) {
      for (const acc of req.body.other_bank_accounts) {
        await client.query(
          `INSERT INTO autoloan_other_bank_accounts (application_id, bank_name, branch, account_no, account_type, currency_type)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [applicationId, acc.bank_name, acc.branch, acc.account_no, acc.account_type, acc.currency_type]
        );
      }
    }
    // Clean credit cards
    if (Array.isArray(req.body.credit_cards_clean)) {
      for (const cc of req.body.credit_cards_clean) {
        await client.query(
          `INSERT INTO autoloan_credit_cards_clean (application_id, bank_name, approved_limit)
           VALUES ($1, $2, $3)`,
          [applicationId, cc.bank_name, cc.approved_limit]
        );
      }
    }
    // Secured credit cards
    if (Array.isArray(req.body.credit_cards_secured)) {
      for (const cc of req.body.credit_cards_secured) {
        await client.query(
          `INSERT INTO autoloan_credit_cards_secured (application_id, bank_name, approved_limit)
           VALUES ($1, $2, $3)`,
          [applicationId, cc.bank_name, cc.approved_limit]
        );
      }
    }
    // Personal loans clean
    if (Array.isArray(req.body.personal_loans_clean)) {
      for (const pl of req.body.personal_loans_clean) {
        await client.query(
          `INSERT INTO autoloan_personal_loans_clean (application_id, bank_name, approved_limit, outstanding_amount)
           VALUES ($1, $2, $3, $4)`,
          [applicationId, pl.bank_name, pl.approved_limit, pl.outstanding_amount]
        );
      }
    }
    // Personal loans secured
    if (Array.isArray(req.body.personal_loans_secured)) {
      for (const pl of req.body.personal_loans_secured) {
        await client.query(
          `INSERT INTO autoloan_personal_loans_secured (application_id, bank_name, approved_limit, outstanding_amount)
           VALUES ($1, $2, $3, $4)`,
          [applicationId, pl.bank_name, pl.approved_limit, pl.outstanding_amount]
        );
      }
    }
    // Other facilities
    if (Array.isArray(req.body.other_facilities)) {
      for (const fac of req.body.other_facilities) {
        await client.query(
          `INSERT INTO autoloan_other_facilities (application_id, bank_name, approved_limit, nature, current_outstanding)
           VALUES ($1, $2, $3, $4, $5)`,
          [applicationId, fac.bank_name, fac.approved_limit, fac.nature, fac.current_outstanding]
        );
      }
    }
    // Applied limits
    if (Array.isArray(req.body.applied_limits)) {
      for (const lim of req.body.applied_limits) {
        await client.query(
          `INSERT INTO autoloan_applied_limits (application_id, bank_name, facility_under_process, nature_of_facility)
           VALUES ($1, $2, $3, $4)`,
          [applicationId, lim.bank_name, lim.facility_under_process, lim.nature_of_facility]
        );
      }
    }
    // References
    if (Array.isArray(req.body.references)) {
      for (const ref of req.body.references) {
        await client.query(
          `INSERT INTO autoloan_references (
            application_id, reference_no, name, cnic, relationship, relationship_other, house_no, street, area,
            city, country, postal_code, tel_residence, tel_office, mobile_no, email)
           VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            applicationId, ref.reference_no, ref.name, ref.cnic, ref.relationship, ref.relationship_other,
            ref.house_no, ref.street, ref.area, ref.city, ref.country, ref.postal_code, ref.tel_residence,
            ref.tel_office, ref.mobile_no, ref.email
          ]
        );
      }
    }
    // Update application status to SPU_PENDING after successful submission
    try {
      await client.query(`SELECT update_status_by_los_id($1, 'SPU_PENDING')`, [applicationId]);
      console.log(`✅ Status updated to SPU_PENDING for AutoLoan application ${applicationId}`);
    } catch (statusError) {
      console.error(`❌ Error updating status for AutoLoan application ${applicationId}:`, statusError.message);
      // Don't fail the entire request if status update fails
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, application, application_id: applicationId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating autoloan application and children:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});





// GET: Fetch an application and all children by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mainResult = await db.query('SELECT * FROM autoloan_applications WHERE id = $1', [id]);
    if (mainResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    const application = mainResult.rows[0];
    const [
      otherBankAccounts,
      creditCardsClean,
      creditCardsSecured,
      personalLoansClean,
      personalLoansSecured,
      otherFacilities,
      appliedLimits,
      references,
      A_documents
    ] = await Promise.all([
      db.query('SELECT * FROM autoloan_other_bank_accounts WHERE application_id = $1', [id]),
      db.query('SELECT * FROM autoloan_credit_cards_clean WHERE application_id = $1', [id]),
      db.query('SELECT * FROM autoloan_credit_cards_secured WHERE application_id = $1', [id]),
      db.query('SELECT * FROM autoloan_personal_loans_clean WHERE application_id = $1', [id]),
      db.query('SELECT * FROM autoloan_personal_loans_secured WHERE application_id = $1', [id]),
      db.query('SELECT * FROM autoloan_other_facilities WHERE application_id = $1', [id]),
      db.query('SELECT * FROM autoloan_applied_limits WHERE application_id = $1', [id]),
      db.query('SELECT * FROM autoloan_references WHERE application_id = $1', [id]),
      db.query('SELECT * FROM autoloan_documents WHERE application_id = $1', [id]),
    ]);
    const response = {
      ...application,
      other_bank_accounts: otherBankAccounts.rows,
      credit_cards_clean: creditCardsClean.rows,
      credit_cards_secured: creditCardsSecured.rows,
      personal_loans_clean: personalLoansClean.rows,
      personal_loans_secured: personalLoansSecured.rows,
      other_facilities: otherFacilities.rows,
      applied_limits: appliedLimits.rows,
      references: references.rows,
      documents: A_documents.rows
    };
    res.json(response);
  } catch (err) {
    console.error('Error fetching autoloan application with children:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});





// GET all autoloan applications for a given customer_id (WITH all children)
router.get('/by-customer/:customer_id', async (req, res) => {
  try {
    const { customer_id } = req.params;
    if (!customer_id) {
      return res.status(400).json({ error: "customer_id is required" });
    }
    // Get all main applications for this customer
    const apps = await db.query(
      'SELECT * FROM autoloan_applications WHERE customer_id = $1 ORDER BY created_at DESC',
      [customer_id]
    );
    const out = [];
    for (const app of apps.rows) {
      const id = app.id;
      const [
        otherBankAccounts,
        creditCardsClean,
        creditCardsSecured,
        personalLoansClean,
        personalLoansSecured,
        otherFacilities,
        appliedLimits,
        references
      ] = await Promise.all([
        db.query('SELECT * FROM autoloan_other_bank_accounts WHERE application_id = $1', [id]),
        db.query('SELECT * FROM autoloan_credit_cards_clean WHERE application_id = $1', [id]),
        db.query('SELECT * FROM autoloan_credit_cards_secured WHERE application_id = $1', [id]),
        db.query('SELECT * FROM autoloan_personal_loans_clean WHERE application_id = $1', [id]),
        db.query('SELECT * FROM autoloan_personal_loans_secured WHERE application_id = $1', [id]),
        db.query('SELECT * FROM autoloan_other_facilities WHERE application_id = $1', [id]),
        db.query('SELECT * FROM autoloan_applied_limits WHERE application_id = $1', [id]),
        db.query('SELECT * FROM autoloan_references WHERE application_id = $1', [id])
      ]);
      out.push({
        ...app,
        other_bank_accounts: otherBankAccounts.rows,
        credit_cards_clean: creditCardsClean.rows,
        credit_cards_secured: creditCardsSecured.rows,
        personal_loans_clean: personalLoansClean.rows,
        personal_loans_secured: personalLoansSecured.rows,
        other_facilities: otherFacilities.rows,
        applied_limits: appliedLimits.rows,
        references: references.rows
      });
    }
    res.json(out);
  } catch (err) {
    console.error('Error fetching autoloan applications by customer_id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});




module.exports = router;

