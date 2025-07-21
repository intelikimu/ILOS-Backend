/*const express = require('express');
const router = express.Router();
const db = require('../db');
const { 
  createApplication, 
  getApplicationDetails, 
  getCustomerStatus, 
  fetchCifDetails 
} = require('../customerService');
const { 
  completeAutoLoanSchema, 
  applicationSchema 
} = require('../schemas/validationSchemas');

// Create new auto loan application
router.post('/create', async (req, res) => {
  try {
    const parsed = completeAutoLoanSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: parsed.error.errors 
      });
    }

    const data = parsed.data;
    
    // Create main application
    const application = await createApplication({
      consumerId: data.application.consumerId,
      cnic: data.application.cnic,
      customerStatus: data.application.customerStatus,
      productType: 'autoloan',
      productSubType: data.application.productSubType,
      pbUserId: data.application.pbUserId,
      desiredAmount: data.application.desiredAmount,
      tenureMonths: data.application.tenureMonths,
      purpose: data.application.purpose,
      branchCode: data.application.branchCode
    });

    const applicationId = application.application_id;

    // Insert personal details
    await db.query(
      `INSERT INTO personal_details (
        application_id, title, first_name, middle_name, last_name, cnic, ntn,
        date_of_birth, gender, marital_status, no_of_children, no_of_dependents,
        father_husband_name, mother_maiden_name, nationality, passport_no, education,
        employment_status, next_of_kin_name, next_of_kin_relation, next_of_kin_cnic,
        next_of_kin_contact
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
      [
        applicationId, data.personalDetails.title, data.personalDetails.firstName,
        data.personalDetails.middleName, data.personalDetails.lastName, data.personalDetails.cnic,
        data.personalDetails.ntn, data.personalDetails.dateOfBirth, data.personalDetails.gender,
        data.personalDetails.maritalStatus, data.personalDetails.noOfChildren,
        data.personalDetails.noOfDependents, data.personalDetails.fatherHusbandName,
        data.personalDetails.motherMaidenName, data.personalDetails.nationality,
        data.personalDetails.passportNo, data.personalDetails.education,
        data.personalDetails.employmentStatus, data.personalDetails.nextOfKinName,
        data.personalDetails.nextOfKinRelation, data.personalDetails.nextOfKinCnic,
        data.personalDetails.nextOfKinContact
      ]
    );

    // Insert current address
    await db.query(
      `INSERT INTO address_details (
        application_id, address_type, house_flat_no, street, area, landmark,
        city, district, province, country, postal_code, phone_residence,
        phone_office, mobile, email, years_at_address, residential_status,
        monthly_rent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        applicationId, 'current', data.currentAddress.houseFlatNo, data.currentAddress.street,
        data.currentAddress.area, data.currentAddress.landmark, data.currentAddress.city,
        data.currentAddress.district, data.currentAddress.province, data.currentAddress.country,
        data.currentAddress.postalCode, data.currentAddress.phoneResidence,
        data.currentAddress.phoneOffice, data.currentAddress.mobile, data.currentAddress.email,
        data.currentAddress.yearsAtAddress, data.currentAddress.residentialStatus,
        data.currentAddress.monthlyRent
      ]
    );

    // Insert permanent address if provided
    if (data.permanentAddress) {
      await db.query(
        `INSERT INTO address_details (
          application_id, address_type, house_flat_no, street, area, landmark,
          city, district, province, country, postal_code, phone_residence,
          phone_office, mobile, email, years_at_address, residential_status,
          monthly_rent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          applicationId, 'permanent', data.permanentAddress.houseFlatNo, data.permanentAddress.street,
          data.permanentAddress.area, data.permanentAddress.landmark, data.permanentAddress.city,
          data.permanentAddress.district, data.permanentAddress.province, data.permanentAddress.country,
          data.permanentAddress.postalCode, data.permanentAddress.phoneResidence,
          data.permanentAddress.phoneOffice, data.permanentAddress.mobile, data.permanentAddress.email,
          data.permanentAddress.yearsAtAddress, data.permanentAddress.residentialStatus,
          data.permanentAddress.monthlyRent
        ]
      );
    }

    // Insert employment details
    await db.query(
      `INSERT INTO employment_details (
        application_id, employment_type, company_name, designation, department,
        employee_id, date_of_joining, years_of_experience, nature_of_business,
        office_address, office_city, office_phone, supervisor_name, supervisor_contact,
        basic_salary, gross_salary, net_salary, other_income, total_income,
        salary_account_bank, salary_account_no
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
      [
        applicationId, data.employmentDetails.employmentType, data.employmentDetails.companyName,
        data.employmentDetails.designation, data.employmentDetails.department,
        data.employmentDetails.employeeId, data.employmentDetails.dateOfJoining,
        data.employmentDetails.yearsOfExperience, data.employmentDetails.natureOfBusiness,
        data.employmentDetails.officeAddress, data.employmentDetails.officeCity,
        data.employmentDetails.officePhone, data.employmentDetails.supervisorName,
        data.employmentDetails.supervisorContact, data.employmentDetails.basicSalary,
        data.employmentDetails.grossSalary, data.employmentDetails.netSalary,
        data.employmentDetails.otherIncome, data.employmentDetails.totalIncome,
        data.employmentDetails.salaryAccountBank, data.employmentDetails.salaryAccountNo
      ]
    );

    // Insert references
    for (const reference of data.references) {
      await db.query(
        `INSERT INTO reference_contacts (
          application_id, reference_type, name, relation, cnic, phone,
          address, city, occupation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          applicationId, reference.referenceType, reference.name, reference.relation,
          reference.cnic, reference.phone, reference.address, reference.city,
          reference.occupation
        ]
      );
    }

    // Insert banking details
    await db.query(
      `INSERT INTO banking_details (
        application_id, account_type, bank_name, branch_name, account_no,
        account_title, average_balance, account_opening_date, relationship_years
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        applicationId, data.bankingDetails.accountType, data.bankingDetails.bankName,
        data.bankingDetails.branchName, data.bankingDetails.accountNo,
        data.bankingDetails.accountTitle, data.bankingDetails.averageBalance,
        data.bankingDetails.accountOpeningDate, data.bankingDetails.relationshipYears
      ]
    );

    // Insert vehicle details
    await db.query(
      `INSERT INTO vehicle_details (
        application_id, vehicle_type, make, model, year_of_manufacture,
        engine_capacity, registration_no, chassis_no, engine_no, color,
        vehicle_price, down_payment, financing_amount, dealer_name,
        dealer_contact, dealer_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        applicationId, data.vehicleDetails.vehicleType, data.vehicleDetails.make,
        data.vehicleDetails.model, data.vehicleDetails.yearOfManufacture,
        data.vehicleDetails.engineCapacity, data.vehicleDetails.registrationNo,
        data.vehicleDetails.chassisNo, data.vehicleDetails.engineNo,
        data.vehicleDetails.color, data.vehicleDetails.vehiclePrice,
        data.vehicleDetails.downPayment, data.vehicleDetails.financingAmount,
        data.vehicleDetails.dealerName, data.vehicleDetails.dealerContact,
        data.vehicleDetails.dealerAddress
      ]
    );

    // Insert insurance details
    await db.query(
      `INSERT INTO insurance_details (
        application_id, insurance_type, insurance_company, policy_number,
        premium_amount, coverage_amount, policy_start_date, policy_end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        applicationId, data.insuranceDetails.insuranceType, data.insuranceDetails.insuranceCompany,
        data.insuranceDetails.policyNumber, data.insuranceDetails.premiumAmount,
        data.insuranceDetails.coverageAmount, data.insuranceDetails.policyStartDate,
        data.insuranceDetails.policyEndDate
      ]
    );

    // Insert auto loan specific details
    await db.query(
      `INSERT INTO autoloan_applications (
        application_id, financing_option, loan_amount, loan_tenure_months,
        monthly_installment, processing_fee, insurance_required
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        applicationId, data.autoLoanDetails.financingOption, data.autoLoanDetails.loanAmount,
        data.autoLoanDetails.loanTenureMonths, data.autoLoanDetails.monthlyInstallment,
        data.autoLoanDetails.processingFee, data.autoLoanDetails.insuranceRequired
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Auto loan application created successfully',
      applicationId: applicationId,
      application: application
    });

  } catch (error) {
    console.error('Error creating auto loan application:', error);
    res.status(500).json({ 
      error: 'Failed to create auto loan application', 
      details: error.message 
    });
  }
});

// Get auto loan application by ID
router.get('/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Get main application details
    const application = await getApplicationDetails(applicationId);

    // Get all related details
    const [personalDetails, addressDetails, employmentDetails, references, 
           bankingDetails, vehicleDetails, insuranceDetails, autoLoanDetails] = await Promise.all([
      db.query('SELECT * FROM personal_details WHERE application_id = $1', [applicationId]),
      db.query('SELECT * FROM address_details WHERE application_id = $1', [applicationId]),
      db.query('SELECT * FROM employment_details WHERE application_id = $1', [applicationId]),
      db.query('SELECT * FROM reference_contacts WHERE application_id = $1', [applicationId]),
      db.query('SELECT * FROM banking_details WHERE application_id = $1', [applicationId]),
      db.query('SELECT * FROM vehicle_details WHERE application_id = $1', [applicationId]),
      db.query('SELECT * FROM insurance_details WHERE application_id = $1', [applicationId]),
      db.query('SELECT * FROM autoloan_applications WHERE application_id = $1', [applicationId])
    ]);

    const completeApplication = {
      application: application,
      personalDetails: personalDetails.rows[0] || null,
      addresses: addressDetails.rows,
      employmentDetails: employmentDetails.rows[0] || null,
      references: references.rows,
      bankingDetails: bankingDetails.rows[0] || null,
      vehicleDetails: vehicleDetails.rows[0] || null,
      insuranceDetails: insuranceDetails.rows[0] || null,
      autoLoanDetails: autoLoanDetails.rows[0] || null
    };

    res.json(completeApplication);

  } catch (error) {
    console.error('Error fetching auto loan application:', error);
    res.status(500).json({ 
      error: 'Failed to fetch auto loan application', 
      details: error.message 
    });
  }
});

// Get all auto loan applications
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customerStatus } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, pd.first_name, pd.last_name, al.loan_amount, al.financing_option
      FROM applications a
      LEFT JOIN personal_details pd ON a.application_id = pd.application_id
      LEFT JOIN autoloan_applications al ON a.application_id = al.application_id
      WHERE a.product_type = 'autoloan'
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (customerStatus) {
      query += ` AND a.customer_status = $${paramIndex}`;
      params.push(customerStatus);
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM applications WHERE product_type = \'autoloan\'';
    const countParams = [];
    let countParamIndex = 1;

    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (customerStatus) {
      countQuery += ` AND customer_status = $${countParamIndex}`;
      countParams.push(customerStatus);
    }

    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      applications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching auto loan applications:', error);
    res.status(500).json({ 
      error: 'Failed to fetch auto loan applications', 
      details: error.message 
    });
  }
});

// Update auto loan application status
router.patch('/:applicationId/status', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected', 'processing'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.query(
      'UPDATE applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE application_id = $2 RETURNING *',
      [status, applicationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      application: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ 
      error: 'Failed to update application status', 
      details: error.message 
    });
  }
});

module.exports = router; 



*/


//______________________________________________________________________________________________


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
    const response = {
      ...application,
      other_bank_accounts: otherBankAccounts.rows,
      credit_cards_clean: creditCardsClean.rows,
      credit_cards_secured: creditCardsSecured.rows,
      personal_loans_clean: personalLoansClean.rows,
      personal_loans_secured: personalLoansSecured.rows,
      other_facilities: otherFacilities.rows,
      applied_limits: appliedLimits.rows,
      references: references.rows
    };
    res.json(response);
  } catch (err) {
    console.error('Error fetching autoloan application with children:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

