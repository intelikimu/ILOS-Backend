const express = require('express');
const router = express.Router();
const db = require('../db1');

// --- Defensive data cleaning helper ---
function safe(val) {
  if (val === '' || val === undefined) return null;
  if (typeof val === 'string' && val.toLowerCase() === 'null') return null;
  return val;
}

// POST: Create SME Asaan application with all child data
router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Main table fields
    const fields = [
      "customer_id", "application_no", "date_of_request", "lcv", "pmkj_yes",
      "branch_code", "city", "sales_officer_emp_no", "sales_manager_emp_no", "fr_br_emp_no", "channel",
      "applicant_name", "applicant_cnic", "cnic_issuance_date", "cnic_expiry_date", "applicant_dob", "father_husband_name",
      "gender", "mother_maiden_name", "residence_landline_no", "marital_status", "cell_no", "residence_tenure_months",
      "residence_type", "num_dependents", "education_level", "curr_residence_address", "perm_residence_address",
      "company_name", "company_legal_status", "group_name", "experience_years", "business_landline_no",
      "business_cell_no", "sector_se", "sector_me", "sector_manufacturing", "sector_traders_distributors",
      "sector_wholesaler_retailer", "sector_services", "sector_individuals", "national_tax_no", "tax_payer",
      "email", "nearest_landmark", "num_employees", "annual_sales_pkr", "business_address", "political_affiliation",
      "ubl_bank_account_no", "ubl_bank_title", "fax_no", "business_est_date", "business_premises", "registration_no",
      "main_business_account_bank", "main_business_account_no", "main_business_account_open_date",
      "vehicle_manufacturer", "vehicle_model", "vehicle_year", "vehicle_local_assembled", "vehicle_imported",
      "vehicle_new", "vehicle_used", "engine_no", "engine_size_cc", "chassis_no", "purchase_poa", "purchase_pod",
      "vehicle_price", "seller_name", "seller_cnic", "seller_address", "seller_contact_no", "dealer_name",
      "dealer_address", "dealer_email", "dealer_contact_no", "vehicle_name", "desired_loan_amount", "tenure_years",
      "pricing", "down_payment_percent", "down_payment_amount", "insurance_company_name", "tracker_company_name"
    ];
    const values = fields.map(f => safe(req.body[f]));
    const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(', ');

    const insertQuery = `
      INSERT INTO smeasaan_applications (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *;
    `;

    // ----------- DEBUG LOGS -------------
    console.log("Insert fields:", fields);
    console.log("Insert values:", values);

    let application, applicationId;
    try {
      const result = await client.query(insertQuery, values);
      application = result.rows[0];
      applicationId = application.id;
      console.log("Inserted application ID:", applicationId);
    } catch (err) {
      console.error("Query failed!", { insertQuery, values });
      throw err;
    }

    // ------------- CHILD TABLES --------------

    // References
    if (Array.isArray(req.body.references)) {
      for (const ref of req.body.references) {
        await client.query(
          `INSERT INTO smeasaan_references (application_id, reference_no, name, cnic, relationship, address, contact_no)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            applicationId,
            safe(ref.reference_no), safe(ref.name), safe(ref.cnic), safe(ref.relationship),
            safe(ref.address), safe(ref.contact_no)
          ]
        );
      }
    }

    // Existing Loans
    if (Array.isArray(req.body.existing_loans)) {
      for (const loan of req.body.existing_loans) {
        await client.query(
          `INSERT INTO smeasaan_existing_loans (
            application_id, facility_type, amount, tenor, purpose, security_nature_particular,
            security_value, repayment_frequency
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            applicationId,
            safe(loan.facility_type), safe(loan.amount), safe(loan.tenor), safe(loan.purpose),
            safe(loan.security_nature_particular), safe(loan.security_value), safe(loan.repayment_frequency)
          ]
        );
      }
    }

    // Business Descriptions
    if (Array.isArray(req.body.business_descriptions)) {
      for (const desc of req.body.business_descriptions) {
        await client.query(
          `INSERT INTO smeasaan_business_descriptions (application_id, business_type, products_services_offered)
           VALUES ($1, $2, $3)`,
          [applicationId, safe(desc.business_type), safe(desc.products_services_offered)]
        );
      }
    }

    // Market Info
    if (Array.isArray(req.body.market_info)) {
      for (const mi of req.body.market_info) {
        await client.query(
          `INSERT INTO smeasaan_market_info (
            application_id, type, name, terms_of_trade, cash_percent, credit_percent, tenor, relationship_since_years
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            applicationId,
            safe(mi.type), safe(mi.name), safe(mi.terms_of_trade), safe(mi.cash_percent),
            safe(mi.credit_percent), safe(mi.tenor), safe(mi.relationship_since_years)
          ]
        );
      }
    }

    // Financial Indicators (Small)
    if (Array.isArray(req.body.financial_indicators)) {
      for (const ind of req.body.financial_indicators) {
        await client.query(
          `INSERT INTO smeasaan_financial_indicators (
            application_id, assets, liabilities, borrowings, revenue, expenses
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            applicationId,
            safe(ind.assets), safe(ind.liabilities), safe(ind.borrowings), safe(ind.revenue), safe(ind.expenses)
          ]
        );
      }
    }

    // Financial Indicators (Medium)
    if (Array.isArray(req.body.financial_indicators_medium)) {
      for (const ind of req.body.financial_indicators_medium) {
        await client.query(
          `INSERT INTO smeasaan_financial_indicators_medium (
            application_id, cash_in_hand, cash_at_bank, inventory_value, investments, fixed_investments, current_assets,
            total_assets, current_liabilities, borrowings, total_liabilities, total_equity, gross_revenue,
            total_expenses, profit_after_tax
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            applicationId,
            safe(ind.cash_in_hand), safe(ind.cash_at_bank), safe(ind.inventory_value), safe(ind.investments),
            safe(ind.fixed_investments), safe(ind.current_assets), safe(ind.total_assets), safe(ind.current_liabilities),
            safe(ind.borrowings), safe(ind.total_liabilities), safe(ind.total_equity), safe(ind.gross_revenue),
            safe(ind.total_expenses), safe(ind.profit_after_tax)
          ]
        );
      }
    }

    // Update application status to SPU_PENDING after successful submission
    try {
      await client.query(`SELECT update_status_by_los_id($1, 'SUBMITTED_BY_PB')`, [applicationId]);
              console.log(`✅ Status updated to SUBMITTED_BY_PB for SME Asaan application ${applicationId}`);
    } catch (statusError) {
      console.error(`❌ Error updating status for SME Asaan application ${applicationId}:`, statusError.message);
      // Don't fail the entire request if status update fails
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, application, application_id: applicationId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating SME Asaan application:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});




// GET by ID: Application with application data + child tables
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the main application with all fields
    const mainResult = await db.query('SELECT * FROM smeasaan_applications WHERE id = $1', [id]);
    if (mainResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    const application = mainResult.rows[0]; // Get the full row

    // Fetch all child tables in parallel
    const [
      references,
      existing_loans,
      business_descriptions,
      market_info,
      financial_indicators,
      financial_indicators_medium,
      s_documents
    ] = await Promise.all([
      db.query('SELECT * FROM smeasaan_references WHERE application_id = $1', [id]),
      db.query('SELECT * FROM smeasaan_existing_loans WHERE application_id = $1', [id]),
      db.query('SELECT * FROM smeasaan_business_descriptions WHERE application_id = $1', [id]),
      db.query('SELECT * FROM smeasaan_market_info WHERE application_id = $1', [id]),
      db.query('SELECT * FROM smeasaan_financial_indicators WHERE application_id = $1', [id]),
      db.query('SELECT * FROM smeasaan_financial_indicators_medium WHERE application_id = $1', [id]),
      db.query('SELECT * FROM smeasaan_documents WHERE application_id = $1', [id])
    ]);

    // Send combined response
    res.json({
      ...application,
      references: references.rows,
      existing_loans: existing_loans.rows,
      business_descriptions: business_descriptions.rows,
      market_info: market_info.rows,
      financial_indicators: financial_indicators.rows,
      financial_indicators_medium: financial_indicators_medium.rows,
      documents: s_documents.rows
    });
  } catch (err) {
    console.error('Error fetching SME Asaan application:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all SME Asaan applications (with all children)
router.get('/', async (req, res) => {
  try {
    // Fetch all main applications, most recent first
    const appsResult = await db.query('SELECT * FROM smeasaan_applications ORDER BY created_at DESC');
    const applications = appsResult.rows;

    // For each application, fetch children in parallel
    const out = await Promise.all(applications.map(async app => {
      const id = app.id;
      const [
        references,
        existing_loans,
        business_descriptions,
        market_info,
        financial_indicators,
        financial_indicators_medium
      ] = await Promise.all([
        db.query('SELECT * FROM smeasaan_references WHERE application_id = $1', [id]),
        db.query('SELECT * FROM smeasaan_existing_loans WHERE application_id = $1', [id]),
        db.query('SELECT * FROM smeasaan_business_descriptions WHERE application_id = $1', [id]),
        db.query('SELECT * FROM smeasaan_market_info WHERE application_id = $1', [id]),
        db.query('SELECT * FROM smeasaan_financial_indicators WHERE application_id = $1', [id]),
        db.query('SELECT * FROM smeasaan_financial_indicators_medium WHERE application_id = $1', [id])
      ]);
      return {
        ...app,
        references: references.rows,
        existing_loans: existing_loans.rows,
        business_descriptions: business_descriptions.rows,
        market_info: market_info.rows,
        financial_indicators: financial_indicators.rows,
        financial_indicators_medium: financial_indicators_medium.rows
      };
    }));

    res.json({ success: true, data: out });
  } catch (err) {
    console.error('Error fetching smeasaan applications with children:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});





// GET all SME Asaan applications for a given customer_id (with all child tables)
router.get('/by-customer/:customer_id', async (req, res) => {
  try {
    const { customer_id } = req.params;
    if (!customer_id) {
      return res.status(400).json({ error: "customer_id is required" });
    }
    // Get all main applications for this customer
    const apps = await db.query(
      'SELECT * FROM smeasaan_applications WHERE customer_id = $1 ORDER BY created_at DESC',
      [customer_id]
    );
    const out = [];
    for (const app of apps.rows) {
      const id = app.id;
      const [
        references,
        existing_loans,
        business_descriptions,
        market_info,
        financial_indicators,
        financial_indicators_medium
      ] = await Promise.all([
        db.query('SELECT * FROM smeasaan_references WHERE application_id = $1', [id]),
        db.query('SELECT * FROM smeasaan_existing_loans WHERE application_id = $1', [id]),
        db.query('SELECT * FROM smeasaan_business_descriptions WHERE application_id = $1', [id]),
        db.query('SELECT * FROM smeasaan_market_info WHERE application_id = $1', [id]),
        db.query('SELECT * FROM smeasaan_financial_indicators WHERE application_id = $1', [id]),
        db.query('SELECT * FROM smeasaan_financial_indicators_medium WHERE application_id = $1', [id])
      ]);
      out.push({
        ...app,
        references: references.rows,
        existing_loans: existing_loans.rows,
        business_descriptions: business_descriptions.rows,
        market_info: market_info.rows,
        financial_indicators: financial_indicators.rows,
        financial_indicators_medium: financial_indicators_medium.rows
      });
    }
    res.json(out);
  } catch (err) {
    console.error('Error fetching SME Asaan applications by customer_id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
