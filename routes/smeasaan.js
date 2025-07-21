const express = require('express');
const router = express.Router();
const db = require('../db1');

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
    const values = fields.map(f => req.body[f]);
    const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(', ');

    const insertQuery = `
      INSERT INTO smeasaan_applications (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *;
    `;
    const result = await client.query(insertQuery, values);
    const application = result.rows[0];
    const applicationId = application.id;

    // ------------- CHILD TABLES --------------

    // References
    if (Array.isArray(req.body.references)) {
      for (const ref of req.body.references) {
        await client.query(
          `INSERT INTO smeasaan_references (application_id, reference_no, name, cnic, relationship, address, contact_no)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [applicationId, ref.reference_no, ref.name, ref.cnic, ref.relationship, ref.address, ref.contact_no]
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
            applicationId, loan.facility_type, loan.amount, loan.tenor, loan.purpose,
            loan.security_nature_particular, loan.security_value, loan.repayment_frequency
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
          [applicationId, desc.business_type, desc.products_services_offered]
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
            applicationId, mi.type, mi.name, mi.terms_of_trade, mi.cash_percent,
            mi.credit_percent, mi.tenor, mi.relationship_since_years
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
          [applicationId, ind.assets, ind.liabilities, ind.borrowings, ind.revenue, ind.expenses]
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
            applicationId, ind.cash_in_hand, ind.cash_at_bank, ind.inventory_value, ind.investments, ind.fixed_investments,
            ind.current_assets, ind.total_assets, ind.current_liabilities, ind.borrowings, ind.total_liabilities,
            ind.total_equity, ind.gross_revenue, ind.total_expenses, ind.profit_after_tax
          ]
        );
      }
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

// GET by ID: Application with all children
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mainResult = await db.query('SELECT * FROM smeasaan_applications WHERE id = $1', [id]);
    if (mainResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    const application = mainResult.rows[0];
    // Fetch all children in parallel
    const [
      references, existing_loans, business_descriptions,
      market_info, financial_indicators, financial_indicators_medium
    ] = await Promise.all([
      db.query('SELECT * FROM smeasaan_references WHERE application_id = $1', [id]),
      db.query('SELECT * FROM smeasaan_existing_loans WHERE application_id = $1', [id]),
      db.query('SELECT * FROM smeasaan_business_descriptions WHERE application_id = $1', [id]),
      db.query('SELECT * FROM smeasaan_market_info WHERE application_id = $1', [id]),
      db.query('SELECT * FROM smeasaan_financial_indicators WHERE application_id = $1', [id]),
      db.query('SELECT * FROM smeasaan_financial_indicators_medium WHERE application_id = $1', [id])
    ]);
    res.json({
      ...application,
      references: references.rows,
      existing_loans: existing_loans.rows,
      business_descriptions: business_descriptions.rows,
      market_info: market_info.rows,
      financial_indicators: financial_indicators.rows,
      financial_indicators_medium: financial_indicators_medium.rows
    });
  } catch (err) {
    console.error('Error fetching SME Asaan application:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
