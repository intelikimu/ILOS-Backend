const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Helper function to generate random values within realistic ranges
function generateRandomValue(field, loanType) {
    const ranges = {
        gross_monthly_salary: { min: 50000, max: 300000 },
        net_monthly_income: { min: 40000, max: 250000 },
        date_of_birth: () => {
            const currentYear = new Date().getFullYear();
            const age = Math.floor(Math.random() * (65 - 25 + 1)) + 25; // Age between 25-65
            const birthYear = currentYear - age;
            return `${birthYear}-01-01`;
        },
        amount_requested: {
            'Cashplus': { min: 100000, max: 2000000 },
            'commercialvehicle': { min: 500000, max: 5000000 },
            'autoloan': { min: 500000, max: 3000000 },
            'smeasaan': { min: 200000, max: 1500000 },
            default: { min: 100000, max: 2000000 }
        },
        tenure: {
            'Cashplus': { min: 12, max: 60 },
            'commercialvehicle': { min: 12, max: 84 },
            'autoloan': { min: 12, max: 84 },
            'smeasaan': { min: 12, max: 60 },
            default: { min: 12, max: 60 }
        }
    };

    if (field === 'date_of_birth') {
        return ranges.date_of_birth();
    }

    if (field === 'amount_requested' || field === 'tenure') {
        const range = ranges[field][loanType] || ranges[field].default;
        return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    }

    const range = ranges[field];
    if (range) {
        return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    }

    return 0;
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 35; // Default age
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Helper function to calculate EMI
function calculateEMI(amount, annualRate, months) {
    if (months <= 0) return 0;
    const monthlyRate = (annualRate / 100) / 12;
    if (monthlyRate === 0) return amount / months;
    return amount * monthlyRate * Math.pow(1 + monthlyRate, months) /
        (Math.pow(1 + monthlyRate, months) - 1);
}

// Main DBR evaluation function
function evaluateSBPDBR(loanApplication) {
    let netIncome = loanApplication.net_monthly_income;
    if (netIncome === 0 || !netIncome) {
        netIncome = loanApplication.gross_monthly_income - loanApplication.taxes_and_deductions;
    }
    if (netIncome <= 0) {
        throw new Error('Invalid net income');
    }

    const creditCardComponent = loanApplication.credit_card_limit * 0.05;
    const overdraftMonthly = loanApplication.overdraft_interest_year / 12;
    const proposedEMI = calculateEMI(
        loanApplication.proposed_loan_amount, 
        loanApplication.annual_rate_percent, 
        loanApplication.proposed_tenure_months
    );
    
    const totalObligations = loanApplication.existing_emis + creditCardComponent + overdraftMonthly + proposedEMI;
    const dbr = (totalObligations / netIncome) * 100;

    let status = dbr <= 35 ? 'pass' :
                 dbr <= 40 ? 'conditionally fail - redirect to RRU' : 'fail';

    if (status === 'pass' && loanApplication.age > 65) {
        status = 'conditionally fail - redirect to RRU';
    }

    return {
        status,
        dbr: Math.round(dbr * 100) / 100,
        net_income: netIncome,
        total_obligations: Math.round(totalObligations * 100) / 100,
    };
}

// API endpoint that accepts LOS ID
app.post('/dbr', async (req, res) => {
    const losId = req.body.losId;
    const loan_type = req.body.loan_type;
    
    // Validate required fields
    if (!losId || !loan_type) {
        return res.status(400).json({
            success: false,
            message: 'losId and loan_type are required'
        });
    }
    
    console.log("ECIB Fetch");
    console.log(losId);
    console.log(loan_type);

    try {
        // /api/application/form/:losId
        const applicationForm = await fetch(`http://192.168.1.170:5000/api/applications/form/${losId}`);
        const applicationFormData = await applicationForm.json();
        
        // Handle null values with random defaults
        let cnic = applicationFormData.formData.cnic || '3520111112221';
        let gross_monthly_salary = applicationFormData.formData.gross_monthly_salary || generateRandomValue('gross_monthly_salary');
        let net_monthly_income = applicationFormData.formData.net_monthly_income || generateRandomValue('net_monthly_income');
        let date_of_birth = applicationFormData.formData.date_of_birth || generateRandomValue('date_of_birth', loan_type);
        let amount_requested = applicationFormData.formData.amount_requested || generateRandomValue('amount_requested', loan_type);

        console.log(cnic);
    
        // /api/ecib-reports/check
        const ecibReport = await fetch(`http://192.168.1.148:5000/api/ecib-reports/check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cnic: cnic
            })
        });
        
        const ecibReportData = await ecibReport.json();
        console.log(ecibReportData);
        
        // Handle null values from ECIB report with defaults
        const total_balance_outstanding = parseFloat(ecibReportData.total_balance_outstanding) || 0;
        const tenure = parseInt(ecibReportData.tenure) || generateRandomValue('tenure', loan_type);
        const overdraft_interest = parseFloat(ecibReportData.overdraft_interest) || 0;
        const taxes = parseFloat(ecibReportData.taxes) || 0;
        const existing_emi_amount = parseFloat(ecibReportData.existing_emi_amount) || 0;
        const credit_card_limit = parseFloat(ecibReportData.credit_card_limit) || 0;
        const annual_rate = parseFloat(ecibReportData.annual_rate) || 14.6;

        console.log(loan_type);
        console.log(total_balance_outstanding);

        // Log the LOS ID to console
        console.log(`LOS ID received: ${losId}`);
        
        //dbr calc start
        
        // Calculate age from date of birth
        const age = calculateAge(date_of_birth);
        
        // Prepare loan application object for DBR calculation
        const loanApplication = {
            gross_monthly_income: parseFloat(gross_monthly_salary),
            net_monthly_income: parseFloat(net_monthly_income) || 0,
            taxes_and_deductions: parseFloat(taxes) || 0,
            existing_emis: parseFloat(existing_emi_amount) || 0,
            credit_card_limit: parseFloat(credit_card_limit) || 0,
            overdraft_interest_year: parseFloat(total_balance_outstanding) || 0,
            proposed_loan_amount: parseFloat(amount_requested),
            proposed_tenure_months: parseInt(tenure),
            annual_rate_percent: parseFloat(annual_rate),
            age: age
        };

        console.log('Loan Application Data:', loanApplication);

        // Calculate DBR using the integrated logic
        const dbrResult = evaluateSBPDBR(loanApplication);
        
        console.log('DBR Calculation Result:', dbrResult);
        
        //dbr calc end
        
        res.json({
            success: true,
            message: 'DBR calculated successfully',
            losId: losId,
            loan_type: loan_type,
            cnic: cnic,
            gross_monthly_salary: gross_monthly_salary,
            net_monthly_income: net_monthly_income,
            date_of_birth: date_of_birth,
            amount_requested: amount_requested,
            tenure: tenure,
            overdraft_interest: overdraft_interest,
            taxes: taxes,
            existing_emi_amount: existing_emi_amount,
            credit_card_limit: credit_card_limit,
            annual_rate: annual_rate,
            total_balance_outstanding: total_balance_outstanding,
            age: age,
            // Main DBR results
            dbr: dbrResult.dbr,
            status: dbrResult.status,
            // Additional details
            dbr_details: {
                net_income: dbrResult.net_income,
                total_obligations: dbrResult.total_obligations,
                dbr_percentage: dbrResult.dbr
            }
        });

    } catch (error) {
        console.error('Error in DBR calculation:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating DBR',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'LOS API is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'LOS API Server',
        endpoints: {
            'GET /dbr': 'Calculate DBR for loan application',
            'GET /health': 'Health check endpoint'
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`LOS API server is running on port ${PORT}`);
    console.log(`Server started at: ${new Date().toISOString()}`);
    console.log(`Access the API at:`);
    console.log(`- Local: http://localhost:${PORT}`);
    console.log(`- Network: http://192.168.1.116:${PORT}`);
});