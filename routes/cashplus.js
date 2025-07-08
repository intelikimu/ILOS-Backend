const express = require('express');
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