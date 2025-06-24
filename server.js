const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Routes
const applicationsRoute = require('./routes/applications');
const personalDetails = require('./routes/personalDetails');
const currentAddress = require('./routes/currentAddress');
const permanentAddress = require('./routes/permanentAddress');
const employmentDetails = require('./routes/employmentDetails');
const vehicleDetails = require('./routes/vehicleDetails');
const insuranceDetails = require('./routes/insuranceDetails');
const contactDetails = require('./routes/contactDetails');
const referenceContacts = require('./routes/referenceContacts');
const verificationRoutes = require('./routes/verification');


app.use('/api/verification', verificationRoutes);
app.use('/api/reference-contacts', referenceContacts);
app.use('/api/contact-details', contactDetails);
app.use('/api/insurance-details', insuranceDetails);
app.use('/api/vehicle-details', vehicleDetails);
app.use('/api/employment-details', employmentDetails);
app.use('/api/permanent-address', permanentAddress);
app.use('/api/applications', applicationsRoute);
app.use('/api/personal-details', personalDetails);
app.use('/api/current-address', currentAddress);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
