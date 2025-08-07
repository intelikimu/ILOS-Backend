const db = require('./db1');

async function fixExternalTables() {
  try {
    console.log('🔧 Fixing External API Tables...');

    // Drop and recreate SBP Blacklist table with correct schema
    await db.query('DROP TABLE IF EXISTS sbp_blacklist');
    await db.query(`
      CREATE TABLE sbp_blacklist (
        id SERIAL PRIMARY KEY,
        cnic VARCHAR(13) UNIQUE NOT NULL,
        customer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ SBP Blacklist table recreated with correct schema');

    // Drop and recreate ECIB Reports table with correct schema
    await db.query('DROP TABLE IF EXISTS ecib_reports');
    await db.query(`
      CREATE TABLE ecib_reports (
        id SERIAL PRIMARY KEY,
        cnic VARCHAR(13) UNIQUE NOT NULL,
        customer_name VARCHAR(255),
        total_balance_outstanding DECIMAL(15,2),
        report_data JSONB,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ ECIB Reports table recreated with correct schema');

    // Drop and recreate Internal Watchlist table with correct schema
    await db.query('DROP TABLE IF EXISTS internal_watchlist');
    await db.query(`
      CREATE TABLE internal_watchlist (
        id SERIAL PRIMARY KEY,
        id_number VARCHAR(13) UNIQUE NOT NULL,
        name VARCHAR(255),
        action_required VARCHAR(100),
        remarks TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Internal Watchlist table recreated with correct schema');

    // Insert sample data for testing
    console.log('📝 Inserting sample data...');

    // Sample SBP Blacklist data
    await db.query(`
      INSERT INTO sbp_blacklist (cnic, customer) 
      VALUES ('3520111112221', 'Test Customer - Blacklisted')
      ON CONFLICT (cnic) DO NOTHING
    `);

    // Sample ECIB Reports data
    await db.query(`
      INSERT INTO ecib_reports (cnic, customer_name, total_balance_outstanding) 
      VALUES ('3520111112221', 'Test Customer', 150000.00)
      ON CONFLICT (cnic) DO NOTHING
    `);

    // Sample Internal Watchlist data
    await db.query(`
      INSERT INTO internal_watchlist (id_number, name, action_required, remarks) 
      VALUES ('3520111112221', 'Test Person', 'Review Required', 'Suspicious activity detected')
      ON CONFLICT (id_number) DO NOTHING
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

    console.log('✅ External API tables fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing external tables:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run the fix
fixExternalTables()
  .then(() => {
    console.log('🎉 Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  }); 