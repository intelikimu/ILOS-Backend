const db = require('./db1');

async function setupExternalTables() {
  try {
    console.log('🔧 Setting up External API Tables...');

    // Create PEP table
    await db.query(`
      CREATE TABLE IF NOT EXISTS pep (
        id SERIAL PRIMARY KEY,
        cnic VARCHAR(13) UNIQUE NOT NULL,
        name_of_individual_entity VARCHAR(255),
        category VARCHAR(100),
        code VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ PEP table created/verified');

    // Create FRMS table
    await db.query(`
      CREATE TABLE IF NOT EXISTS frms (
        id SERIAL PRIMARY KEY,
        cnic VARCHAR(13) UNIQUE NOT NULL,
        status VARCHAR(50),
        risk_score INTEGER,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ FRMS table created/verified');

    // Create SBP Blacklist table
    await db.query(`
      CREATE TABLE IF NOT EXISTS sbp_blacklist (
        id SERIAL PRIMARY KEY,
        cnic VARCHAR(13) UNIQUE NOT NULL,
        status VARCHAR(50),
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ SBP Blacklist table created/verified');

    // Create ECIB Reports table
    await db.query(`
      CREATE TABLE IF NOT EXISTS ecib_reports (
        id SERIAL PRIMARY KEY,
        cnic VARCHAR(13) UNIQUE NOT NULL,
        report_data JSONB,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ ECIB Reports table created/verified');

    // Create NADRA Verisys table
    await db.query(`
      CREATE TABLE IF NOT EXISTS nadra_verisys (
        id SERIAL PRIMARY KEY,
        cnic VARCHAR(13) UNIQUE NOT NULL,
        verification_status VARCHAR(50),
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ NADRA Verisys table created/verified');

    // Create Internal Watchlist table
    await db.query(`
      CREATE TABLE IF NOT EXISTS internal_watchlist (
        id SERIAL PRIMARY KEY,
        cnic VARCHAR(13) UNIQUE NOT NULL,
        status VARCHAR(50),
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Internal Watchlist table created/verified');

    // Create Consumer Companies List (CCL) table
    await db.query(`
      CREATE TABLE IF NOT EXISTS consumer_companies_list (
        sr_no SERIAL PRIMARY KEY,
        cust_name VARCHAR(255) NOT NULL,
        client_no VARCHAR(50) UNIQUE NOT NULL,
        global_id VARCHAR(50),
        id_type VARCHAR(50),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Consumer Companies List (CCL) table created/verified');

    // Insert some sample data for testing
    console.log('📝 Inserting sample data...');

    // Sample PEP data
    await db.query(`
      INSERT INTO pep (cnic, name_of_individual_entity, category, code) 
      VALUES ('3520111112221', 'Test Person', 'PEP', 'PEP001')
      ON CONFLICT (cnic) DO NOTHING
    `);

    // Sample FRMS data
    await db.query(`
      INSERT INTO frms (cnic, status, risk_score, remarks) 
      VALUES ('3520111112221', 'High Risk', 85, 'Suspicious activity detected')
      ON CONFLICT (cnic) DO NOTHING
    `);

    console.log('✅ Sample data inserted');

    // Verify tables exist
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('pep', 'frms', 'sbp_blacklist', 'ecib_reports', 'nadra_verisys', 'internal_watchlist')
      ORDER BY table_name
    `);

    console.log('📊 External API tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('✅ External API tables setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up external tables:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run the setup
setupExternalTables()
  .then(() => {
    console.log('🎉 Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }); 