const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");

async function uploadDocument(localFilePath, remoteFolder, fileNameOnServer) {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
            await client.access({
            host: "127.0.0.1",
            user: "ilos",
            password: "12345",
            port: 21,
            secure: true, // Try using TLS
            secureOptions: { rejectUnauthorized: false }
            
            });


        console.log("🟢 Connected to FTP server");



      

        // Ensure directory exists or create it
        await client.ensureDir(remoteFolder);
        await client.cd(remoteFolder);

        // Upload the file
        await client.uploadFrom(localFilePath, fileNameOnServer);
        console.log(`✅ File uploaded to ${remoteFolder}/${fileNameOnServer}`);
    } catch (err) {
        console.error("❌ FTP upload error:", err);
    }

    client.close();
}

// Example usage
uploadDocument(
    "./schema.sql", // Local file path (must exist)
    "/ilosdocs", // Remote folder on FTP
    "schema.sql" // File name on FTP server
);