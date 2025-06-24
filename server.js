const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Routes
const applicationsRoute = require('./routes/applications');
app.use('/api/applications', applicationsRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
