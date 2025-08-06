const express = require('express');
const router = express.Router();
const db = require('../db1');





// Get ALL commercial vehicle applications
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM commercial_vehicle_applications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all commercial vehicle applications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});





// Get ONE application by ID (with children)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const main = await db.query('SELECT * FROM commercial_vehicle_applications WHERE id = $1', [id]);
    if (main.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    // Fetch child tables in parallel
    const [
      references,
      existing_loans,
      business_descriptions,
      market_info,
      financial_small,
      financial_medium,
      commercial_documents
    ] = await Promise.all([
      db.query('SELECT * FROM commercial_vehicle_references WHERE application_id = $1', [id]),
      db.query('SELECT * FROM commercial_vehicle_existing_loans WHERE application_id = $1', [id]),
      db.query('SELECT * FROM commercial_vehicle_business_descriptions WHERE application_id = $1', [id]),
      db.query('SELECT * FROM commercial_vehicle_market_info WHERE application_id = $1', [id]),
      db.query('SELECT * FROM commercial_vehicle_financial_indicators WHERE application_id = $1', [id]),
      db.query('SELECT * FROM commercial_vehicle_financial_indicators_medium WHERE application_id = $1', [id]),
      db.query('SELECT * FROM commercial_vehicle_documents WHERE application_id = $1', [id])
    ]);

    res.json({
      ...main.rows[0],
      references: references.rows,
      existing_loans: existing_loans.rows,
      business_descriptions: business_descriptions.rows,
      market_info: market_info.rows,
      financial_indicators_small: financial_small.rows,
      financial_indicators_medium: financial_medium.rows,
      documents: commercial_documents.rows
    });
  } catch (err) {
    console.error('Error fetching commercial vehicle application by id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Get ALL applications by customer_id (with children for each)
router.get('/by-customer/:customer_id', async (req, res) => {
  const { customer_id } = req.params;
  try {
    const apps = await db.query('SELECT * FROM commercial_vehicle_applications WHERE customer_id = $1 ORDER BY created_at DESC', [customer_id]);
    const out = [];
    for (const app of apps.rows) {
      const id = app.id;
      const [
        references,
        existing_loans,
        business_descriptions,
        market_info,
        financial_small,
        financial_medium
      ] = await Promise.all([
        db.query('SELECT * FROM commercial_vehicle_references WHERE application_id = $1', [id]),
        db.query('SELECT * FROM commercial_vehicle_existing_loans WHERE application_id = $1', [id]),
        db.query('SELECT * FROM commercial_vehicle_business_descriptions WHERE application_id = $1', [id]),
        db.query('SELECT * FROM commercial_vehicle_market_info WHERE application_id = $1', [id]),
        db.query('SELECT * FROM commercial_vehicle_financial_indicators WHERE application_id = $1', [id]),
        db.query('SELECT * FROM commercial_vehicle_financial_indicators_medium WHERE application_id = $1', [id])
      ]);
      out.push({
        ...app,
        references: references.rows,
        existing_loans: existing_loans.rows,
        business_descriptions: business_descriptions.rows,
        market_info: market_info.rows,
        financial_indicators_small: financial_small.rows,
        financial_indicators_medium: financial_medium.rows
      });
    }
    res.json(out);
  } catch (err) {
    console.error('Error fetching commercial vehicle applications by customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// POST a new commercial vehicle application with all child data
router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert Main Application
    const mainFields = [
      "customer_id", "application_no", "date_of_request", "branch_code", "city", "sales_officer_emp_no", "sales_manager_emp_no", "pb_bm_employee_no", "channel", "applicant_name", "applicant_cnic", "cnic_issuance_date", "cnic_expiry_date", "date_of_birth", "father_husband_name", "mother_maiden_name", "gender", "marital_status", "residence_landline_no", "cell_no", "residence_tenure_months", "residence_type", "num_dependents", "education_level", "current_address", "permanent_address", "company_name", "group_name", "company_legal_status", "type_of_business", "experience_years", "nature_of_business", "business_landline_no", "business_cell_no", "national_tax_no", "tax_payer", "email", "nearest_landmark", "num_employees", "annual_sales_pkr", "business_address", "political_affiliation", "ubl_bank_account_no", "ubl_bank_title", "fax_no", "company_est_date", "business_premises", "main_business_account_bank", "main_business_account_no", "main_business_account_open_date", "registration_no", "vehicle_manufacturer", "vehicle_model", "vehicle_year", "vehicle_local_assembled", "vehicle_new_used", "engine_no", "engine_size_cc", "chassis_no", "purchase_type", "vehicle_price", "seller_name", "seller_cnic", "seller_address", "seller_contact_no", "dealer_name", "dealer_email", "dealer_address", "dealer_contact_no", "vehicle_name", "desired_loan_amount", "tenure_years", "pricing", "down_payment_percent", "down_payment_amount", "insurance_company_name", "tracker_company_name"
    ];
    const mainValues = mainFields.map(f => req.body[f]);
    const mainPlaceholders = mainFields.map((_, i) => `$${i + 1}`).join(', ');
    const mainInsert = `
      INSERT INTO commercial_vehicle_applications (${mainFields.join(', ')})
      VALUES (${mainPlaceholders})
      RETURNING id;
    `;
    const mainResult = await client.query(mainInsert, mainValues);
    const applicationId = mainResult.rows[0].id;

    // 2. Insert References (child table)
    if (Array.isArray(req.body.references)) {
      for (const ref of req.body.references) {
        await client.query(
          `INSERT INTO commercial_vehicle_references (application_id, reference_no, name, cnic, relationship, address, contact_no)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [applicationId, ref.reference_no, ref.name, ref.cnic, ref.relationship, ref.address, ref.contact_no]
        );
      }
    }

    // 3. Existing Loans (child table)
    if (Array.isArray(req.body.existing_loans)) {
      for (const loan of req.body.existing_loans) {
        await client.query(
          `INSERT INTO commercial_vehicle_existing_loans (application_id, facility_type, amount, tenor, purpose, security_collateral_nature, security_collateral_value, repayment_frequency)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [applicationId, loan.facility_type, loan.amount, loan.tenor, loan.purpose, loan.security_collateral_nature, loan.security_collateral_value, loan.repayment_frequency]
        );
      }
    }

    // 4. Business Descriptions (child table)
    if (Array.isArray(req.body.business_descriptions)) {
      for (const desc of req.body.business_descriptions) {
        await client.query(
          `INSERT INTO commercial_vehicle_business_descriptions (application_id, business_type, products_services_offered)
          VALUES ($1, $2, $3)`,
          [applicationId, desc.business_type, desc.products_services_offered]
        );
      }
    }

    // 5. Market Info (child table)
    if (Array.isArray(req.body.market_info)) {
      for (const mi of req.body.market_info) {
        await client.query(
          `INSERT INTO commercial_vehicle_market_info (application_id, type, name, terms_of_trade, cash_percent, credit_percent, tenor, relationship_since_years)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [applicationId, mi.type, mi.name, mi.terms_of_trade, mi.cash_percent, mi.credit_percent, mi.tenor, mi.relationship_since_years]
        );
      }
    }

    // 6. Financial Indicators (small)
    if (req.body.financial_indicators_small) {
      const fi = req.body.financial_indicators_small;
      await client.query(
        `INSERT INTO commercial_vehicle_financial_indicators (application_id, assets, liabilities, borrowings, revenue, expenses)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [applicationId, fi.assets, fi.liabilities, fi.borrowings, fi.revenue, fi.expenses]
      );
    }

    // 7. Financial Indicators (medium)
    if (req.body.financial_indicators_medium) {
      const fim = req.body.financial_indicators_medium;
      await client.query(
        `INSERT INTO commercial_vehicle_financial_indicators_medium (
          application_id, cash_in_hand, cash_at_bank, inventory_value, investments, fixed_investments, current_assets, total_assets, current_liabilities, borrowings, total_liabilities, total_equity, gross_revenue, total_expenses, profit_after_tax
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
        )`,
        [
          applicationId, fim.cash_in_hand, fim.cash_at_bank, fim.inventory_value, fim.investments, fim.fixed_investments, fim.current_assets, fim.total_assets, fim.current_liabilities, fim.borrowings, fim.total_liabilities, fim.total_equity, fim.gross_revenue, fim.total_expenses, fim.profit_after_tax
        ]
      );
    }

                 // Note: ilos_applications record is automatically created by database trigger
    
    // Update application status to PB_SUBMITTED after successful submission
    try {
      await client.query(`SELECT update_status_by_los_id($1, 'PB_SUBMITTED')`, [applicationId]);
      console.log(`✅ Status updated to PB_SUBMITTED for Commercial Vehicle application ${applicationId}`);
    } catch (statusError) {
      console.error(`❌ Error updating status for Commercial Vehicle application ${applicationId}:`, statusError.message);
      // Don't fail the entire request if status update fails
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, application_id: applicationId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating commercial vehicle application:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});


// GET ALL applications by customer_id (including child tables for each)
router.get('/by-customer/:customer_id', async (req, res) => {
  const { customer_id } = req.params;
  try {
    const apps = await db.query('SELECT * FROM commercial_vehicle_applications WHERE customer_id = $1 ORDER BY created_at DESC', [customer_id]);
    const out = [];
    for (const app of apps.rows) {
      const id = app.id;
      const [
        references,
        existing_loans,
        business_descriptions,
        market_info,
        financial_small,
        financial_medium
      ] = await Promise.all([
        db.query('SELECT * FROM commercial_vehicle_references WHERE application_id = $1', [id]),
        db.query('SELECT * FROM commercial_vehicle_existing_loans WHERE application_id = $1', [id]),
        db.query('SELECT * FROM commercial_vehicle_business_descriptions WHERE application_id = $1', [id]),
        db.query('SELECT * FROM commercial_vehicle_market_info WHERE application_id = $1', [id]),
        db.query('SELECT * FROM commercial_vehicle_financial_indicators WHERE application_id = $1', [id]),
        db.query('SELECT * FROM commercial_vehicle_financial_indicators_medium WHERE application_id = $1', [id])
      ]);
      out.push({
        ...app,
        references: references.rows,
        existing_loans: existing_loans.rows,
        business_descriptions: business_descriptions.rows,
        market_info: market_info.rows,
        financial_indicators_small: financial_small.rows,
        financial_indicators_medium: financial_medium.rows
      });
    }
    res.json(out);
  } catch (err) {
    console.error('Error fetching commercial vehicle applications by customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;
