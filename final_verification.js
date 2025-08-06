const db = require('./db1');

async function finalVerification() {
  const client = await db.connect();
  try {
    console.log('=== Final verification ===');
    const duplicates = await client.query('SELECT id, COUNT(*) as count FROM ilos_applications GROUP BY id HAVING COUNT(*) > 1 ORDER BY id');
    console.log('Any duplicate IDs:', duplicates.rows);
    
    console.log('\n=== Recent ilos_applications ===');
    const recent = await client.query('SELECT id, los_id, loan_type FROM ilos_applications ORDER BY id DESC LIMIT 8');
    console.log('Recent ilos_applications:');
    recent.rows.forEach(row => console.log(`ID: ${row.id}, LOS_ID: ${row.los_id}, Type: ${row.loan_type}`));
    
    console.log('\n=== Checking recent cashplus applications ===');
    const cashplus = await client.query('SELECT id, first_name, last_name FROM cashplus_applications ORDER BY id DESC LIMIT 8');
    console.log('Recent cashplus applications:');
    cashplus.rows.forEach(row => console.log(`ID: ${row.id}, Name: ${row.first_name} ${row.last_name}`));
    
  } catch(err) {
    console.error('Error:', err);
  } finally {
    client.release();
  }
}

finalVerification();