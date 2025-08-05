const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require('dotenv').config();

const app = express();
const PORT = 8081;

const LOCAL_ROOT = "C:/Users/Pc/Desktop/Mudassir/ILOS/ILOS-FullStack/ILOS-backend/ilos_loan_application_documents";

// ====== CORS Middleware ======
app.use((req, res, next) => {
  // Allow requests from the frontend
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ====== Multer storage config for dynamic destination ======
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use a temporary directory first, we'll move the file later
        const tempDir = path.join(LOCAL_ROOT, 'temp');
        fs.mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        // Keep original name for temp storage, we'll rename it later
        cb(null, file.originalname);
    }
});
// Add body parser middleware to handle form data BEFORE multer
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const upload = multer({ storage });

// ====== PB Upload API ======
app.post("/upload", upload.single("file"), (req, res) => {
    console.log('🔄 Upload server: Received upload request');
    console.log('🔄 Upload server: Request body:', req.body);
    console.log('🔄 Upload server: Request file:', req.file);
    console.log('🔄 Upload server: Custom name:', req.body.custom_name);
    
    if (!req.file) {
        console.error('❌ Upload server: No file uploaded');
        return res.status(400).json({ error: "No file uploaded." });
    }
    
    // Get loanType and losId from the request body (handle both field name formats)
    const { loanType, losId, loan_type, los_id, custom_name, document_type } = req.body;
    
    // Use either format (camelCase or snake_case)
    const finalLoanType = loanType || loan_type;
    const finalLosId = losId || los_id;
    
    if (!finalLoanType || !finalLosId) {
        console.error('❌ Upload server: Missing required fields');
        console.error('❌ Upload server: Received fields:', req.body);
        // Clean up the temporary file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
            error: "loanType/loan_type and losId/los_id are required",
            received: req.body 
        });
    }
    
    // Create the final destination directory
    const finalDir = path.join(LOCAL_ROOT, finalLoanType, `los-${finalLosId}`);
    fs.mkdirSync(finalDir, { recursive: true });
    
    // Use custom name if provided, otherwise use original filename
    const finalFilename = custom_name || req.file.originalname;
    const finalPath = path.join(finalDir, finalFilename);
    fs.renameSync(req.file.path, finalPath);
    
    console.log('✅ Upload server: File uploaded successfully:', {
        originalname: req.file.originalname,
        customName: custom_name,
        finalFilename: finalFilename,
        path: finalPath,
        size: req.file.size,
        loanType: finalLoanType,
        losId: finalLosId
    });
    
    // Check if this is an API call (has Accept header with application/json) or form submission
    const isApiCall = req.headers.accept && req.headers.accept.includes('application/json');
    
    if (isApiCall) {
        // Return JSON response for API calls
        res.json({
            success: true,
            message: "File uploaded successfully",
            file: {
                name: finalFilename,
                originalName: req.file.originalname,
                size: req.file.size,
                path: finalPath
            },
            folder: `${finalLoanType}/los-${finalLosId}/`
        });
    } else {
        // Return HTML response for form submissions
        res.send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="2;url=/pb-upload" />
                <title>Upload Success</title>
                <style>
                    body { background:#eaf3fb;font-family:Segoe UI,Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0; }
                    .card { background:#fff; padding:32px 40px; border-radius:14px; box-shadow:0 4px 24px 0 rgba(0,55,130,0.09); text-align:center;}
                    h3 { color:#2374ab;}
                    a { color:#1976d2; text-decoration:none; font-weight:600;}
                    a:hover { text-decoration:underline;}
                </style>
            </head>
            <body>
                <div class="card">
                    <h3>✅ Uploaded: ${finalFilename}</h3>
                    <p>Folder: <b>${finalLoanType}/los-${finalLosId}/</b></p>
                    <p>
                        <a href="/pb-upload">Upload Another</a> |
                        <a href="/explorer" target="_blank">Go to Document Explorer &rarr;</a>
                    </p>
                    <small>Redirecting to upload page...</small>
                </div>
            </body>
            </html>
        `);
    }
});

// ====== PB Upload Form (browser UI, blue theme) ======
app.get("/pb-upload", (req, res) => {
    res.send(`
    <html>
    <head>
      <title>PB: Upload Customer Document</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body {
          background: #eaf3fb;
          font-family: 'Segoe UI', Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
        }
        .container {
          background: #fff;
          margin-top: 60px;
          border-radius: 18px;
          box-shadow: 0 8px 32px 0 rgba(0,55,130,0.10);
          padding: 36px 28px 28px 28px;
          width: 100%;
          max-width: 410px;
          text-align: center;
        }
        h2 {
          color: #2374ab;
          margin-bottom: 30px;
          letter-spacing: 1px;
        }
        label {
          display: block;
          margin-bottom: 18px;
          text-align: left;
          font-weight: 500;
          color: #2374ab;
        }
        select, input[type="text"], input[type="file"] {
          width: 100%;
          padding: 8px 12px;
          margin-top: 7px;
          margin-bottom: 18px;
          border-radius: 7px;
          border: 1px solid #bdd7ee;
          background: #f6fbff;
          font-size: 1rem;
          color: #184b74;
        }
        input[type="file"] {
          padding: 5px 2px;
        }
        button {
          background: linear-gradient(90deg, #1976d2 0%, #2196f3 100%);
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 12px 0;
          width: 100%;
          font-size: 1.08rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          box-shadow: 0 2px 8px 0 rgba(25, 118, 210, 0.08);
          transition: background 0.18s;
        }
        button:hover {
          background: linear-gradient(90deg, #1565c0 0%, #1976d2 100%);
        }
        .explorer-link {
          display: inline-block;
          margin-top: 30px;
          color: #1976d2;
          text-decoration: none;
          font-weight: 600;
        }
        .explorer-link:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>PB: Upload Customer Document</h2>
        <form action="/upload" method="post" enctype="multipart/form-data">
          <label>
            Loan Type
                         <select name="loan_type" required>
               <option value="">Select Loan Type...</option>
               <option value="cashplus">Cashplus</option>
               <option value="creditcard">Credit Card</option>
               <option value="autoloan">Auto Loan</option>
               <option value="ameendrive">AmeenDrive</option>
             </select>
           </label>
           <label>
             LOS ID
             <input type="text" name="los_id" required placeholder="e.g. 19 (without LOS- prefix)"/>
          </label>
          <label>
            Select File
            <input type="file" name="file" required />
          </label>
          <button type="submit">Upload Document</button>
        </form>
        <a class="explorer-link" href="/explorer" target="_blank">Go to Document Explorer &rarr;</a>
      </div>
    </body>
    </html>
    `);
});

// ====== Blue Themed Explorer (No extra files, no serve-index) ======
app.get(/^\/explorer(\/.*)?$/, explorerHandler);

// ====== Generic LOS ID Filtered Explorer ======
app.get("/api/documents/:losId", (req, res) => {
    const { losId } = req.params;
    const { applicationType } = req.query;
    
    console.log(`🔍 LOS ID Filtered Explorer request: LOS-${losId}, Type: ${applicationType}`);
    
    if (!losId) {
        return res.status(400).json({ error: "LOS ID is required" });
    }
    
    // Determine the application type path
    let appTypePath = 'temp'; // default
    if (applicationType) {
        switch (applicationType.toLowerCase()) {
            case 'cashplus':
                appTypePath = 'cashplus';
                break;
            case 'autoloan':
                appTypePath = 'AutoLoan';
                break;
            case 'smeasaan':
                appTypePath = 'smeasaan';
                break;
            case 'commercialvehicle':
                appTypePath = 'commercialVehicle';
                break;
            case 'ameendrive':
                appTypePath = 'ameendrive';
                break;
            case 'platinumcreditcard':
            case 'classiccreditcard':
                appTypePath = 'creditcard';
                break;
            default:
                appTypePath = 'temp';
        }
    }
    
    // Build the path to the specific LOS folder
    const losFolderPath = path.join(LOCAL_ROOT, appTypePath, `los-${losId}`);
    console.log(`🔍 Looking for documents in: ${losFolderPath}`);
    
    // Check if the LOS folder exists
    fs.stat(losFolderPath, (err, stats) => {
        if (err || !stats || !stats.isDirectory()) {
            console.log(`❌ LOS folder not found: ${losFolderPath}`);
            return res.json({
                losId: `LOS-${losId}`,
                applicationType: applicationType,
                exists: false,
                documents: [],
                message: `No documents found for LOS-${losId}`
            });
        }
        
        // Read the contents of the LOS folder
        fs.readdir(losFolderPath, { withFileTypes: true }, (err, files) => {
            if (err) {
                console.error(`❌ Error reading LOS folder: ${err.message}`);
                return res.status(500).json({ 
                    error: "Could not read documents folder",
                    details: err.message 
                });
            }
            
            // Filter and format the documents
            const documents = files
                .filter(file => !file.name.startsWith('.')) // Exclude hidden files
                .map(file => {
                    const filePath = path.join(losFolderPath, file.name);
                    const stats = fs.statSync(filePath);
                    
                    return {
                        name: file.name,
                        type: file.isDirectory() ? 'folder' : 'file',
                        size: stats.size,
                        modified: stats.mtime,
                        path: `/explorer/${appTypePath}/los-${losId}/${encodeURIComponent(file.name)}`,
                        downloadUrl: file.isDirectory() ? null : `/explorer/${appTypePath}/los-${losId}/${encodeURIComponent(file.name)}`
                    };
                })
                .sort((a, b) => {
                    // Folders first, then files, alphabetical
                    if (a.type === 'folder' && b.type !== 'folder') return -1;
                    if (a.type !== 'folder' && b.type === 'folder') return 1;
                    return a.name.localeCompare(b.name);
                });
            
            console.log(`✅ Found ${documents.length} documents for LOS-${losId}`);
            
            res.json({
                losId: `LOS-${losId}`,
                applicationType: applicationType,
                exists: true,
                documents: documents,
                folderPath: `${appTypePath}/los-${losId}`,
                message: `Found ${documents.length} documents for LOS-${losId}`
            });
        });
    });
});

// ====== Search for LOS ID across all application types ======
app.get("/api/documents/search/:losId", (req, res) => {
    const { losId } = req.params;
    
    console.log(`🔍 Searching for LOS-${losId} across all application types`);
    
    if (!losId) {
        return res.status(400).json({ error: "LOS ID is required" });
    }
    
    const applicationTypes = [
        'cashplus',
        'AutoLoan', 
        'smeasaan',
        'commercialVehicle',
        'ameendrive',
        'creditcard'
    ];
    
    const results = [];
    
    // Search through each application type
    applicationTypes.forEach(appType => {
        const losFolderPath = path.join(LOCAL_ROOT, appType, `los-${losId}`);
        
        try {
            const stats = fs.statSync(losFolderPath);
            if (stats.isDirectory()) {
                const files = fs.readdirSync(losFolderPath, { withFileTypes: true });
                const documents = files
                    .filter(file => !file.name.startsWith('.'))
                    .map(file => {
                        const filePath = path.join(losFolderPath, file.name);
                        const fileStats = fs.statSync(filePath);
                        
                        return {
                            name: file.name,
                            type: file.isDirectory() ? 'folder' : 'file',
                            size: fileStats.size,
                            modified: fileStats.mtime,
                            path: `/explorer/${appType}/los-${losId}/${encodeURIComponent(file.name)}`,
                            downloadUrl: file.isDirectory() ? null : `/explorer/${appType}/los-${losId}/${encodeURIComponent(file.name)}`
                        };
                    })
                    .sort((a, b) => {
                        if (a.type === 'folder' && b.type !== 'folder') return -1;
                        if (a.type !== 'folder' && b.type === 'folder') return 1;
                        return a.name.localeCompare(b.name);
                    });
                
                results.push({
                    applicationType: appType,
                    exists: true,
                    documents: documents,
                    folderPath: `${appType}/los-${losId}`,
                    documentCount: documents.length
                });
            }
        } catch (err) {
            // Folder doesn't exist for this application type, skip
        }
    });
    
    console.log(`✅ Search results for LOS-${losId}:`, results);
    
    res.json({
        losId: `LOS-${losId}`,
        searchResults: results,
        totalFound: results.length,
        message: `Found documents in ${results.length} application types for LOS-${losId}`
    });
});

function explorerHandler(req, res) {
    // Normalize path
    let reqPath = decodeURIComponent(req.path.replace(/^\/explorer/, "")) || "/";
    let fsPath = path.join(LOCAL_ROOT, reqPath);
    
    console.log(`🔍 Explorer request: ${req.path}`);
    console.log(`🔍 Normalized path: ${reqPath}`);
    console.log(`🔍 File system path: ${fsPath}`);

    fs.stat(fsPath, (err, stats) => {
        if (err || !stats) {
            console.error(`❌ File not found: ${fsPath}`, err);
            res.status(404).send("Folder or file not found.");
            return;
        }

        if (stats.isDirectory()) {
            // List directory
            fs.readdir(fsPath, { withFileTypes: true }, (err, files) => {
                if (err) {
                    res.status(500).send("Could not read folder.");
                    return;
                }

                files.sort((a, b) => {
                    // Folders first, then files, alphabetical
                    if (a.isDirectory() && !b.isDirectory()) return -1;
                    if (!a.isDirectory() && b.isDirectory()) return 1;
                    return a.name.localeCompare(b.name);
                });

                let breadCrumbs = [];
                let parts = reqPath.split("/").filter(Boolean);
                breadCrumbs.push(`<a href="/explorer">Home</a>`);
                let link = "/explorer";
                for (let i = 0; i < parts.length; i++) {
                    link += "/" + encodeURIComponent(parts[i]);
                    breadCrumbs.push(`<a href="${link}">${parts[i]}</a>`);
                }

                res.send(`
                <html>
                <head>
                <title>ILOS Document Explorer</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <style>
                  body {
                    background: #eaf3fb;
                    font-family: 'Segoe UI', Arial, sans-serif;
                    margin:0;padding:0;
                  }
                  .header {
                    background: linear-gradient(90deg, #1976d2 0%, #2196f3 100%);
                    color: #fff;
                    padding: 24px 0 16px 0;
                    text-align: center;
                    border-bottom-left-radius: 22px;
                    border-bottom-right-radius: 22px;
                    box-shadow: 0 3px 12px 0 rgba(30,60,120,0.04);
                  }
                  .header h2 {
                    margin: 0 0 7px 0;
                    font-weight: 600;
                    letter-spacing: 0.7px;
                    font-size: 2.15rem;
                  }
                  .breadcrumbs {
                    margin: 22px 0 0 0;
                    color: #fff;
                    font-size: 1.1rem;
                  }
                  .breadcrumbs a { color: #c3e3fd; text-decoration: none;}
                  .breadcrumbs a:hover {text-decoration:underline;}
                  .explorer-table {
                    background: #fff;
                    margin: 40px auto 0 auto;
                    border-radius: 14px;
                    box-shadow: 0 8px 32px 0 rgba(0,55,130,0.09);
                    width: 96vw; max-width: 880px;
                    border-collapse: separate;
                    border-spacing: 0;
                  }
                  th, td {
                    padding: 13px 18px;
                    text-align: left;
                  }
                  th {
                    background: #1976d2;
                    color: #fff;
                    font-weight: 600;
                    letter-spacing: 0.2px;
                  }
                  tr {
                    border-bottom: 1px solid #e3eefa;
                  }
                  tr:hover {
                    background: #f2f7fc;
                  }
                  td {
                    color: #184b74;
                  }
                  .icon {
                    font-size: 1.15em; margin-right:8px;
                  }
                  .up-link {
                    color: #1565c0; font-weight:500;
                  }
                  .up-link:hover {text-decoration:underline;}
                  .empty-row td { color: #b2b2b2; text-align:center;}
                  .back-upload-link {
                    display: inline-block;
                    margin: 42px 0 12px 0;
                    color: #1976d2;
                    text-decoration: none;
                    font-weight: 600;
                  }
                  .back-upload-link:hover { text-decoration: underline;}
                </style>
                </head>
                <body>
                  <div class="header">
                    <h2>ILOS Document Explorer</h2>
                    <div class="breadcrumbs">
                      ${breadCrumbs.join(" &raquo; ")}
                    </div>
                  </div>
                  <table class="explorer-table">
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Action</th>
                    </tr>
                    ${reqPath !== "/" ? `
                      <tr>
                        <td colspan="3">
                          <a class="up-link" href="${getParentExplorerLink(reqPath)}">&#8592; Up to parent</a>
                        </td>
                      </tr>
                    ` : ""}
                    ${files.length === 0 ? `
                      <tr class="empty-row"><td colspan="3">This folder is empty</td></tr>
                    ` : files.map(f => {
                      const fileUrl = path.join(reqPath, f.name).replace(/\\/g,"/");
                      if (f.isDirectory()) {
                        return `<tr>
                          <td><span class="icon">&#128193;</span><a href="/explorer${encodeURI(fileUrl)}">${f.name}</a></td>
                          <td>Folder</td>
                          <td>-</td>
                        </tr>`;
                      } else {
                        return `<tr>
                          <td><span class="icon">&#128196;</span>${f.name}</td>
                          <td>File</td>
                          <td><a href="/explorer${encodeURI(fileUrl)}" download>Download</a></td>
                        </tr>`;
                      }
                    }).join("")}
                  </table>
                  <div style="text-align:center;">
                    <a class="back-upload-link" href="/pb-upload">&larr; Go to PB Upload Form</a>
                  </div>
                </body>
                </html>
                `);
            });
        } else if (stats.isFile()) {
            // Send file for download/view with proper headers
            const fileName = path.basename(fsPath);
            const ext = path.extname(fileName).toLowerCase();
            
            // Set proper MIME type based on file extension
            let mimeType = 'application/octet-stream';
            if (ext === '.pdf') mimeType = 'application/pdf';
            else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            else if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.txt') mimeType = 'text/plain';
            else if (ext === '.doc' || ext === '.docx') mimeType = 'application/msword';
            else if (ext === '.xls' || ext === '.xlsx') mimeType = 'application/vnd.ms-excel';
            
            console.log(`📁 Serving file: ${fileName} (${mimeType}) from ${fsPath}`);
            
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', mimeType);
            res.sendFile(fsPath, (err) => {
                if (err) {
                    console.error(`❌ Error serving file ${fileName}:`, err);
                    res.status(500).send('Error serving file');
                } else {
                    console.log(`✅ Successfully served file: ${fileName}`);
                }
            });
        } else {
            res.status(404).send("Not a file or folder");
        }
    });
}
app.post("/upload/:loantype/:losid", upload.single("file"), (req, res) => {
    console.log(req.file);
    const { loantype, losid } = req.params;
    
    res.send("File uploaded successfully");
});

function getParentExplorerLink(reqPath) {
    let parts = reqPath.split("/").filter(Boolean);
    if (parts.length === 0) return "/explorer";
    return "/explorer/" + parts.slice(0, -1).join("/");
}

// ====== Home/Health Check ======
app.get("/", (req, res) => res.send(`
    <html>
    <head>
      <title>ILOS Document Server</title>
      <style>
        body { background:#eaf3fb; font-family:Segoe UI,Arial,sans-serif; text-align:center; padding:40px; }
        h2 { color:#2374ab;}
        a { color:#1976d2; text-decoration:none; font-weight:600;}
        a:hover { text-decoration:underline;}
        .links { margin:38px auto; display:inline-block; text-align:left;}
        .links li { margin-bottom:12px;}
      </style>
    </head>
    <body>
      <h2>ILOS Document Server</h2>
      <div class="links">
        <ul>
          <li><a href="/pb-upload">PB: Upload Customer Document (Form)</a></li>
                     <li><b>API:</b> <code>POST /upload</code> (fields: loan_type, los_id, file)</li>
          <li><a href="/explorer" target="_blank">SPU: Read-only File Explorer</a></li>
        </ul>
      </div>
    </body>
    </html>
`));

// ====== Start Server ======
app.listen(PORT, () => {
    console.log(`🟢 PB Upload Form:  http://localhost:${PORT}/pb-upload`);
    console.log(`🟢 File Explorer:   http://localhost:${PORT}/explorer`);
    console.log(`🟢 Upload API:      http://localhost:${PORT}/upload`);
});


