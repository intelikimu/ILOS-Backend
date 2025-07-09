const express = require('express');
const cors = require('cors');
const db = require('./db');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
        CIF, Title, FirstName, LastName, FatherName, MotherName,
        DateOfBirth, Gender, MaritalStatus, Religion, Nationality,
        ResidentialStatus, Education, Profession, Income,
        MobileNumber, EmailAddress, ResidentialAddress, OfficeAddress,
        AccountNumber, AccountTitle, BankName, BranchName,
        NextOfKinName, NextOfKinRelation, NextOfKinContact,
        ReferenceContact1, ReferenceContact2
      FROM customer_data 
      WHERE CNIC = ?
    `;

    const [rows] = await db.execute(query, [cnic]);
    
    if (rows.length === 0) {
      return res.json({
        isETB: false,
        customer: null,
        message: 'New customer'
      });
    }

    const customer = rows[0];
    
    // Format customer data for frontend
    const formattedCustomer = {
      cif: customer.CIF,
      title: customer.Title,
      firstName: customer.FirstName,
      lastName: customer.LastName,
      fatherName: customer.FatherName,
      motherName: customer.MotherName,
      dateOfBirth: customer.DateOfBirth,
      gender: customer.Gender,
      maritalStatus: customer.MaritalStatus,
      religion: customer.Religion,
      nationality: customer.Nationality,
      residentialStatus: customer.ResidentialStatus,
      education: customer.Education,
      profession: customer.Profession,
      income: customer.Income,
      mobileNumber: customer.MobileNumber,
      emailAddress: customer.EmailAddress,
      residentialAddress: customer.ResidentialAddress,
      officeAddress: customer.OfficeAddress,
      accountNumber: customer.AccountNumber,
      accountTitle: customer.AccountTitle,
      bankName: customer.BankName,
      branchName: customer.BranchName,
      nextOfKinName: customer.NextOfKinName,
      nextOfKinRelation: customer.NextOfKinRelation,
      nextOfKinContact: customer.NextOfKinContact,
      referenceContact1: customer.ReferenceContact1,
      referenceContact2: customer.ReferenceContact2
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 