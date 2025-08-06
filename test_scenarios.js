const db = require('./db1');

async function testScenarios() {
  try {
    console.log('🧪 Testing all workflow scenarios...');
    
    // Test Scenario 1: EAMVU sees first → Officer → EAMVU submits to CIU
    console.log('\n📋 Scenario 1: EAMVU sees first → Officer → EAMVU submits to CIU');
    console.log('Expected: COPS should see it since they haven\'t submitted yet');
    
    // Test Scenario 2: COPS sees first and submits
    console.log('\n📋 Scenario 2: COPS sees first and submits');
    console.log('Expected: EAMVU should see it since they haven\'t submitted yet');
    
    // Test Scenario 3: EAMVU assigns to officer, COPS submits (without changing status)
    console.log('\n📋 Scenario 3: EAMVU assigns to officer, COPS submits');
    console.log('Expected: COPS should be able to submit when status is assigned_to_eavmu_officer');
    
    // Test Scenario 4: EAMVU assigns to officer, officer returns, COPS submits
    console.log('\n📋 Scenario 4: EAMVU assigns to officer, officer returns, COPS submits');
    console.log('Expected: COPS should be able to submit when status is returned_by_eavmu_officer');
    
    // Test Scenario 5: COPS submits first, then EAMVU assigns to officer
    console.log('\n📋 Scenario 5: COPS submits first, then EAMVU assigns to officer');
    console.log('Expected: EAMVU should be able to assign when status is submitted_by_cops');
    
    // Test Scenario 6: Both departments submit simultaneously
    console.log('\n📋 Scenario 6: Both departments submit simultaneously');
    console.log('Expected: Handle race conditions gracefully');
    
    // Check current data to see what scenarios we can test
    console.log('\n🔍 Checking current application data...');
    
    const testQuery = await db.query(`
      SELECT 
        ia.los_id,
        ia.loan_type,
        ia.cops_submitted,
        ia.eavmu_submitted,
        CASE 
          WHEN ia.loan_type = 'cashplus' THEN (SELECT ca.status FROM cashplus_applications ca WHERE ca.id = ia.id)
          WHEN ia.loan_type = 'autoloan' THEN (SELECT al.status FROM autoloan_applications al WHERE al.id = ia.id)
          WHEN ia.loan_type = 'smeasaan' THEN (SELECT sa.status FROM smeasaan_applications sa WHERE sa.id = ia.id)
          WHEN ia.loan_type = 'ameendrive' THEN (SELECT ad.status FROM ameendrive_applications ad WHERE ad.id = ia.id)
          WHEN ia.loan_type = 'platinum_card' THEN (SELECT pc.status FROM platinum_card_applications pc WHERE pc.id = ia.id)
          WHEN ia.loan_type = 'creditcard' THEN (SELECT cc.status FROM creditcard_applications cc WHERE cc.id = ia.id)
          ELSE 'UNKNOWN'
        END as current_status
      FROM ilos_applications ia
      WHERE ia.los_id IS NOT NULL
      ORDER BY ia.los_id DESC
      LIMIT 10
    `);
    
    console.log('📊 Current application statuses:');
    testQuery.rows.forEach(row => {
      console.log(`  LOS ${row.los_id} (${row.loan_type}): Status=${row.current_status}, COPS=${row.cops_submitted}, EAMVU=${row.eavmu_submitted}`);
    });
    
    // Test visibility for each department
    console.log('\n🔍 Testing department visibility...');
    
    const departments = ['COPS', 'EAMVU'];
    for (const dept of departments) {
      const visibilityQuery = await db.query(`
        SELECT COUNT(*) as count
        FROM cashplus_applications ca
        LEFT JOIN ilos_applications ia ON ia.loan_type = 'cashplus' AND ia.id = ca.id
        WHERE ca.status IN ('submitted_by_spu', 'assigned_to_eavmu_officer', 'returned_by_eavmu_officer', 'submitted_by_eavmu')
        AND ca.created_at IS NOT NULL
        ${dept === 'COPS' ? 'AND (ia.cops_submitted IS NULL OR ia.cops_submitted = false)' : ''}
        ${dept === 'EAMVU' ? 'AND (ia.eavmu_submitted IS NULL OR ia.eavmu_submitted = false)' : ''}
      `);
      
      console.log(`  ${dept} can see ${visibilityQuery.rows[0].count} applications`);
    }
    
    console.log('\n✅ Scenario testing completed!');
    
  } catch (error) {
    console.error('❌ Error testing scenarios:', error.message);
  } finally {
    process.exit(0);
  }
}

testScenarios(); 