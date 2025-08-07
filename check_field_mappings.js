const db = require('./db1');

async function checkFieldMappings() {
  try {
    console.log('🔍 Analyzing field mappings between forms and database tables...\n');

    // Define the tables to check
    const tables = [
      'cashplus_applications',
      'autoloan_applications', 
      'smeasaan_applications',
      'commercial_vehicle_applications',
      'ameendrive_applications',
      'platinum_card_applications',
      'creditcard_applications'
    ];

    const results = {};
    
    // Check each table structure
    for (const table of tables) {
      console.log(`📊 Checking ${table} structure...`);
      
      try {
        const result = await db.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [table]);
        
        results[table] = result.rows;
        
        // Find CNIC and name-related fields
        const cnicFields = result.rows.filter(row => 
          row.column_name.toLowerCase().includes('cnic') || 
          row.column_name.toLowerCase().includes('nic') ||
          row.column_name.toLowerCase().includes('id_no')
        );
        
        const nameFields = result.rows.filter(row => 
          row.column_name.toLowerCase().includes('name') || 
          row.column_name.toLowerCase().includes('first_name') ||
          row.column_name.toLowerCase().includes('last_name') ||
          row.column_name.toLowerCase().includes('full_name') ||
          row.column_name.toLowerCase().includes('applicant_name')
        );
        
        console.log(`  ✅ CNIC fields: ${cnicFields.map(f => f.column_name).join(', ') || 'None found'}`);
        console.log(`  ✅ Name fields: ${nameFields.map(f => f.column_name).join(', ') || 'None found'}`);
        
        // Get sample data for these fields
        if (cnicFields.length > 0 || nameFields.length > 0) {
          const sampleFields = [...cnicFields.map(f => f.column_name), ...nameFields.map(f => f.column_name)];
          const sampleQuery = `
            SELECT ${sampleFields.join(', ')}
            FROM ${table}
            ORDER BY created_at DESC
            LIMIT 3
          `;
          
          try {
            const sampleResult = await db.query(sampleQuery);
            console.log(`  📋 Sample data:`);
            sampleResult.rows.forEach((row, index) => {
              console.log(`    Record ${index + 1}:`, row);
            });
          } catch (sampleErr) {
            console.log(`  ❌ Error getting sample data: ${sampleErr.message}`);
          }
        }
        
      } catch (err) {
        console.log(`  ❌ Error checking ${table}: ${err.message}`);
        results[table] = { error: err.message };
      }
      
      console.log('');
    }

    // Now check the backend queries to see how fields are being mapped
    console.log('🔍 Analyzing backend field mappings in queries...\n');
    
    // Check the applications.js queries
    console.log('📋 Backend query mappings:');
    console.log('==========================');
    
    // CashPlus mappings
    console.log('CashPlus:');
    console.log('  - Frontend: first_name, last_name, cnic');
    console.log('  - Backend query: CONCAT(first_name, " ", last_name), cnic');
    console.log('  - Database fields: first_name, last_name, cnic');
    
    // AutoLoan mappings
    console.log('AutoLoan:');
    console.log('  - Frontend: first_name, last_name, cnic');
    console.log('  - Backend query: CONCAT(first_name, " ", last_name), cnic');
    console.log('  - Database fields: first_name, last_name, cnic');
    
    // SME ASAAN mappings
    console.log('SME ASAAN:');
    console.log('  - Frontend: applicant_name, applicant_cnic');
    console.log('  - Backend query: applicant_name, applicant_cnic');
    console.log('  - Database fields: applicant_name, applicant_cnic');
    
    // AmeenDrive mappings
    console.log('AmeenDrive:');
    console.log('  - Frontend: applicant_full_name, applicant_cnic');
    console.log('  - Backend query: applicant_full_name, applicant_cnic');
    console.log('  - Database fields: applicant_full_name, applicant_cnic');
    
    // Credit Card mappings
    console.log('Credit Card:');
    console.log('  - Frontend: full_name, cnic');
    console.log('  - Backend query: full_name, cnic');
    console.log('  - Database fields: full_name, cnic');
    
    // Platinum Card mappings
    console.log('Platinum Card:');
    console.log('  - Frontend: first_name, last_name, nic');
    console.log('  - Backend query: CONCAT(first_name, " ", last_name), nic');
    console.log('  - Database fields: first_name, last_name, nic');

    console.log('\n🔍 Potential Issues Found:');
    console.log('==========================');
    
    // Check for inconsistencies
    const issues = [];
    
    // 1. CNIC field naming inconsistency
    const cnicFieldNames = [];
    tables.forEach(table => {
      if (results[table] && !results[table].error) {
        const cnicFields = results[table].filter(row => 
          row.column_name.toLowerCase().includes('cnic') || 
          row.column_name.toLowerCase().includes('nic')
        );
        cnicFields.forEach(field => {
          cnicFieldNames.push(`${table}.${field.column_name}`);
        });
      }
    });
    
    if (cnicFieldNames.length > 0) {
      console.log('❌ CNIC field naming inconsistencies:');
      cnicFieldNames.forEach(field => console.log(`  - ${field}`));
      issues.push('CNIC field naming inconsistency');
    }
    
    // 2. Name field naming inconsistency
    const nameFieldNames = [];
    tables.forEach(table => {
      if (results[table] && !results[table].error) {
        const nameFields = results[table].filter(row => 
          row.column_name.toLowerCase().includes('name')
        );
        nameFields.forEach(field => {
          nameFieldNames.push(`${table}.${field.column_name}`);
        });
      }
    });
    
    if (nameFieldNames.length > 0) {
      console.log('❌ Name field naming inconsistencies:');
      nameFieldNames.forEach(field => console.log(`  - ${field}`));
      issues.push('Name field naming inconsistency');
    }

    // 3. Check if backend queries match database fields
    console.log('\n🔍 Backend Query vs Database Field Analysis:');
    console.log('============================================');
    
    // Check specific queries from applications.js
    const queryMappings = [
      {
        table: 'cashplus_applications',
        query: 'CONCAT(first_name, " ", last_name)',
        expectedFields: ['first_name', 'last_name'],
        description: 'CashPlus name concatenation'
      },
      {
        table: 'autoloan_applications', 
        query: 'CONCAT(first_name, " ", last_name)',
        expectedFields: ['first_name', 'last_name'],
        description: 'AutoLoan name concatenation'
      },
      {
        table: 'smeasaan_applications',
        query: 'applicant_name',
        expectedFields: ['applicant_name'],
        description: 'SME ASAAN applicant name'
      },
      {
        table: 'ameendrive_applications',
        query: 'applicant_full_name',
        expectedFields: ['applicant_full_name'],
        description: 'AmeenDrive applicant full name'
      },
      {
        table: 'creditcard_applications',
        query: 'full_name',
        expectedFields: ['full_name'],
        description: 'Credit Card full name'
      },
      {
        table: 'platinum_card_applications',
        query: 'CONCAT(first_name, " ", last_name)',
        expectedFields: ['first_name', 'last_name'],
        description: 'Platinum Card name concatenation'
      }
    ];

    queryMappings.forEach(mapping => {
      const tableFields = results[mapping.table];
      if (tableFields && !tableFields.error) {
        const fieldNames = tableFields.map(f => f.column_name);
        const missingFields = mapping.expectedFields.filter(field => !fieldNames.includes(field));
        
        if (missingFields.length > 0) {
          console.log(`❌ ${mapping.description}: Missing fields ${missingFields.join(', ')} in ${mapping.table}`);
          issues.push(`${mapping.description} missing fields`);
        } else {
          console.log(`✅ ${mapping.description}: All fields present in ${mapping.table}`);
        }
      }
    });

    console.log('\n📋 Summary:');
    console.log('===========');
    console.log(`Total tables checked: ${tables.length}`);
    console.log(`Issues found: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log('\n🔧 Recommended fixes:');
      console.log('====================');
      issues.forEach(issue => {
        console.log(`- ${issue}`);
      });
    } else {
      console.log('✅ No field mapping issues found!');
    }

  } catch (error) {
    console.error('❌ Error analyzing field mappings:', error);
  } finally {
    process.exit(0);
  }
}

checkFieldMappings(); 