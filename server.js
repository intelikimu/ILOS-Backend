const express = require('express');
const cors = require('cors');
const db = require('./db');
const bodyParser = require('body-parser');
const applicationRoutes = require('./routes/applications'); // adjust if in a different path



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'ILOS Backend Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Customer Status Endpoint
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

// NTB/ETB Endpoint
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

    const formattedCustomer = {
      customerId: customer.customer_id,
      cnic: customer.cnic,
      status: customer.status,
      fullname: customer.fullname,
      firstName: customer.fullname?.split(' ')[0] || '',
      lastName: customer.fullname?.split(' ').slice(-1)[0] || '',
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

// Routes
app.use('/api/applications', require('./routes/applications'));
app.use('/api/personal-details', require('./routes/personalDetails'));
app.use('/api/current-address', require('./routes/currentAddress'));
app.use('/api/permanent-address', require('./routes/permanentAddress'));
app.use('/api/employment-details', require('./routes/employmentDetails'));
app.use('/api/vehicle-details', require('./routes/vehicleDetails'));
app.use('/api/reference-contacts', require('./routes/referenceContacts'));
app.use('/api/insurance-details', require('./routes/insuranceDetails'));
app.use('/api/contact-details', require('./routes/contactDetails'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/cif', require('./routes/cif'));
app.use('/cif', require('./routes/cif'));
app.use('/api/cashplus', require('./routes/cashplus'));
app.use('/api/autoloan', require('./routes/autoloan'));
app.use('/api/ameendrive', require('./routes/ameendrive'));
app.use('/api/smeasaan', require('./routes/smeasaan'));
app.use('/api/commercialVehicle', require('./routes/commercialVehicle'));
app.use('/api/classic_creditcard', require('./routes/classic_creditcard'));
app.use('/api/platinum_creditcard', require('./routes/platinum_creditcard'));
app.use('/api/applications', applicationRoutes);



// Start the server and bind to 0.0.0.0 for LAN access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Server running at: http://192.168.1.170:${PORT}`);
});
