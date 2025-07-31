# ILOS FileZilla Document Management System

This is a FileZilla-based document management system for the ILOS loan application platform.

## Features

- **File Upload**: Upload documents with loan type and LOS ID organization
- **Document Explorer**: Web-based file browser for uploaded documents
- **Upload Form**: Simple HTML form for document uploads
- **API Integration**: RESTful API for programmatic uploads

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
# Option 1: Using Node.js directly
node uploadtoftp.js

# Option 2: Using the batch file (Windows)
start-server.bat
```

### 3. Access the Services
- **Upload Form**: http://localhost:8081/pb-upload
- **Document Explorer**: http://localhost:8081/explorer
- **Upload API**: http://localhost:8081/upload

## API Usage

### Upload Document
```bash
POST http://localhost:8081/upload
Content-Type: multipart/form-data

Form fields:
- file: The document file
- loanType: Type of loan (cashplus, creditcard, autoloan, etc.)
- losId: LOS ID for the application
```

### Example using curl
```bash
curl -X POST http://localhost:8081/upload \
  -F "file=@document.pdf" \
  -F "loanType=cashplus" \
  -F "losId=LOS-12345"
```

## File Organization

Documents are automatically organized in the following structure:
```
ilos_loan_application_documents/
├── cashplus/
│   ├── LOS-12345/
│   │   ├── document1.pdf
│   │   └── document2.jpg
│   └── LOS-67890/
│       └── application.pdf
├── creditcard/
│   └── LOS-11111/
│       └── credit_card_app.pdf
└── autoloan/
    └── LOS-99999/
        └── auto_loan_doc.pdf
```

## Frontend Integration

The frontend React application integrates with this server through the `/api/upload-document` route, which forwards requests to `http://localhost:8081/upload`.

### Frontend Features
- Real-time server status monitoring
- Upload progress indicators
- Drag & drop file upload
- File type and size validation
- Direct links to Document Explorer and Upload Form

## Configuration

### Change Document Storage Location
Edit the `LOCAL_ROOT` variable in `uploadtoftp.js`:
```javascript
const LOCAL_ROOT = "C:/path/to/your/documents/folder";
```

### Change Server Port
Edit the `PORT` variable in `uploadtoftp.js`:
```javascript
const PORT = 8081; // Change to your preferred port
```

## Supported File Types
- PDF documents (.pdf)
- Word documents (.doc, .docx)
- Images (.jpg, .jpeg, .png)
- Maximum file size: 10MB

## Security Notes
- The server runs on localhost only
- File uploads are validated for type and size
- Documents are organized by loan type and LOS ID for security
- The explorer is read-only for security

## Troubleshooting

### Server won't start
1. Check if port 8081 is already in use
2. Ensure all dependencies are installed: `npm install`
3. Check file permissions for the document storage directory

### Uploads failing
1. Verify the server is running on port 8081
2. Check the browser console for error messages
3. Ensure the document storage directory exists and is writable

### Frontend can't connect
1. Verify the FileZilla server is running
2. Check that the frontend is calling the correct API endpoint
3. Ensure CORS is properly configured if needed 