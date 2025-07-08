# ILOS Backend - Immutable Loan Origination System

A comprehensive backend system for UBL's Loan Origination System, designed to handle multiple product types including Auto Loans, Cash Plus, Credit Cards, and more.

## 🏗️ Architecture

The ILOS backend supports:
- **ETB (Existing to Bank)** customers with automatic data population from CIF
- **NTB (New to Bank)** customers with manual data entry
- Multiple product types: Auto Loan, Cash Plus, Credit Cards, Ameen Drive, SME, etc.
- Comprehensive validation using Zod schemas
- PostgreSQL database with normalized schema

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (local or cloud like Neon)
- npm or yarn

### Installation

1. **Clone and Install Dependencies**
   ```bash
   cd ILOS-backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your database configuration:
   ```env
   DATABASE_URL=postgresql://username:password@hostname:port/database_name
   PORT=5000
   NODE_ENV=development
   ```

3. **Initialize Database**
   ```bash
   npm run init-db
   ```

4. **Start the Server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Verify Installation**
   Visit `http://localhost:5000/health` to confirm the server is running.

## 📊 Database Schema

The system uses a normalized PostgreSQL schema with the following main tables:

### Core Tables
- `cif_customers` - Customer Information File (ETB customers)
- `applications` - Main application records
- `personal_details` - Customer personal information
- `address_details` - Current/permanent addresses
- `employment_details` - Employment information
- `reference_contacts` - Reference contacts
- `banking_details` - Banking relationships

### Product-Specific Tables
- `autoloan_applications` - Auto loan specific data
- `cashplus_applications` - Cash Plus loan data
- `credit_card_applications` - Credit card applications
- `vehicle_details` - Vehicle information (for auto loans)
- `insurance_details` - Insurance information

## 🔗 API Endpoints

### Customer Status & CIF

#### Check Customer Status (ETB/NTB)
```http
POST /getNTB_ETB
Content-Type: application/json

{
  "cnic": "12345-1234567-1"
}
```

**Response for ETB Customer:**
```json
{
  "cnic": "12345-1234567-1",
  "status": "ETB",
  "consumerId": "ETB-123456",
  "isExisting": true,
  "cifDetails": {
    "consumerId": "ETB-123456",
    "fullName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@email.com",
    "phoneNo": "03001234567",
    // ... other CIF details
  }
}
```

**Response for NTB Customer:**
```json
{
  "cnic": "98765-9876543-2",
  "status": "NTB",
  "consumerId": "NTB-6543-789123",
  "isExisting": false
}
```

#### Get CIF Details
```http
GET /cif/{consumerId}
```

### Product Applications

#### Auto Loan Application
```http
POST /api/autoloan/create
Content-Type: application/json

{
  "application": {
    "consumerId": "ETB-123456",
    "cnic": "12345-1234567-1",
    "customerStatus": "ETB",
    "productType": "autoloan",
    "desiredAmount": 2000000,
    "tenureMonths": 60,
    "purpose": "Vehicle Purchase"
  },
  "personalDetails": {
    "title": "Mr",
    "firstName": "John",
    "lastName": "Doe",
    "cnic": "12345-1234567-1",
    "dateOfBirth": "1990-01-01",
    "gender": "Male",
    "maritalStatus": "Single",
    // ... other personal details
  },
  "currentAddress": {
    "addressType": "current",
    "street": "123 Main Street",
    "city": "Karachi",
    "mobile": "03001234567",
    // ... other address details
  },
  "employmentDetails": {
    "employmentType": "salaried",
    "companyName": "ABC Company",
    "designation": "Software Engineer",
    "basicSalary": 150000,
    "grossSalary": 180000,
    // ... other employment details
  },
  "references": [
    {
      "referenceType": "professional",
      "name": "Reference Name",
      "relation": "Colleague",
      "phone": "03009876543",
      "address": "Reference Address",
      "city": "Karachi",
      "occupation": "Manager"
    }
  ],
  "vehicleDetails": {
    "vehicleType": "car",
    "make": "Honda",
    "model": "Civic",
    "yearOfManufacture": 2023,
    "vehiclePrice": 3500000,
    "downPayment": 1500000,
    "financingAmount": 2000000
  },
  // ... other required sections
}
```

#### Cash Plus Application
```http
POST /api/cashplus/create
Content-Type: application/json
```

#### Credit Card Application
```http
POST /api/creditcard/create
Content-Type: application/json
```

### Application Management

#### Get Application by ID
```http
GET /api/autoloan/{applicationId}
GET /api/cashplus/{applicationId}
GET /api/creditcard/{applicationId}
```

#### List Applications
```http
GET /api/autoloan?page=1&limit=10&status=pending&customerStatus=ETB
GET /api/cashplus?page=1&limit=10
GET /api/creditcard?page=1&limit=10
```

#### Update Application Status
```http
PATCH /api/autoloan/{applicationId}/status
Content-Type: application/json

{
  "status": "approved"
}
```

## 🛡️ Validation

The system uses Zod for comprehensive validation:

- **CNIC Format**: `12345-1234567-1`
- **Phone Format**: `03001234567` or `+923001234567`
- **Email Format**: Standard email validation
- **Date Format**: ISO date strings
- **Amount Limits**: Product-specific minimum/maximum amounts

## 📝 Data Flow

### ETB Customer Flow
1. PB enters CNIC
2. System checks CIF database
3. If found (ETB), auto-populates form fields
4. PB reviews and submits application
5. Data saved to application tables

### NTB Customer Flow
1. PB enters CNIC
2. System creates new consumer ID (NTB-xxx)
3. PB manually fills all form fields
4. Data saved to both CIF and application tables

## 🔧 Development

### Project Structure
```
ILOS-backend/
├── db.js                 # Database connection
├── server.js             # Main server file
├── customerService.js    # Customer-related services
├── schema.sql           # Database schema
├── init-db.js           # Database initialization
├── routes/              # API route handlers
│   ├── autoloan.js
│   ├── cashplus.js
│   ├── creditcard.js
│   └── ...
├── schemas/             # Validation schemas
│   └── validationSchemas.js
└── README.md
```

### Adding New Product Types

1. **Create Product Schema** in `schemas/validationSchemas.js`
2. **Add Database Table** in `schema.sql`
3. **Create Route Handler** in `routes/`
4. **Register Route** in `server.js`

### Environment Variables

Copy `env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://username:password@hostname:port/database_name
PORT=5000
NODE_ENV=development
```

### Scripts

- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm run init-db` - Initialize database with schema
- `npm run setup` - Full setup (install + init-db)

## 🚧 Error Handling

The API returns standardized error responses:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["personalDetails", "firstName"],
      "message": "Required"
    }
  ]
}
```

## 📈 Performance

- Database indexes on frequently queried columns
- Pagination for list endpoints
- Efficient joins for application details
- Connection pooling for database queries

## 🔒 Security

- Input validation with Zod schemas
- SQL injection prevention with parameterized queries
- CORS enabled for frontend integration
- Environment-based configuration

## 🧪 Testing

The system can be tested using tools like Postman or curl. A health check endpoint is available at `/health`.

## 📞 Support

For questions or issues:
1. Check the API documentation above
2. Verify database connection and schema
3. Check server logs for detailed error messages
4. Ensure all required fields are provided in requests

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use secure database credentials
3. Enable SSL for database connections
4. Set up proper logging
5. Configure reverse proxy (nginx)
6. Set up monitoring and health checks

### Docker Deployment (Optional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

This backend provides a robust foundation for the ILOS system with proper data validation, comprehensive API endpoints, and support for multiple product types while handling both ETB and NTB customer flows efficiently. 