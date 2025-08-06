const db = require('./db1');

async function checkTableStructure() {
  try {
    console.log('🔍 Checking ilos_applications table structure...');
    
    // Check if table exists
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ilos_applications'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Table ilos_applications does not exist');
      return;
    }
    
    // Get column information
    const columns = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ilos_applications'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Table structure:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Check if status column exists
    const statusColumn = columns.rows.find(col => col.column_name === 'status');
    if (statusColumn) {
      console.log('✅ Status column exists');
      
      // Get distinct status values
      const statusValues = await db.query(`
        SELECT DISTINCT status, COUNT(*) as count
        FROM ilos_applications
        WHERE status IS NOT NULL
        GROUP BY status
        ORDER BY status;
      `);
      
      console.log('📊 Current status values:');
      statusValues.rows.forEach(row => {
        console.log(`  - ${row.status}: ${row.count} records`);
      });
    } else {
      console.log('❌ Status column does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTableStructure(); 