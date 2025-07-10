const express = require('express');
const router = express.Router();
const customerService = require('../customerService');

// Get customer status by CNIC
router.get('/customer-status/:cnic', async (req, res) => {
  try {
    const { cnic } = req.params;
    const customerStatus = await customerService.getCustomerStatus(cnic);
    res.json(customerStatus);
  } catch (error) {
    console.error('Error fetching customer status:', error);
    res.status(500).json({ error: 'Failed to fetch customer status' });
  }
});

// Get complete CIF details for ETB customers
router.get('/details/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const cifDetails = await customerService.fetchCifDetails(customerId);
    res.json(cifDetails);
  } catch (error) {
    console.error('Error fetching CIF details:', error);
    res.status(500).json({ error: 'Failed to fetch CIF details' });
  }
});

// Alternative endpoint for direct CIF access
router.get('/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const cifDetails = await customerService.fetchCifDetails(customerId);
    res.json(cifDetails);
  } catch (error) {
    console.error('Error fetching CIF details:', error);
    res.status(500).json({ error: 'Failed to fetch CIF details' });
  }
});

// Store CIF API response in database
router.post('/store', async (req, res) => {
  try {
    const cifResponse = req.body;
    const result = await customerService.storeCifResponse(cifResponse);
    res.json(result);
  } catch (error) {
    console.error('Error storing CIF response:', error);
    res.status(500).json({ error: 'Failed to store CIF response' });
  }
});

// Update CIF details for NTB customers
router.put('/update/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const customerData = req.body;
    const result = await customerService.updateCifDetails(customerId, customerData);
    res.json(result);
  } catch (error) {
    console.error('Error updating CIF details:', error);
    res.status(500).json({ error: 'Failed to update CIF details' });
  }
});

// Create new application
router.post('/application', async (req, res) => {
  try {
    const applicationData = req.body;
    const result = await customerService.createApplication(applicationData);
    res.json(result);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Get application details by LOS ID
router.get('/application/:losId', async (req, res) => {
  try {
    const { losId } = req.params;
    const applicationDetails = await customerService.getApplicationDetails(losId);
    res.json(applicationDetails);
  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({ error: 'Failed to fetch application details' });
  }
});

module.exports = router; 