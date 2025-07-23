const express = require('express');
const router = express.Router();
const db = require('../db1');

// CREATE new credit card application (with all child tables)
router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // --- Main table fields ---
    const mainFields = [
      "customer_id", "card_type", "card_category", "special_card_option", "photo_submission_method", "reward_program",
      "title", "full_name", "name_on_card", "nic_or_passport", "cnic_issuance_date", "cnic_expiry_date", "old_nic",
      "father_husband_name", "date_of_birth", "gender", "mother_maiden_name", "marital_status", "num_dependents",
      "education_qualification", "curr_house_apt", "curr_street", "curr_tehsil_district", "curr_landmark", "curr_city",
      "curr_postal_code", "curr_tel_residence", "curr_mobile", "ntn", "type_of_residence", "nature_of_residence",
      "residing_since", "curr_email", "perm_street", "perm_tehsil_district", "perm_landmark", "perm_city",
      "perm_postal_code", "car_year", "car_model", "car_registration_no", "car_ownership", "next_of_kin_name",
      "next_of_kin_relationship", "next_of_kin_tel1", "next_of_kin_tel2", "occupation", "sector", "grade_or_rank",
      "designation", "department", "company_employer_name", "employment_status", "length_of_employment",
      "employee_number", "business_type", "business_nature", "office_address", "office_street", "office_district",
      "office_landmark", "office_city", "office_postal_code", "office_phone1", "office_phone2", "office_fax",
      "prev_employer", "prev_designation", "prev_experience_years", "prev_employer_tel", "gross_monthly_income",
      "other_income_source", "total_income", "spouse_employed", "spouse_income", "spouse_income_source",
      "card_destination", "statement_delivery", "email_for_statement", "is_ubl_customer", "ubl_account_number",
      "ubl_branch", "payment_option", /* applicant_signature, signature_date: handle separately if file uploads */
      "reference_name", "reference_relationship", "reference_nic_or_passport", "reference_address_street",
      "reference_address_tehsil", "reference_address_landmark", "reference_address_city",
      "reference_address_postal_code", "reference_tel_res", "reference_tel_office", "reference_mobile",
      "reference_ntn", "application_id_form", "application_reference_number", "channel_code", "program_code",
      "branch_code", "sales_officer_name", "branch_name", "region_name", "customer_contact_confirmation",
      "branch_manager_remarks", /* branch_manager_signature: handle separately if file uploads */
      "application_status", "reason_code", "analyst_name", /* analyst_signature: file */
      /* card_photo, supplementary_card_photo: files */
      "avail_sms_alert", "avail_credit_guardian", /* card_applicant_signature, card_applicant_signature_date: files/dates */
      "supplementary_cardholder_title", "supplementary_cardholder_first_name", "supplementary_cardholder_middle_name",
      "supplementary_cardholder_last_name", "supplementary_cardholder_name_on_card", "supplementary_cardholder_father_husband_name",
      "supplementary_card_type", "supplementary_card_limit_type", "supplementary_usage_frequency", "supplementary_relationship_to_principal",
      "supplementary_dob", "supplementary_gender", "supplementary_nic_or_passport", "supplementary_mother_maiden_name",
      /* supplementary_declaration_signature, supplementary_basic_cardholder_signature: file */ "supplementary_date",
      "collateral_type", "collateral_bank", "collateral_branch", "collateral_account_no", "collateral_account_type",
      "collateral_lien_amount", "collateral_currency", "collateral_title", "collateral_maturity_date"
    ];

    const mainValues = mainFields.map(f => req.body[f]);
    const mainPlaceholders = mainFields.map((_, i) => `$${i + 1}`).join(', ');

    const insertMain = `
      INSERT INTO creditcard_applications (${mainFields.join(', ')})
      VALUES (${mainPlaceholders})
      RETURNING id;
    `;
    const mainResult = await client.query(insertMain, mainValues);
    const applicationId = mainResult.rows[0].id;

    // --- Other Banks ---
    if (Array.isArray(req.body.other_banks)) {
      for (const ob of req.body.other_banks) {
        await client.query(
          `INSERT INTO creditcard_other_banks (application_id, bank_name, branch, account_no)
          VALUES ($1, $2, $3, $4)`,
          [applicationId, ob.bank_name, ob.branch, ob.account_no]
        );
      }
    }

    // --- Other Credit Cards ---
    if (Array.isArray(req.body.other_credit_cards)) {
      for (const occ of req.body.other_credit_cards) {
        await client.query(
          `INSERT INTO creditcard_other_credit_cards (application_id, bank_name, card_number, credit_limit)
          VALUES ($1, $2, $3, $4)`,
          [applicationId, occ.bank_name, occ.card_number, occ.credit_limit]
        );
      }
    }

    // --- Loans ---
    if (Array.isArray(req.body.loans)) {
      for (const loan of req.body.loans) {
        await client.query(
          `INSERT INTO creditcard_loans (application_id, issuing_bank, loan_type, loan_amount, monthly_installment)
          VALUES ($1, $2, $3, $4, $5)`,
          [applicationId, loan.issuing_bank, loan.loan_type, loan.loan_amount, loan.monthly_installment]
        );
      }
    }

    // --- Supplementary Cards ---
    if (Array.isArray(req.body.supplementary_cards)) {
      for (const sup of req.body.supplementary_cards) {
        await client.query(
          `INSERT INTO creditcard_supplementary_cards (
            application_id, basic_card_member_name, basic_card_cnic_passport, basic_card_old_nic,
            supplementary_card_member_name, supplementary_cnic_passport, supplementary_old_nic
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            applicationId,
            sup.basic_card_member_name, sup.basic_card_cnic_passport, sup.basic_card_old_nic,
            sup.supplementary_card_member_name, sup.supplementary_cnic_passport, sup.supplementary_old_nic
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, application_id: applicationId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating credit card application:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET ALL credit card applications (main table only)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM creditcard_applications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching credit card applications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET ONE application by id (with children)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const main = await db.query('SELECT * FROM creditcard_applications WHERE id = $1', [id]);
    if (main.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const [
      otherBanks,
      otherCreditCards,
      loans,
      supplementaryCards
    ] = await Promise.all([
      db.query('SELECT * FROM creditcard_other_banks WHERE application_id = $1', [id]),
      db.query('SELECT * FROM creditcard_other_credit_cards WHERE application_id = $1', [id]),
      db.query('SELECT * FROM creditcard_loans WHERE application_id = $1', [id]),
      db.query('SELECT * FROM creditcard_supplementary_cards WHERE application_id = $1', [id])
    ]);
    res.json({
      ...main.rows[0],
      other_banks: otherBanks.rows,
      other_credit_cards: otherCreditCards.rows,
      loans: loans.rows,
      supplementary_cards: supplementaryCards.rows
    });
  } catch (err) {
    console.error('Error fetching credit card application:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET ALL by customer_id (with children for each)
router.get('/by-customer/:customer_id', async (req, res) => {
  const { customer_id } = req.params;
  try {
    const apps = await db.query('SELECT * FROM creditcard_applications WHERE customer_id = $1 ORDER BY created_at DESC', [customer_id]);
    const out = [];
    for (const app of apps.rows) {
      const id = app.id;
      const [
        otherBanks,
        otherCreditCards,
        loans,
        supplementaryCards
      ] = await Promise.all([
        db.query('SELECT * FROM creditcard_other_banks WHERE application_id = $1', [id]),
        db.query('SELECT * FROM creditcard_other_credit_cards WHERE application_id = $1', [id]),
        db.query('SELECT * FROM creditcard_loans WHERE application_id = $1', [id]),
        db.query('SELECT * FROM creditcard_supplementary_cards WHERE application_id = $1', [id])
      ]);
      out.push({
        ...app,
        other_banks: otherBanks.rows,
        other_credit_cards: otherCreditCards.rows,
        loans: loans.rows,
        supplementary_cards: supplementaryCards.rows
      });
    }
    res.json(out);
  } catch (err) {
    console.error('Error fetching credit card applications by customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
