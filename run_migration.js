const db = require('./db1');

async function runMigration() {
  try {
    console.log('🔄 Running migration to add submission flags...');
    
    // Add the boolean columns
    await db.query(`
      ALTER TABLE ilos_applications 
      ADD COLUMN IF NOT EXISTS cops_submitted BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS eavmu_submitted BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Added boolean columns');
    
    // Add comments
    await db.query(`
      COMMENT ON COLUMN ilos_applications.cops_submitted IS 'Flag to track if COPS has already submitted this application'
    `);
    await db.query(`
      COMMENT ON COLUMN ilos_applications.eavmu_submitted IS 'Flag to track if EAMVU has already submitted this application'
    `);
    console.log('✅ Added column comments');
    
    // Update existing records based on status in form tables
    // We'll need to check each form table and update the flags accordingly
    
    const formTables = [
      { table: 'cashplus_applications', loan_type: 'cashplus' },
      { table: 'autoloan_applications', loan_type: 'autoloan' },
      { table: 'smeasaan_applications', loan_type: 'smeasaan' },
      { table: 'commercial_vehicle_applications', loan_type: 'commercial_vehicle' },
      { table: 'ameendrive_applications', loan_type: 'ameendrive' },
      { table: 'platinum_card_applications', loan_type: 'platinum_card' },
      { table: 'creditcard_applications', loan_type: 'creditcard' }
    ];
    
    for (const formTable of formTables) {
      // Update cops_submitted flag
      await db.query(`
        UPDATE ilos_applications 
        SET cops_submitted = true 
        WHERE loan_type = $1 
        AND id IN (
          SELECT id FROM ${formTable.table} 
          WHERE status IN ('submitted_by_cops', 'submitted_to_ciu', 'application_completed')
        )
      `, [formTable.loan_type]);
      
      // Update eavmu_submitted flag
      await db.query(`
        UPDATE ilos_applications 
        SET eavmu_submitted = true 
        WHERE loan_type = $1 
        AND id IN (
          SELECT id FROM ${formTable.table} 
          WHERE status IN ('submitted_by_eavmu', 'submitted_to_ciu', 'application_completed')
        )
      `, [formTable.loan_type]);
      
      console.log(`✅ Updated flags for ${formTable.table}`);
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    process.exit(0);
  }
}

runMigration(); 