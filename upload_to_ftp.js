const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");

/**
 * Upload a document to FTP under /ilosdocs/<los_id>/
 * @param {string} localFilePath - Path to local file
 * @param {string} losId - Unique loan ID or application ID
 * @param {string} fileNameOnServer - Name to save file as on FTP server
 */
async function uploadDocument(localFilePath, losId, fileNameOnServer) {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        await client.access({
            host: "127.0.0.1",
            user: "ilos",
            password: "12345",
            port: 21,
            secure: true,
            secureOptions: {
                rejectUnauthorized: false
            }
        });

        console.log("🟢 Connected to FTP server");

        // Folder: /ilosdocs/<los_id>
        const remoteFolder = `/ilosdocs/${losId}`;

        // Ensure folder exists, move into it
        await client.ensureDir(remoteFolder);
        await client.cd(remoteFolder);

        // Upload file
        await client.uploadFrom(localFilePath, fileNameOnServer);
        console.log(`✅ File uploaded to ${remoteFolder}/${fileNameOnServer}`);
    } catch (err) {
        console.error("❌ FTP upload error:", err);
    } finally {
        client.close();
    }
}

// 🔁 Example usage
const los_id = "LOS-67890";
uploadDocument(
    "./schema.sql",    // Local file path (must exist)
    los_id,            // LOS ID (folder will be /ilosdocs/LOS-67890)
    "schema.sql"       // File name on server
);
