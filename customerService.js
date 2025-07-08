const axios = require('axios');
const db = require('./db');

// Generate a unique consumer ID for NTB customers
function generateNTBConsumerId(cnic) {
  const timestamp = Date.now().toString().slice(-6);
  return `NTB-${cnic.slice(-4)}-${timestamp}`;
}

// Generate a unique application ID
function generateApplicationId(productType, consumerId) {
  const timestamp = Date.now().toString().slice(-6);
  const productPrefix = productType.toUpperCase().slice(0, 3);
  return `${productPrefix}-${consumerId.slice(-6)}-${timestamp}`;
}

// Check customer status and get/create consumer ID
async function getCustomerStatus(cnic) {
  try {
    // Check if customer exists in CIF table
    const result = await db.query(
      'SELECT consumer_id, status, cnic FROM cif_customers WHERE cnic = $1',
      [cnic]
    );

    if (result.rows.length > 0) {
      const customer = result.rows[0];
      return {
        cnic: customer.cnic,
        status: customer.status,
        consumerId: customer.consumer_id,
        isExisting: true
      };
    } else {
      // Create new NTB customer
      const newConsumerId = generateNTBConsumerId(cnic);
      
      // Insert basic NTB customer record
      await db.query(
        `INSERT INTO cif_customers (consumer_id, cnic, status, nationality, country) 
         VALUES ($1, $2, 'NTB', 'PK', 'PK')`,
        [newConsumerId, cnic]
      );

      return {
        cnic,
        status: 'NTB',
        consumerId: newConsumerId,
        isExisting: false
      };
    }
  } catch (error) {
    console.error('Error in getCustomerStatus:', error);
    throw error;
  }
}

// Fetch complete CIF details for ETB customers
async function fetchCifDetails(consumerId) {
  try {
    const result = await db.query(
      'SELECT * FROM cif_customers WHERE consumer_id = $1',
      [consumerId]
    );

    if (result.rows.length === 0) {
      throw new Error('Customer not found');
    }

    const customer = result.rows[0];
    
    // Transform database fields to match expected format
    return {
      consumerId: customer.consumer_id,
      cnic: customer.cnic,
      status: customer.status,
      category: customer.category,
      controlBranch: customer.control_branch,
      creationDate: customer.creation_date,
      creditRating: customer.credit_rating,
      customerGroup: customer.customer_group,
      customerType: customer.customer_type,
      domicileCountry: customer.domicile_country,
      domicileState: customer.domicile_state,
      fullName: customer.full_name,
      firstName: customer.first_name,
      middleName: customer.middle_name,
      lastName: customer.last_name,
      title: customer.title,
      gender: customer.gender,
      dateOfBirth: customer.date_of_birth,
      fatherHusbandName: customer.father_husband_name,
      motherMaidenName: customer.mother_maiden_name,
      nationality: customer.nationality,
      maritalStatus: customer.marital_status,
      education: customer.education,
      ntn: customer.ntn,
      passportNo: customer.passport_no,
      industry: customer.industry,
      occupationCode: customer.occupation_code,
      phoneNo: customer.phone_no,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      postalCode: customer.postal_code,
      country: customer.country,
      accountNo: customer.account_no,
      bankName: customer.bank_name,
      branch: customer.branch,
      estimatedNetWorth: customer.estimated_net_worth,
      annualIncome: customer.annual_income,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    };
  } catch (error) {
    console.error('Error fetching CIF details:', error);
    throw error;
  }
}

// Update CIF details for NTB customers when they submit forms
async function updateCifDetails(consumerId, customerData) {
  try {
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(customerData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(consumerId);

    const query = `
      UPDATE cif_customers 
      SET ${updateFields.join(', ')} 
      WHERE consumer_id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, updateValues);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating CIF details:', error);
    throw error;
  }
}

// Create new application
async function createApplication(applicationData) {
  try {
    const {
      consumerId,
      cnic,
      customerStatus,
      productType,
      productSubType,
      pbUserId,
      desiredAmount,
      tenureMonths,
      purpose,
      branchCode
    } = applicationData;

    const applicationId = generateApplicationId(productType, consumerId);

    const result = await db.query(
      `INSERT INTO applications (
        application_id, consumer_id, cnic, customer_status, product_type, 
        product_sub_type, pb_user_id, desired_amount, tenure_months, 
        purpose, branch_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        applicationId, consumerId, cnic, customerStatus, productType,
        productSubType, pbUserId, desiredAmount, tenureMonths,
        purpose, branchCode
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
}

// Get application details
async function getApplicationDetails(applicationId) {
  try {
    const result = await db.query(
      'SELECT * FROM applications WHERE application_id = $1',
      [applicationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Application not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching application details:', error);
    throw error;
  }
}

module.exports = { 
  getCustomerStatus, 
  fetchCifDetails, 
  updateCifDetails,
  createApplication,
  getApplicationDetails,
  generateApplicationId
};

