const { handleCors, successResponse, errorResponse } = require('./_utils');
const { getCustomerStatus, fetchCifDetails } = require('../customerService');

module.exports = async (req, res) => {
  // Handle CORS
  if (handleCors(req, res)) return;

  try {
    let cnic;
    
    // Handle both POST and GET requests
    if (req.method === 'POST') {
      cnic = req.body?.cnic;
    } else if (req.method === 'GET') {
      // Extract CNIC from URL path
      const urlParts = req.url.split('/').filter(Boolean);
      cnic = urlParts[urlParts.length - 1];
    }
    
    if (!cnic) {
      return errorResponse(res, 400, 'CNIC is required');
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
        
        return successResponse(res, response);

      } catch (err) {
        console.error('CIF fetch error:', err);
        return errorResponse(res, 500, 'CIF fetch failed', err.message);
      }
    } else {
      // NTB customer
      return successResponse(res, {
        isETB: false,
        consumerId: statusInfo.consumerId,
        customerData: null
      });
    }
  } catch (error) {
    console.error('Error in getNTB_ETB:', error);
    return errorResponse(res, 500, 'Internal server error', error.message);
  }
}; 