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
  completeCashPlusSchema, 
  applicationSchema 
} = require('../schemas/validationSchemas');

// Create new cash plus application
router.post('/create', async (req, res) => {
  try {
    const parsed = completeCashPlusSchema.safeParse(req.body);
    
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
      productType: 'cashplus',
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

    // Insert cash plus specific details
    await db.query(
      `INSERT INTO cashplus_applications (
        application_id, loan_amount, loan_tenure_months, loan_purpose,
        monthly_installment, processing_fee
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        applicationId, data.cashPlusDetails.loanAmount, data.cashPlusDetails.loanTenureMonths,
        data.cashPlusDetails.loanPurpose, data.cashPlusDetails.monthlyInstallment,
        data.cashPlusDetails.processingFee
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Cash Plus application created successfully',
      applicationId: applicationId,
      application: application
    });

  } catch (error) {
    console.error('Error creating cash plus application:', error);
    res.status(500).json({ 
      error: 'Failed to create cash plus application', 
      details: error.message 
    });
  }
});

// Get cash plus application by ID
router.get('/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Get main application details
    const application = await getApplicationDetails(applicationId);

    // Get all related details
    const [personalDetails, addressDetails, employmentDetails, references, 
           bankingDetails, cashPlusDetails] = await Promise.all([
      db.query('SELECT * FROM personal_details WHERE application_id = $1', [applicationId]),
      db.query('SELECT * FROM address_details WHERE application_id = $1', [applicationId]),
      db.query('SELECT * FROM employment_details WHERE application_id = $1', [applicationId]),
      db.query('SELECT * FROM reference_contacts WHERE application_id = $1', [applicationId]),
      db.query('SELECT * FROM banking_details WHERE application_id = $1', [applicationId]),
      db.query('SELECT * FROM cashplus_applications WHERE application_id = $1', [applicationId])
    ]);

    const completeApplication = {
      application: application,
      personalDetails: personalDetails.rows[0] || null,
      addresses: addressDetails.rows,
      employmentDetails: employmentDetails.rows[0] || null,
      references: references.rows,
      bankingDetails: bankingDetails.rows[0] || null,
      cashPlusDetails: cashPlusDetails.rows[0] || null
    };

    res.json(completeApplication);

  } catch (error) {
    console.error('Error fetching cash plus application:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cash plus application', 
      details: error.message 
    });
  }
});

// Get all cash plus applications
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customerStatus } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, pd.first_name, pd.last_name, cp.loan_amount, cp.loan_purpose
      FROM applications a
      LEFT JOIN personal_details pd ON a.application_id = pd.application_id
      LEFT JOIN cashplus_applications cp ON a.application_id = cp.application_id
      WHERE a.product_type = 'cashplus'
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
    let countQuery = 'SELECT COUNT(*) FROM applications WHERE product_type = \'cashplus\'';
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
    console.error('Error fetching cash plus applications:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cash plus applications', 
      details: error.message 
    });
  }
});

// Update cash plus application status
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

const express = require('express');
const router = express.Router();
const db = require('../db1')

// GET all cashplus applications
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cashplus_applications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cashplus applications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single application by ID
// GET single application with children by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get main application
    const appResult = await db.query('SELECT * FROM cashplus_applications WHERE id = $1', [id]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    const application = appResult.rows[0];

    // Get all child tables in parallel
    const [
      creditCardsClean,
      creditCardsSecured,
      personalLoansExisting,
      otherFacilities,
      personalLoansUnderProcess,
      references
    ] = await Promise.all([
      db.query('SELECT * FROM cashplus_credit_cards_clean WHERE application_id = $1', [id]),
      db.query('SELECT * FROM cashplus_credit_cards_secured WHERE application_id = $1', [id]),
      db.query('SELECT * FROM cashplus_personal_loans_existing WHERE application_id = $1', [id]),
      db.query('SELECT * FROM cashplus_other_facilities WHERE application_id = $1', [id]),
      db.query('SELECT * FROM cashplus_personal_loans_under_process WHERE application_id = $1', [id]),
      db.query('SELECT * FROM cashplus_references WHERE application_id = $1', [id])
    ]);

    // Build response
    const response = {
      ...application,
      credit_cards_clean: creditCardsClean.rows,
      credit_cards_secured: creditCardsSecured.rows,
      personal_loans_existing: personalLoansExisting.rows,
      other_facilities: otherFacilities.rows,
      personal_loans_under_process: personalLoansUnderProcess.rows,
      references: references.rows
    };

    res.json(response);

  } catch (err) {
    console.error('Error fetching application with children:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//_____________________________________________________________________________________
// POST a new cashplus application

// POST a new cashplus application (main + child tables)
router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert main application
    const fields = [
      "customer_id", "loan_type", "amount_requested", "min_amount_acceptable", "max_affordable_installment", "tenure",
      "is_ubl_existing_customer", "branch", "account", "purpose_of_loan", "purpose_of_loan_other",
      "title", "first_name", "middle_name", "last_name", "cnic", "ntn", "date_of_birth", "gender", "marital_status", "dependants",
      "education_qualification", "education_qualification_other", "father_or_husband_name", "mother_maiden_name", "employment_status", "address", "nearest_landmark", "city", "postal_code", "residing_since", "accommodation_type", "accommodation_type_other", "monthly_rent", "preferred_mailing_address",
      "permanent_house_no", "permanent_street", "permanent_city", "permanent_postal_code",
      "tel_current", "tel_permanent", "mobile", "mobile_type", "other_contact",
      "company_name", "company_type", "company_type_other", "department", "designation", "grade_level", "exp_current_years", "prev_employer_name", "exp_prev_years",
      "office_house_no", "office_street", "office_area", "office_landmark", "office_city", "office_postal_code", "office_fax", "office_tel1", "office_tel2", "office_ext",
      "gross_monthly_salary", "other_monthly_income", "net_monthly_income", "other_income_sources",
      "is_ubl_customer", "ubl_account_number",
      "applicant_signature", "applicant_signature_date",
      "application_source", "channel_code", "so_employee_no", "program_code", "pb_bm_employee_no", "branch_code", "sm_employee_no", "bm_signature_stamp"
    ];
    const values = fields.map(field => req.body[field]);
    const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(', ');
    const insertQuery = `
      INSERT INTO cashplus_applications (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *;
    `;
    const result = await client.query(insertQuery, values);
    const application = result.rows[0];
    const applicationId = application.id;

    // 2. Insert into child tables

    // Clean credit cards
    if (Array.isArray(req.body.credit_cards_clean)) {
      for (const cc of req.body.credit_cards_clean) {
        await client.query(
          `INSERT INTO cashplus_credit_cards_clean (application_id, bank_name, approved_limit) VALUES ($1, $2, $3)`,
          [applicationId, cc.bank_name, cc.approved_limit]
        );
      }
    }

    // Secured credit cards
    if (Array.isArray(req.body.credit_cards_secured)) {
      for (const cc of req.body.credit_cards_secured) {
        await client.query(
          `INSERT INTO cashplus_credit_cards_secured (application_id, bank_name, approved_limit) VALUES ($1, $2, $3)`,
          [applicationId, cc.bank_name, cc.approved_limit]
        );
      }
    }

    // Existing personal loans
    if (Array.isArray(req.body.personal_loans_existing)) {
      for (const pl of req.body.personal_loans_existing) {
        await client.query(
          `INSERT INTO cashplus_personal_loans_existing (application_id, bank_name, approved_limit, outstanding_amount, as_of)
          VALUES ($1, $2, $3, $4, $5)`,
          [applicationId, pl.bank_name, pl.approved_limit, pl.outstanding_amount, pl.as_of]
        );
      }
    }

    // Other facilities
    if (Array.isArray(req.body.other_facilities)) {
      for (const fac of req.body.other_facilities) {
        await client.query(
          `INSERT INTO cashplus_other_facilities (application_id, bank_name, approved_limit, nature, current_outstanding)
          VALUES ($1, $2, $3, $4, $5)`,
          [applicationId, fac.bank_name, fac.approved_limit, fac.nature, fac.current_outstanding]
        );
      }
    }

    // Personal loans under process
    if (Array.isArray(req.body.personal_loans_under_process)) {
      for (const pl of req.body.personal_loans_under_process) {
        await client.query(
          `INSERT INTO cashplus_personal_loans_under_process (application_id, bank_name, facility_under_process, nature_of_facility)
          VALUES ($1, $2, $3, $4)`,
          [applicationId, pl.bank_name, pl.facility_under_process, pl.nature_of_facility]
        );
      }
    }

    // References
    if (Array.isArray(req.body.references)) {
      for (const ref of req.body.references) {
        await client.query(
          `INSERT INTO cashplus_references
            (application_id, reference_no, name, cnic, relationship, house_no, street, area, city, postal_code,
              tel_residence, tel_office, mobile, fax, email)
           VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            applicationId, ref.reference_no, ref.name, ref.cnic, ref.relationship, ref.house_no,
            ref.street, ref.area, ref.city, ref.postal_code, ref.tel_residence, ref.tel_office,
            ref.mobile, ref.fax, ref.email
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, application, application_id: applicationId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating cashplus application and children:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

//___________________________________________________________________________________________________________________



module.exports = router;



