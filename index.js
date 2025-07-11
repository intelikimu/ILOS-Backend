const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { getCustomerStatus, fetchCifDetails } = require('./customerService');

// Import routes
const autoLoanRoutes = require('./routes/autoloan');
const cashPlusRoutes = require('./routes/cashplus');
const creditCardRoutes = require('./routes/creditcard');
const applicationsRoutes = require('./routes/applications');
const personalDetailsRoutes = require('./routes/personalDetails');
const currentAddressRoutes = require('./routes/currentAddress');
const permanentAddressRoutes = require('./routes/permanentAddress');
const employmentDetailsRoutes = require('./routes/employmentDetails');
const referenceContactsRoutes = require('./routes/referenceContacts');
const vehicleDetailsRoutes = require('./routes/vehicleDetails');
const insuranceDetailsRoutes = require('./routes/insuranceDetails');
const contactDetailsRoutes = require('./routes/contactDetails');
const verificationRoutes = require('./routes/verification');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ILOS Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// Customer status check endpoint (ETB/NTB)
app.post('/getNTB_ETB', async (req, res) => {
  try {
    const { cnic } = req.body;
    
    if (!cnic) {
      return res.status(400).json({ error: 'CNIC is required' });
    }

    const statusInfo = await getCustomerStatus(cnic);
    const isETB = statusInfo.status === "ETB";

    if (isETB) {
      try {
        const cifDetails = await fetchCifDetails(statusInfo.consumerId);
        
        // Format response for frontend
        const response = {
          isETB: true,
          consumerId: statusInfo.consumerId,
          customerData: {
            personalDetails: {
              firstName: cifDetails.firstName || '',
              middleName: cifDetails.middleName || '',
              lastName: cifDetails.lastName || '',
              title: cifDetails.title || '',
              cnic: cifDetails.cnic || '',
              ntn: cifDetails.ntn || '',
              dateOfBirth: cifDetails.dateOfBirth || '',
              gender: cifDetails.gender || '',
              maritalStatus: cifDetails.maritalStatus || '',
              numberOfDependents: 0,
              education: cifDetails.education || '',
              fatherName: cifDetails.fatherHusbandName || '',
              motherName: cifDetails.motherMaidenName || '',
              mobileNumber: cifDetails.phoneNo || ''
            },
            addressDetails: {
              currentAddress: {
                houseNo: '',
                street: '',
                nearestLandmark: '',
                city: cifDetails.city || '',
                postalCode: cifDetails.postalCode || '',
                yearsAtAddress: '',
                residentialStatus: '',
                monthlyRent: 0
              },
              permanentAddress: {
                houseNo: '',
                street: '',
                city: '',
                postalCode: ''
              }
            },
            employmentDetails: {
              companyName: '',
              companyType: '',
              department: '',
              designation: '',
              grade: '',
              currentExperience: 0,
              previousEmployer: '',
              previousExperience: 0,
              officeAddress: {
                houseNo: '',
                street: '',
                tehsil: '',
                nearestLandmark: '',
                city: '',
                postalCode: '',
                fax: '',
                telephone1: '',
                telephone2: '',
                extension: ''
              }
            },
            bankingDetails: {
              bankName: cifDetails.bankName || '',
              accountNo: cifDetails.accountNo || '',
              branch: cifDetails.branch || ''
            }
          }
        };
        
        return res.json(response);

      } catch (err) {
        console.error('CIF fetch error:', err);
        return res.status(500).json({ 
          error: 'CIF fetch failed', 
          details: err.message 
        });
      }
    } else {
      // NTB customer
      return res.json({
        isETB: false,
        consumerId: statusInfo.consumerId,
        customerData: null
      });
    }
  } catch (error) {
    console.error('Error in getNTB_ETB:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// CIF Details endpoint for ETB customers
app.get('/cif/:consumerId', async (req, res) => {
  try {
    const { consumerId } = req.params;
    const cifDetails = await fetchCifDetails(consumerId);
    res.json(cifDetails);
  } catch (error) {
    console.error('Error fetching CIF details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch CIF details', 
      details: error.message 
    });
  }
});





// Product-specific routes
app.use('/api/autoloan', autoLoanRoutes);
app.use('/api/cashplus', cashPlusRoutes);
app.use('/api/creditcard', creditCardRoutes);

// General application routes
app.use('/api/applications', applicationsRoutes);
app.use('/api/personal-details', personalDetailsRoutes);
app.use('/api/current-address', currentAddressRoutes);
app.use('/api/permanent-address', permanentAddressRoutes);
app.use('/api/employment-details', employmentDetailsRoutes);
app.use('/api/reference-contacts', referenceContactsRoutes);
app.use('/api/vehicle-details', vehicleDetailsRoutes);
app.use('/api/insurance-details', insuranceDetailsRoutes);
app.use('/api/contact-details', contactDetailsRoutes);
app.use('/api/verification', verificationRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 ILOS Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});


