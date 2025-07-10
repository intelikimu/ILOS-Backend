const axios = require('axios');
const db = require('./db');

// Generate a unique customer ID for NTB customers
function generateNTBCustomerId(cnic) {
  const timestamp = Date.now().toString().slice(-6);
  return `NTB-${cnic.slice(-4)}-${timestamp}`;
}

// Generate a unique LOS ID
function generateLosId(productType, customerId) {
  const timestamp = Date.now().toString().slice(-6);
  const productPrefix = productType.toUpperCase().slice(0, 3);
  return `LOS-${productPrefix}-${customerId.slice(-6)}-${timestamp}`;
}

// Check customer status and get/create customer ID
async function getCustomerStatus(cnic) {
  try {
    // Check if customer exists in CIF table
    const result = await db.query(
      'SELECT customer_id, status, cnic FROM cif_customers WHERE cnic = $1',
      [cnic]
    );

    if (result.rows.length > 0) {
      const customer = result.rows[0];
      return {
        cnic: customer.cnic,
        status: customer.status,
        customerId: customer.customer_id,
        isExisting: true
      };
    } else {
      // For NTB customers, we'll just return the status without creating a record
      return {
        cnic,
        status: 'NTB',
        customerId: null,
        isExisting: false
      };
    }
  } catch (error) {
    console.error('Error in getCustomerStatus:', error);
    throw error;
  }
}

// Fetch complete CIF details for ETB customers
async function fetchCifDetails(customerId) {
  try {
    const result = await db.query(
      'SELECT * FROM cif_customers WHERE customer_id = $1',
      [customerId]
    );

    if (result.rows.length === 0) {
      throw new Error('Customer not found');
    }

    const customer = result.rows[0];
    
    // Fetch all related CIF data
    const [
      customerIdType,
      relationship,
      dirDetails,
      clientBanks,
      postal,
      email,
      phone,
      fax,
      swift,
      collect,
      individualInfo
    ] = await Promise.all([
      db.query('SELECT * FROM customer_id_type WHERE customer_id = $1', [customerId]),
      db.query('SELECT * FROM relationship WHERE customer_id = $1', [customerId]),
      db.query('SELECT * FROM dir_details WHERE customer_id = $1', [customerId]),
      db.query('SELECT * FROM client_banks WHERE customer_id = $1', [customerId]),
      db.query('SELECT * FROM postal WHERE customer_id = $1', [customerId]),
      db.query('SELECT * FROM email WHERE customer_id = $1', [customerId]),
      db.query('SELECT * FROM phone WHERE customer_id = $1', [customerId]),
      db.query('SELECT * FROM fax WHERE customer_id = $1', [customerId]),
      db.query('SELECT * FROM swift WHERE customer_id = $1', [customerId]),
      db.query('SELECT * FROM collect WHERE customer_id = $1', [customerId]),
      db.query('SELECT * FROM individual_info WHERE customer_id = $1', [customerId])
    ]);

    // Transform database fields to match CIF API format
    return {
      customerId: customer.customer_id,
      cnic: customer.cnic,
      status: customer.status,
      category: customer.category,
      controlBranch: customer.control_branch,
      creationDate: customer.creation_date,
      credtingRating: customer.credting_rating,
      customerType: customer.customer_type,
      domicileCountry: customer.domicile_country,
      domicileState: customer.domicile_state,
      fullname: customer.fullname,
      indicator: customer.indicator,
      industry: customer.industry,
      internalFlag: customer.internal_flag,
      profitCenter: customer.profit_center,
      relManager: customer.rel_manager,
      residentFlag: customer.resident_flag,
      riskCountry: customer.risk_country,
      shortName: customer.short_name,
      tableInd: customer.table_ind,
      typeIndicator: customer.type_indicator,
      class1: customer.class_1,
      class2: customer.class_2,
      class4: customer.class_4,
      business: customer.business,
      district: customer.district,
      city: customer.city,
      clientNoCmc: customer.client_no_cmc,
      ftRateCategory: customer.ft_rate_category,
      reclass: customer.reclass,
      oenaceCode: customer.oenace_code,
      reporting: customer.reporting,
      stopSc: customer.stop_sc,
      clientVersion: customer.client_version,
      taxRegCompFlag: customer.tax_reg_comp_flag,
      incorporationCountry: customer.incorporation_country,
      location: customer.location,
      aminusB: customer.aminus_b,
      annualSales: customer.annual_sales,
      // Related data
      customerIdType: customerIdType.rows[0] || {},
      relationship: relationship.rows[0] || {},
      dirDetails: dirDetails.rows[0] || {},
      clientBanks: clientBanks.rows[0] || {},
      postal: postal.rows[0] || {},
      email: email.rows[0] || {},
      phone: phone.rows[0] || {},
      fax: fax.rows[0] || {},
      swift: swift.rows[0] || {},
      collect: collect.rows[0] || {},
      individualInfo: individualInfo.rows[0] || {},
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    };
  } catch (error) {
    console.error('Error fetching CIF details:', error);
    throw error;
  }
}

// Store CIF API response in database
async function storeCifResponse(cifResponse) {
  try {
    const { cifFetchResponse } = cifResponse;
    const customerId = cifFetchResponse.customerId;

    // Insert/Update main CIF record
    await db.query(`
      INSERT INTO cif_customers (
        customer_id, category, control_branch, creation_date, credting_rating,
        customer_type, domicile_country, domicile_state, fullname, indicator,
        industry, internal_flag, profit_center, rel_manager, resident_flag,
        risk_country, short_name, status, table_ind, type_indicator,
        class_1, class_2, class_4, business, district, city, client_no_cmc,
        ft_rate_category, reclass, oenace_code, reporting, stop_sc,
        client_version, tax_reg_comp_flag, incorporation_country, location,
        aminus_b, annual_sales
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34, $35, $36, $37, $38
      )
      ON CONFLICT (customer_id) DO UPDATE SET
        category = EXCLUDED.category,
        control_branch = EXCLUDED.control_branch,
        creation_date = EXCLUDED.creation_date,
        credting_rating = EXCLUDED.credting_rating,
        customer_type = EXCLUDED.customer_type,
        domicile_country = EXCLUDED.domicile_country,
        domicile_state = EXCLUDED.domicile_state,
        fullname = EXCLUDED.fullname,
        updated_at = CURRENT_TIMESTAMP
    `, [
      customerId, cifFetchResponse.category, cifFetchResponse.controlBranch,
      cifFetchResponse.creationDate, cifFetchResponse.credtingRating,
      cifFetchResponse.customerType, cifFetchResponse.domicileCountry,
      cifFetchResponse.domicileState, cifFetchResponse.fullname,
      cifFetchResponse.indicator, cifFetchResponse.industry,
      cifFetchResponse.internalFlag, cifFetchResponse.profitCenter,
      cifFetchResponse.relManager, cifFetchResponse.residentFlag,
      cifFetchResponse.riskCountry, cifFetchResponse.shortName,
      cifFetchResponse.status, cifFetchResponse.tableInd,
      cifFetchResponse.typeIndicator, cifFetchResponse.class_1,
      cifFetchResponse.class_2, cifFetchResponse.class_4,
      cifFetchResponse.business, cifFetchResponse.district,
      cifFetchResponse.city, cifFetchResponse.clientNoCmc,
      cifFetchResponse.ftRateCategory, cifFetchResponse.reclass,
      cifFetchResponse.oenaceCode, cifFetchResponse.reporting,
      cifFetchResponse.stopSc, cifFetchResponse.clientVersion,
      cifFetchResponse.taxRegCompFlag, cifFetchResponse.incorporationCountry,
      cifFetchResponse.location, cifFetchResponse.aminusB,
      cifFetchResponse.annualSales
    ]);

    // Store related data in respective tables
    if (cifFetchResponse.customerIdType) {
      await db.query(`
        INSERT INTO customer_id_type (customer_id, position, expiry_date, id_no, id_type)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (customer_id) DO UPDATE SET
          position = EXCLUDED.position,
          expiry_date = EXCLUDED.expiry_date,
          id_no = EXCLUDED.id_no,
          id_type = EXCLUDED.id_type
      `, [
        customerId,
        cifFetchResponse.customerIdType.position,
        cifFetchResponse.customerIdType.expiryDate,
        cifFetchResponse.customerIdType.idNo,
        cifFetchResponse.customerIdType.idType
      ]);
    }

    // Store other related data similarly...
    if (cifFetchResponse.phone) {
      await db.query(`
        INSERT INTO phone (customer_id, position, contact_sub_type, phone_no, client_lang, contact_ref_no, dft_to_loan_stmt, dftl_to_rb_stmt, contact_version)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (customer_id) DO UPDATE SET
          position = EXCLUDED.position,
          contact_sub_type = EXCLUDED.contact_sub_type,
          phone_no = EXCLUDED.phone_no,
          client_lang = EXCLUDED.client_lang,
          contact_ref_no = EXCLUDED.contact_ref_no,
          dft_to_loan_stmt = EXCLUDED.dft_to_loan_stmt,
          dftl_to_rb_stmt = EXCLUDED.dftl_to_rb_stmt,
          contact_version = EXCLUDED.contact_version
      `, [
        customerId,
        cifFetchResponse.phone.position,
        cifFetchResponse.phone.contactSubType,
        cifFetchResponse.phone.phoneNo,
        cifFetchResponse.phone.clientLang,
        cifFetchResponse.phone.contactRefNo,
        cifFetchResponse.phone.dftToLoanStmt,
        cifFetchResponse.phone.dftlToRbStmt,
        cifFetchResponse.phone.contactVersion
      ]);
    }

    if (cifFetchResponse.postal) {
      await db.query(`
        INSERT INTO postal (customer_id, position, contact_sub_type, address, address_country_code, postal_code, client_lang, contact_ref_no, dftl_to_loan_stmt, dftl_to_rb_stmt, contact_version)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (customer_id) DO UPDATE SET
          position = EXCLUDED.position,
          contact_sub_type = EXCLUDED.contact_sub_type,
          address = EXCLUDED.address,
          address_country_code = EXCLUDED.address_country_code,
          postal_code = EXCLUDED.postal_code,
          client_lang = EXCLUDED.client_lang,
          contact_ref_no = EXCLUDED.contact_ref_no,
          dftl_to_loan_stmt = EXCLUDED.dftl_to_loan_stmt,
          dftl_to_rb_stmt = EXCLUDED.dftl_to_rb_stmt,
          contact_version = EXCLUDED.contact_version
      `, [
        customerId,
        cifFetchResponse.postal.position,
        cifFetchResponse.postal.contactSubType,
        cifFetchResponse.postal.address,
        cifFetchResponse.postal.addressCountryCode,
        cifFetchResponse.postal.postalCode,
        cifFetchResponse.postal.clientLang,
        cifFetchResponse.postal.contactRefNo,
        cifFetchResponse.postal.dftlToLoanStmt,
        cifFetchResponse.postal.dftlToRbStmt,
        cifFetchResponse.postal.contactVersion
      ]);
    }

    if (cifFetchResponse.indvidualInfo) {
      await db.query(`
        INSERT INTO individual_info (customer_id, position, country_citizenship, country_of_birth, date_of_birth, given_name1, given_name2, given_name3, surname, maritial_status, sex, resident_status, palce_of_birth, surname_first, occupation_code, father_husband_name, indvl_version)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (customer_id) DO UPDATE SET
          position = EXCLUDED.position,
          country_citizenship = EXCLUDED.country_citizenship,
          country_of_birth = EXCLUDED.country_of_birth,
          date_of_birth = EXCLUDED.date_of_birth,
          given_name1 = EXCLUDED.given_name1,
          given_name2 = EXCLUDED.given_name2,
          given_name3 = EXCLUDED.given_name3,
          surname = EXCLUDED.surname,
          maritial_status = EXCLUDED.maritial_status,
          sex = EXCLUDED.sex,
          resident_status = EXCLUDED.resident_status,
          palce_of_birth = EXCLUDED.palce_of_birth,
          surname_first = EXCLUDED.surname_first,
          occupation_code = EXCLUDED.occupation_code,
          father_husband_name = EXCLUDED.father_husband_name,
          indvl_version = EXCLUDED.indvl_version
      `, [
        customerId,
        cifFetchResponse.indvidualInfo.position,
        cifFetchResponse.indvidualInfo.countryCitizenship,
        cifFetchResponse.indvidualInfo.countryOfBirth,
        cifFetchResponse.indvidualInfo.dateOfBirth,
        cifFetchResponse.indvidualInfo.givenName1,
        cifFetchResponse.indvidualInfo.givenName2,
        cifFetchResponse.indvidualInfo.givenName3,
        cifFetchResponse.indvidualInfo.surname,
        cifFetchResponse.indvidualInfo.maritialStatus,
        cifFetchResponse.indvidualInfo.sex,
        cifFetchResponse.indvidualInfo.residentStatus,
        cifFetchResponse.indvidualInfo.palceOfBirth,
        cifFetchResponse.indvidualInfo.surnameFirst,
        cifFetchResponse.indvidualInfo.occupationCode,
        cifFetchResponse.indvidualInfo.fatherHusbandName,
        cifFetchResponse.indvidualInfo.indvlVersion
      ]);
    }

    return { success: true, customerId };
  } catch (error) {
    console.error('Error storing CIF response:', error);
    throw error;
  }
}

// Update CIF details for NTB customers when they submit forms
async function updateCifDetails(customerId, customerData) {
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
    updateValues.push(customerId);

    const query = `
      UPDATE cif_customers 
      SET ${updateFields.join(', ')} 
      WHERE customer_id = $${paramIndex}
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
      customerId,
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

    const losId = generateLosId(productType, customerId);

    const result = await db.query(
      `INSERT INTO applications (
        los_id, customer_id, cnic, customer_status, product_type, 
        product_sub_type, pb_user_id, desired_amount, tenure_months, 
        purpose, branch_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        losId, customerId, cnic, customerStatus, productType,
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
async function getApplicationDetails(losId) {
  try {
    const result = await db.query(
      'SELECT * FROM applications WHERE los_id = $1',
      [losId]
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
  generateLosId,
  storeCifResponse
};

