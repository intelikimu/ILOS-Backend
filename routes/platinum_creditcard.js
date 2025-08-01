const express = require('express');
const router = express.Router();
const db = require('../db1');

// POST: Create new Platinum Credit Card application with all child data
router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // MAIN TABLE: Platinum Card Application
    const fields = [
      "customer_id", "title", "first_name", "middle_name", "last_name", "name_on_card", "nic", "passport_number",
      "cnic_issuance_date", "cnic_expiry_date", "old_nic_number", "father_husband_name", "date_of_birth", "gender",
      "mother_maiden_name", "marital_status", "dependents", "education", "curr_house", "curr_street", "curr_tehsil",
      "curr_landmark", "curr_city", "curr_postal_code", "residential_phone", "mobile", "ntn", "type_of_accommodation",
      "nature_of_residence", "residing_since", "email", "perm_address", "street", "district", "nearest_landmark", "city",
      "postal_code", "vehicle_make", "vehicle_model", "vehicle_year", "vehicle_registration_no", "ownership", "Leased",
      "next_of_kin_name", "next_of_kin_relationship", "next_of_kin_tel1", "next_of_kin_tel2",
      "occupation", "if_salaried", "grade_rank", "designation", "department", "company_name", "employment_status",
      "length_of_service", "ubl_employee_id", "business_type", "business_nature", "office_address", "office_phones",
      "office_fax", "prev_company_name", "prev_designation", "prev_experience", "prev_company_phone",
      "gross_monthly_income", "other_income", "source_of_other_income", "total_income", "spouse_employed",
      "spouse_income", "spouse_income_source", "card_destination", "statement_delivery", "estatement_email",
      "is_ubl_customer", "ubl_account_number", "ubl_branch", "applicant_signature", "applicant_signature_date",
      "payment_option", "application_reference_number", "channel_code", "program_code", "branch_code", "so_employee_no",
      "pb_bm_employee_no", "sm_employee_no", "sales_officer_name", "branch_name", "region_name",
      "customer_contact_confirmation", "branch_manager_recommendation", "branch_manager_signature", "application_status",
      "reason_code", "analyst_name", "analyst_signature", "avail_sms_alert", "avail_credit_guardian",
      "card_applicant_signature", "card_applicant_signature_date"
    ];
    const values = fields.map(f => req.body[f]);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    const mainInsert = `
      INSERT INTO platinum_card_applications (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING id;
    `;
    const result = await client.query(mainInsert, values);
    const applicationId = result.rows[0].id;

    // CHILD TABLES
    // 1. Other Banks
    if (Array.isArray(req.body.other_banks)) {
      for (const ob of req.body.other_banks) {
        await client.query(
          `INSERT INTO platinum_card_other_banks (application_id, bank_name, branch, account_no) VALUES ($1, $2, $3, $4)`,
          [applicationId, ob.bank_name, ob.branch, ob.account_no]
        );
      }
    }

    // 2. Other Credit Cards
    if (Array.isArray(req.body.other_credit_cards)) {
      for (const occ of req.body.other_credit_cards) {
        await client.query(
          `INSERT INTO platinum_card_other_credit_cards (application_id, bank_name, card_type, card_number, credit_limit) VALUES ($1, $2, $3, $4, $5)`,
          [applicationId, occ.bank_name, occ.card_type, occ.card_number, occ.credit_limit]
        );
      }
    }

    // 3. Loan Facilities
    if (Array.isArray(req.body.loan_facilities)) {
      for (const lf of req.body.loan_facilities) {
        await client.query(
          `INSERT INTO platinum_card_loan_facilities (application_id, loan_details) VALUES ($1, $2)`,
          [applicationId, lf.loan_details]
        );
      }
    }

    // 4. References
    if (Array.isArray(req.body.references)) {
      for (const ref of req.body.references) {
        await client.query(
          `INSERT INTO platinum_card_references (application_id, name, relationship, nic, address, phones, ntn) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [applicationId, ref.name, ref.relationship, ref.nic, ref.address, ref.phones, ref.ntn]
        );
      }
    }

    // 5. Supplementary Cardholders
    if (Array.isArray(req.body.supplementary_cards)) {
      for (const sup of req.body.supplementary_cards) {
        await client.query(
          `INSERT INTO platinum_card_supplementary (
            application_id, title, first_name, middle_name, last_name, name_on_card, father_husband_name,
            credit_limit_percent, availability, relationship_to_principal, dob, gender, nic_passport, old_nic_number,
            mother_maiden_name, supplementary_signature, basic_cardholder_signature, date_signed
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
          [
            applicationId, sup.title, sup.first_name, sup.middle_name, sup.last_name, sup.name_on_card,
            sup.father_husband_name, sup.credit_limit_percent, sup.availability, sup.relationship_to_principal,
            sup.dob, sup.gender, sup.nic_passport, sup.old_nic_number, sup.mother_maiden_name,
            sup.supplementary_signature, sup.basic_cardholder_signature, sup.date_signed
          ]
        );
      }
    }

    // 6. Lien Marked Credit Card Security
    if (Array.isArray(req.body.lien_marked)) {
      for (const lm of req.body.lien_marked) {
        await client.query(
          `INSERT INTO platinum_card_lien_marked (
            application_id, collateral_type, bank, branch, account_no, account_type, lien_amount, currency, account_title, maturity_date
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            applicationId, lm.collateral_type, lm.bank, lm.branch, lm.account_no, lm.account_type, lm.lien_amount,
            lm.currency, lm.account_title, lm.maturity_date
          ]
        );
      }
    }

    // Update application status to SPU_PENDING after successful submission
    try {
      await client.query(`SELECT update_status_by_los_id($1, 'SPU_PENDING')`, [applicationId]);
      console.log(`✅ Status updated to SPU_PENDING for Platinum Credit Card application ${applicationId}`);
    } catch (statusError) {
      console.error(`❌ Error updating status for Platinum Credit Card application ${applicationId}:`, statusError.message);
      // Don't fail the entire request if status update fails
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, application_id: applicationId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating platinum credit card application:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET all main applications (main only)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM platinum_card_applications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching platinum credit card applications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single by id (with children)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const main = await db.query('SELECT * FROM platinum_card_applications WHERE id = $1', [id]);
    if (main.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const [
      other_banks, other_credit_cards, loan_facilities,
      references, supplementary_cards, lien_marked
    ] = await Promise.all([
      db.query('SELECT * FROM platinum_card_other_banks WHERE application_id = $1', [id]),
      db.query('SELECT * FROM platinum_card_other_credit_cards WHERE application_id = $1', [id]),
      db.query('SELECT * FROM platinum_card_loan_facilities WHERE application_id = $1', [id]),
      db.query('SELECT * FROM platinum_card_references WHERE application_id = $1', [id]),
      db.query('SELECT * FROM platinum_card_supplementary WHERE application_id = $1', [id]),
      db.query('SELECT * FROM platinum_card_lien_marked WHERE application_id = $1', [id])
    ]);

    res.json({
      ...main.rows[0],
      other_banks: other_banks.rows,
      other_credit_cards: other_credit_cards.rows,
      loan_facilities: loan_facilities.rows,
      references: references.rows,
      supplementary_cards: supplementary_cards.rows,
      lien_marked: lien_marked.rows
    });
  } catch (err) {
    console.error('Error fetching platinum credit card application by id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET ALL by customer_id (with children for each)
router.get('/by-customer/:customer_id', async (req, res) => {
  const { customer_id } = req.params;
  try {
    const apps = await db.query('SELECT * FROM platinum_card_applications WHERE customer_id = $1 ORDER BY created_at DESC', [customer_id]);
    const out = [];
    for (const app of apps.rows) {
      const id = app.id;
      const [
        other_banks, other_credit_cards, loan_facilities,
        references, supplementary_cards, lien_marked
      ] = await Promise.all([
        db.query('SELECT * FROM platinum_card_other_banks WHERE application_id = $1', [id]),
        db.query('SELECT * FROM platinum_card_other_credit_cards WHERE application_id = $1', [id]),
        db.query('SELECT * FROM platinum_card_loan_facilities WHERE application_id = $1', [id]),
        db.query('SELECT * FROM platinum_card_references WHERE application_id = $1', [id]),
        db.query('SELECT * FROM platinum_card_supplementary WHERE application_id = $1', [id]),
        db.query('SELECT * FROM platinum_card_lien_marked WHERE application_id = $1', [id])
      ]);
      out.push({
        ...app,
        other_banks: other_banks.rows,
        other_credit_cards: other_credit_cards.rows,
        loan_facilities: loan_facilities.rows,
        references: references.rows,
        supplementary_cards: supplementary_cards.rows,
        lien_marked: lien_marked.rows
      });
    }
    res.json(out);
  } catch (err) {
    console.error('Error fetching platinum credit card applications by customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
