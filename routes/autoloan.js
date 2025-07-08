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