const { z } = require('zod');

// Common validation patterns
const cnicPattern = z.string().regex(/^\d{5}-\d{7}-\d{1}$/, 'Invalid CNIC format (12345-1234567-1)');
const phonePattern = z.string().regex(/^(\+92|0)?[0-9]{10,11}$/, 'Invalid phone number format');
const emailPattern = z.string().email('Invalid email format');

// Personal Details Schema
const personalDetailsSchema = z.object({
  title: z.enum(['Mr', 'Mrs', 'Ms', 'Dr', 'Eng', 'Prof']),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  cnic: cnicPattern,
  ntn: z.string().optional(),
  dateOfBirth: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
  gender: z.enum(['Male', 'Female']),
  maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed']),
  noOfChildren: z.number().int().min(0).default(0),
  noOfDependents: z.number().int().min(0).default(0),
  fatherHusbandName: z.string().min(2, 'Father/Husband name is required'),
  motherMaidenName: z.string().min(2, 'Mother maiden name is required'),
  nationality: z.string().default('PK'),
  passportNo: z.string().optional(),
  education: z.string().min(2, 'Education qualification is required'),
  employmentStatus: z.enum(['Salaried', 'Govt. servant', 'Armed forces', 'Business', 'Self-employed', 'Student', 'Retired', 'Unemployed']),
  nextOfKinName: z.string().optional(),
  nextOfKinRelation: z.string().optional(),
  nextOfKinCnic: cnicPattern.optional(),
  nextOfKinContact: phonePattern.optional()
});

// Address Details Schema
const addressDetailsSchema = z.object({
  addressType: z.enum(['current', 'permanent', 'office']),
  houseFlatNo: z.string().optional(),
  street: z.string().min(3, 'Street address is required'),
  area: z.string().min(2, 'Area is required'),
  landmark: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  district: z.string().optional(),
  province: z.string().optional(),
  country: z.string().default('PK'),
  postalCode: z.string().optional(),
  phoneResidence: phonePattern.optional(),
  phoneOffice: phonePattern.optional(),
  mobile: phonePattern,
  email: emailPattern.optional(),
  yearsAtAddress: z.number().int().min(0).optional(),
  residentialStatus: z.enum(['owned', 'rented', 'parents', 'company_provided', 'mortgaged']).optional(),
  monthlyRent: z.number().min(0).optional()
});

// Employment Details Schema
const employmentDetailsSchema = z.object({
  employmentType: z.enum(['salaried', 'business', 'govt', 'armed_forces', 'self_employed']),
  companyName: z.string().min(2, 'Company name is required'),
  designation: z.string().min(2, 'Designation is required'),
  department: z.string().optional(),
  employeeId: z.string().optional(),
  dateOfJoining: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
  yearsOfExperience: z.number().int().min(0),
  natureOfBusiness: z.string().optional(),
  officeAddress: z.string().min(10, 'Office address is required'),
  officeCity: z.string().min(2, 'Office city is required'),
  officePhone: phonePattern.optional(),
  supervisorName: z.string().optional(),
  supervisorContact: phonePattern.optional(),
  basicSalary: z.number().min(0),
  grossSalary: z.number().min(0),
  netSalary: z.number().min(0),
  otherIncome: z.number().min(0).default(0),
  totalIncome: z.number().min(0),
  salaryAccountBank: z.string().optional(),
  salaryAccountNo: z.string().optional()
});

// Reference Contact Schema
const referenceContactSchema = z.object({
  referenceType: z.enum(['personal', 'professional', 'relative']),
  name: z.string().min(2, 'Reference name is required'),
  relation: z.string().min(2, 'Relation is required'),
  cnic: cnicPattern.optional(),
  phone: phonePattern,
  address: z.string().min(10, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  occupation: z.string().min(2, 'Occupation is required')
});

// Banking Details Schema
const bankingDetailsSchema = z.object({
  accountType: z.enum(['current', 'savings', 'salary']),
  bankName: z.string().min(2, 'Bank name is required'),
  branchName: z.string().min(2, 'Branch name is required'),
  accountNo: z.string().min(5, 'Account number is required'),
  accountTitle: z.string().min(2, 'Account title is required'),
  averageBalance: z.number().min(0),
  accountOpeningDate: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
  relationshipYears: z.number().int().min(0)
});

// Vehicle Details Schema (for Auto Loans)
const vehicleDetailsSchema = z.object({
  vehicleType: z.enum(['car', 'motorcycle', 'truck', 'van', 'suv']),
  make: z.string().min(2, 'Vehicle make is required'),
  model: z.string().min(2, 'Vehicle model is required'),
  yearOfManufacture: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  engineCapacity: z.string().optional(),
  registrationNo: z.string().optional(),
  chassisNo: z.string().optional(),
  engineNo: z.string().optional(),
  color: z.string().optional(),
  vehiclePrice: z.number().min(100000, 'Vehicle price must be at least 100,000'),
  downPayment: z.number().min(0),
  financingAmount: z.number().min(0),
  dealerName: z.string().min(2, 'Dealer name is required'),
  dealerContact: phonePattern,
  dealerAddress: z.string().min(10, 'Dealer address is required')
});

// Insurance Details Schema
const insuranceDetailsSchema = z.object({
  insuranceType: z.enum(['comprehensive', 'third_party', 'fire_theft']),
  insuranceCompany: z.string().min(2, 'Insurance company is required'),
  policyNumber: z.string().optional(),
  premiumAmount: z.number().min(0),
  coverageAmount: z.number().min(0),
  policyStartDate: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
  policyEndDate: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date format')
});

// Auto Loan Application Schema
const autoLoanApplicationSchema = z.object({
  financingOption: z.enum(['conventional', 'islamic']),
  loanAmount: z.number().min(100000, 'Loan amount must be at least 100,000'),
  loanTenureMonths: z.number().int().min(12).max(84),
  monthlyInstallment: z.number().min(0),
  processingFee: z.number().min(0),
  insuranceRequired: z.boolean().default(true)
});

// Cash Plus Application Schema
const cashPlusApplicationSchema = z.object({
  loanAmount: z.number().min(50000, 'Loan amount must be at least 50,000').max(1000000, 'Loan amount cannot exceed 1,000,000'),
  loanTenureMonths: z.number().int().min(12).max(60),
  loanPurpose: z.string().min(5, 'Loan purpose is required'),
  monthlyInstallment: z.number().min(0),
  processingFee: z.number().min(0)
});

// Credit Card Application Schema
const creditCardApplicationSchema = z.object({
  cardType: z.enum(['platinum', 'gold', 'classic', 'business']),
  creditLimitRequested: z.number().min(25000, 'Minimum credit limit is 25,000'),
  cardDeliveryAddress: z.string().min(10, 'Card delivery address is required'),
  supplementaryCards: z.number().int().min(0).max(3).default(0),
  rewardProgram: z.string().optional(),
  autoDebitSetup: z.boolean().default(false)
});

// Main Application Schema
const applicationSchema = z.object({
  consumerId: z.string().min(5, 'Consumer ID is required'),
  cnic: cnicPattern,
  customerStatus: z.enum(['ETB', 'NTB']),
  productType: z.enum(['autoloan', 'cashplus', 'creditcard', 'ameendrive', 'smeasaan', 'vehicle']),
  productSubType: z.string().optional(),
  pbUserId: z.string().optional(),
  desiredAmount: z.number().min(0).optional(),
  tenureMonths: z.number().int().min(1).optional(),
  purpose: z.string().optional(),
  branchCode: z.string().optional()
});

// Combined schemas for complete form submissions
const completeAutoLoanSchema = z.object({
  application: applicationSchema,
  personalDetails: personalDetailsSchema,
  currentAddress: addressDetailsSchema,
  permanentAddress: addressDetailsSchema.optional(),
  employmentDetails: employmentDetailsSchema,
  references: z.array(referenceContactSchema).min(2, 'At least 2 references required'),
  bankingDetails: bankingDetailsSchema,
  vehicleDetails: vehicleDetailsSchema,
  insuranceDetails: insuranceDetailsSchema,
  autoLoanDetails: autoLoanApplicationSchema
});

const completeCashPlusSchema = z.object({
  application: applicationSchema,
  personalDetails: personalDetailsSchema,
  currentAddress: addressDetailsSchema,
  permanentAddress: addressDetailsSchema.optional(),
  employmentDetails: employmentDetailsSchema,
  references: z.array(referenceContactSchema).min(2, 'At least 2 references required'),
  bankingDetails: bankingDetailsSchema,
  cashPlusDetails: cashPlusApplicationSchema
});

const completeCreditCardSchema = z.object({
  application: applicationSchema,
  personalDetails: personalDetailsSchema,
  currentAddress: addressDetailsSchema,
  permanentAddress: addressDetailsSchema.optional(),
  employmentDetails: employmentDetailsSchema,
  references: z.array(referenceContactSchema).min(2, 'At least 2 references required'),
  bankingDetails: bankingDetailsSchema,
  creditCardDetails: creditCardApplicationSchema
});

// Export all schemas
module.exports = {
  // Individual schemas
  personalDetailsSchema,
  addressDetailsSchema,
  employmentDetailsSchema,
  referenceContactSchema,
  bankingDetailsSchema,
  vehicleDetailsSchema,
  insuranceDetailsSchema,
  applicationSchema,
  autoLoanApplicationSchema,
  cashPlusApplicationSchema,
  creditCardApplicationSchema,
  
  // Complete form schemas
  completeAutoLoanSchema,
  completeCashPlusSchema,
  completeCreditCardSchema,
  
  // Common patterns
  cnicPattern,
  phonePattern,
  emailPattern
}; 