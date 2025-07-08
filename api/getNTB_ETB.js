// api/getNTB_ETB.js - Customer status check endpoint
const { applyCors, handleCors, sendSuccess, handleError } = require('./_utils');
const { getCustomerStatus, fetchCifDetails } = require('../customerService');

module.exports = async (req, res) => {
  try {
    // Apply CORS
    await applyCors(req, res);
    
    // Handle preflight
    if (handleCors(req, res)) return;

    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

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
        
        sendSuccess(res, response);

      } catch (err) {
        handleError(res, err, 'CIF fetch failed');
      }
    } else {
      // NTB customer
      sendSuccess(res, {
        isETB: false,
        consumerId: statusInfo.consumerId,
        customerData: null
      });
    }
  } catch (error) {
    handleError(res, error, 'Error in getNTB_ETB');
  }
}; 