const db = require('./db1');

async function checkRiskApplications() {
  try {
    console.log('🔍 Checking applications forwarded to Risk...');
    
    // Check applications with risk-related statuses
    const riskApps = await db.query(`
      SELECT los_id, loan_type, status, risk_resolve_comment
      FROM ilos_applications 
      WHERE status IN ('forwarded_to_risk', 'forwarded_to_risk&compliance')
      ORDER BY los_id DESC
    `);
    
    console.log('\n📊 Applications forwarded to RISK:');
    console.log('LOS-ID | STATUS                        | LOAN TYPE              | RISK COMMENT');
    console.log('-------|-------------------------------|------------------------|-------------');
    if (riskApps.rows.length > 0) {
      riskApps.rows.forEach(row => {
        console.log(`${String(row.los_id).padEnd(6)} | ${(row.status || '').padEnd(29)} | ${(row.loan_type || '').padEnd(22)} | ${row.risk_resolve_comment || 'None'}`);
      });
    } else {
      console.log('❌ No applications found with risk-related statuses');
    }
    
    // Check all statuses to see what we have
    console.log('\n📈 All current statuses in database:');
    const allStatuses = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM ilos_applications 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    console.log('STATUS                           | COUNT');
    console.log('---------------------------------|-------');
    allStatuses.rows.forEach(row => {
      console.log(`${(row.status || 'null').padEnd(32)} | ${row.count}`);
    });
    
    // Test what RISK department should see according to rules
    console.log('\n🎯 RISK department visibility rules:');
    console.log('RISK can see statuses: forwarded_to_risk, forwarded_to_risk&compliance');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

checkRiskApplications();