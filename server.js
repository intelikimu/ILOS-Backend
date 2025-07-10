const express = require('express');
const cors = require('cors');
const db = require('./db');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Import routes
const applicationsRouter = require('./routes/applications');
const personalDetailsRouter = require('./routes/personalDetails');
const currentAddressRouter = require('./routes/currentAddress');
const permanentAddressRouter = require('./routes/permanentAddress');
const employmentDetailsRouter = require('./routes/employmentDetails');
const vehicleDetailsRouter = require('./routes/vehicleDetails');
const referenceContactsRouter = require('./routes/referenceContacts');
const insuranceDetailsRouter = require('./routes/insuranceDetails');
const contactDetailsRouter = require('./routes/contactDetails');
const verificationRouter = require('./routes/verification');
const cifRouter = require('./routes/cif');


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ILOS Backend Server is running', timestamp: new Date().toISOString() });
});

// Direct customer status endpoint for testing
app.get('/customer-status/:cnic', async (req, res) => {
  try {
    const { cnic } = req.params;
    const customerService = require('./customerService');
    const customerStatus = await customerService.getCustomerStatus(cnic);
    res.json(customerStatus);
  } catch (error) {
    console.error('Error fetching customer status:', error);
    res.status(500).json({ error: 'Failed to fetch customer status' });
  }
});

// Customer lookup endpoint
app.get('/api/getNTB_ETB/:cnic', async (req, res) => {
  try {
    const { cnic } = req.params;
    
    if (!cnic || cnic.length !== 13) {
      return res.status(400).json({ error: 'Valid 13-digit CNIC is required' });
    }

    const query = `
      SELECT 
        customer_id, cnic, status, fullname, domicile_country, domicile_state,
        city, district, business, industry, created_at
      FROM cif_customers
      WHERE cnic = $1
    `;

    const result = await db.query(query, [cnic]);
    
    if (result.rows.length === 0) {
      return res.json({
        isETB: false,
        customer: null,
        message: 'New customer'
      });
    }

    const customer = result.rows[0];
    
    // Format customer data for frontend - using actual table columns
    const formattedCustomer = {
      customerId: customer.customer_id,
      cnic: customer.cnic,
      status: customer.status,
      fullname: customer.fullname,
      firstName: customer.fullname ? customer.fullname.split(' ')[0] : '',
      lastName: customer.fullname ? customer.fullname.split(' ').slice(-1)[0] : '',
      domicileCountry: customer.domicile_country,
      domicileState: customer.domicile_state,
      city: customer.city,
      district: customer.district,
      business: customer.business,
      industry: customer.industry,
      createdAt: customer.created_at
    };

    res.json({
      isETB: true,
      customer: formattedCustomer,
      message: 'Existing customer found'
    });

  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Use routes
app.use('/api/applications', applicationsRouter);
app.use('/api/personal-details', personalDetailsRouter);
app.use('/api/current-address', currentAddressRouter);
app.use('/api/permanent-address', permanentAddressRouter);
app.use('/api/employment-details', employmentDetailsRouter);
app.use('/api/vehicle-details', vehicleDetailsRouter);
app.use('/api/reference-contacts', referenceContactsRouter);
app.use('/api/insurance-details', insuranceDetailsRouter);
app.use('/api/contact-details', contactDetailsRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/cif', cifRouter);
app.use('/cif', cifRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 