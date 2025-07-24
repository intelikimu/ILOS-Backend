/**
 * Script to set up Platinum Credit Card database tables
 * Run with: node setup-platinum-tables.js
 */

const fs = require('fs');
const path = require('path');
const db = require('./db1'); // Assuming this is the right DB connection module

async function setupTables() {
  try {
    console.log('Setting up Platinum Credit Card database tables...');
    
    // Read SQL from file
    const sqlFilePath = path.join(__dirname, 'platinum_tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Connect to DB
    const client = await db.connect();
    
    try {
      // Execute SQL
      await client.query(sql);
      console.log('Successfully created Platinum Credit Card tables');
    } catch (err) {
      console.error('Error creating tables:', err.message);
      if (err.stack) console.error(err.stack);
    } finally {
      // Release client back to pool
      client.release();
    }
  } catch (err) {
    console.error('Error reading SQL file or connecting to database:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

// Run the setup
setupTables()
  .then(() => console.log('Setup complete'))
  .catch(err => console.error('Setup failed:', err))
  .finally(() => {
    // Exit process only for standalone execution
    if (require.main === module) {
      process.exit(0);
    }
  }); 