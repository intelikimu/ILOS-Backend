const db = require('./db1');

async function fixAutoLoanNames() {
  try {
    console.log('🔧 Fixing AutoLoan applications with NULL names...\n');

    // First, let's see what data we have
    const nullNamesResult = await db.query(`
      SELECT 
        id,
        first_name,
        last_name,
        applicant_cnic,
        company_name,
        created_at
      FROM autoloan_applications 
      WHERE (first_name IS NULL OR last_name IS NULL OR (first_name = '' AND last_name = ''))
      ORDER BY created_at DESC
    `);

    console.log(`📊 Found ${nullNamesResult.rows.length} AutoLoan applications with NULL/empty names`);

    if (nullNamesResult.rows.length === 0) {
      console.log('✅ No AutoLoan applications with NULL names found');
      return;
    }

    // Show sample of problematic records
    console.log('\n📋 Sample records with NULL names:');
    nullNamesResult.rows.slice(0, 5).forEach((row, index) => {
      console.log(`  Record ${index + 1}: ID=${row.id}, first_name="${row.first_name}", last_name="${row.last_name}", cnic="${row.applicant_cnic}", company="${row.company_name}"`);
    });

    // Fix the names based on available data
    let fixedCount = 0;
    let skippedCount = 0;

    for (const record of nullNamesResult.rows) {
      let firstName = record.first_name;
      let lastName = record.last_name;

      // If both names are NULL/empty, try to extract from company_name
      if ((!firstName || firstName.trim() === '') && (!lastName || lastName.trim() === '')) {
        if (record.company_name && record.company_name.trim() !== '') {
          // Try to extract name from company_name
          const companyName = record.company_name.trim();
          
          // If company_name looks like a person's name (contains spaces and reasonable length)
          if (companyName.includes(' ') && companyName.length > 3 && companyName.length < 50) {
            const nameParts = companyName.split(' ');
            if (nameParts.length >= 2) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ');
              console.log(`  🔧 Extracted name from company_name: "${firstName}" "${lastName}" for ID ${record.id}`);
            }
          } else {
            // Set default names based on CNIC or use generic names
            firstName = 'AutoLoan';
            lastName = `Applicant-${record.id}`;
            console.log(`  🔧 Set default name: "${firstName}" "${lastName}" for ID ${record.id}`);
          }
        } else {
          // No company_name either, set generic names
          firstName = 'AutoLoan';
          lastName = `Applicant-${record.id}`;
          console.log(`  🔧 Set generic name: "${firstName}" "${lastName}" for ID ${record.id}`);
        }
      } else {
        // One of the names is present, fill the missing one
        if (!firstName || firstName.trim() === '') {
          firstName = 'AutoLoan';
          console.log(`  🔧 Filled missing first_name: "${firstName}" for ID ${record.id}`);
        }
        if (!lastName || lastName.trim() === '') {
          lastName = `Applicant-${record.id}`;
          console.log(`  🔧 Filled missing last_name: "${lastName}" for ID ${record.id}`);
        }
      }

      // Update the record
      try {
        await db.query(`
          UPDATE autoloan_applications 
          SET first_name = $1, last_name = $2
          WHERE id = $3
        `, [firstName, lastName, record.id]);
        
        fixedCount++;
        console.log(`  ✅ Updated ID ${record.id}: "${firstName}" "${lastName}"`);
      } catch (error) {
        console.error(`  ❌ Error updating ID ${record.id}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Total records processed: ${nullNamesResult.rows.length}`);
    console.log(`  Successfully fixed: ${fixedCount}`);
    console.log(`  Skipped due to errors: ${skippedCount}`);

    // Verify the fix
    const verifyResult = await db.query(`
      SELECT COUNT(*) as count
      FROM autoloan_applications 
      WHERE (first_name IS NULL OR last_name IS NULL OR (first_name = '' AND last_name = ''))
    `);

    const remainingNullNames = verifyResult.rows[0].count;
    console.log(`  Remaining records with NULL names: ${remainingNullNames}`);

    if (remainingNullNames === 0) {
      console.log('✅ All AutoLoan applications now have valid names!');
    } else {
      console.log(`⚠️  ${remainingNullNames} records still have NULL names`);
    }

  } catch (error) {
    console.error('❌ Error fixing AutoLoan names:', error);
  } finally {
    process.exit(0);
  }
}

fixAutoLoanNames(); 