const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/check-all', async (req, res) => {
  const { cnic } = req.body;

  if (!cnic) {
    return res.status(400).json({ success: false, message: 'CNIC is required' });
  }

  const baseURL = 'http://localhost:5000/api';

  const endpoints = [
    `${baseURL}/pep/check`,
    `${baseURL}/frms/check`,
    `${baseURL}/sbp-blacklist/check`,
    `${baseURL}/ecib-reports/check`,
    `${baseURL}/nadra-verisys/check`,
    `${baseURL}/internal-watchlist/check`,
  ];

  try {
    const results = await Promise.all(
      endpoints.map(url =>
        axios.post(url, { cnic })
          .then(response => ({ url, data: response.data }))
          .catch(error => ({
            url,
            error: error.response?.data || error.message
          }))
      )
    );

    res.json({
      success: true,
      results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error hitting one or more APIs', error: err.message });
  }
});

module.exports = router;
