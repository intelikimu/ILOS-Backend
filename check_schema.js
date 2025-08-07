const db = require('./db1');

async function checkSchema() {
  try {
    console.log('🔍 Checking ilos_applications table structure...');
    
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ilos_applications' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 ILOS_Applications table structure:');
    console.log('=====================================');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${row.column_default ? `default: ${row.column_default}` : ''}`);
    });
    
    // Check if boolean columns exist
    const boolColumns = result.rows.filter(row => 
      row.column_name === 'cops_submitted' || row.column_name === 'eavmu_submitted'
    );
    
    console.log('\n🔍 Boolean flag columns:');
    console.log('========================');
    if (boolColumns.length > 0) {
      boolColumns.forEach(col => {
        console.log(`✅ ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('❌ No boolean flag columns found (cops_submitted, eavmu_submitted)');
    }
    
    // Check sample data to see current values
    console.log('\n📋 Sample data from ilos_applications:');
    console.log('=====================================');
    const sampleResult = await db.query(`
      SELECT los_id, loan_type, cops_submitted, eavmu_submitted, risk_resolve_comment, compliance_resolve_comment 
      FROM ilos_applications 
      ORDER BY los_id DESC 
      LIMIT 5;
    `);
    
    if (sampleResult.rows.length > 0) {
      console.log('LOS_ID | LOAN_TYPE | COPS_SUBMITTED | EAVMU_SUBMITTED | RISK_COMMENT | COMPLIANCE_COMMENT');
      console.log('-------|-----------|----------------|----------------|--------------|-------------------');
      sampleResult.rows.forEach(row => {
        console.log(`${row.los_id} | ${row.loan_type || 'null'} | ${row.cops_submitted || 'null'} | ${row.eavmu_submitted || 'null'} | ${row.risk_resolve_comment ? 'Yes' : 'No'} | ${row.compliance_resolve_comment ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('No data found in ilos_applications table');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    process.exit(1);
  }
}

checkSchema();