

const express = require('express');
const router = express.Router();
const db = require('../db1');

// POST: Create new Ameen Drive application with children
router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
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
      "channel_code", "pb_so_employee_no", "program_code", "referral_id", "branch_code", "sm_employee_no", "application_source", "branch_name_code", "dealership_name",
      "nontax_full_name", "nontax_resident_of", "nontax_applied_financing", "nontax_no_ntn"
      // You can add signature/BYTEA fields as well, handling file uploads if required
    ];
    const values = fields.map(f => req.body[f]);
    const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(', ');
    const insertQuery = `
      INSERT INTO ameendrive_applications (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *;
    `;
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
    console.error('Error creating AmeenDrive application:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET: Fetch application and children by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mainResult = await db.query('SELECT * FROM ameendrive_applications WHERE id = $1', [id]);
    if (mainResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    const application = mainResult.rows[0];
    const [bankAccounts, bankFacilities, references] = await Promise.all([
      db.query('SELECT * FROM ameendrive_bank_accounts WHERE application_id = $1', [id]),
      db.query('SELECT * FROM ameendrive_bank_facilities WHERE application_id = $1', [id]),
      db.query('SELECT * FROM ameendrive_references WHERE application_id = $1', [id])
    ]);
    const response = {
      ...application,
      bank_accounts: bankAccounts.rows,
      bank_facilities: bankFacilities.rows,
      references: references.rows
    };
    res.json(response);
  } catch (err) {
    console.error('Error fetching AmeenDrive application:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
