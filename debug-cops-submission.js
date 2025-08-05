const db = require('./db1');

async function debugCOPSSubmission() {
  try {
    console.log('🔄 Debugging COPS submission issue...');
    
    // Reset test application to SUBMITTED_BY_SPU
    await db.query(`
      UPDATE cashplus_applications 
      SET 
        status = 'SUBMITTED_BY_SPU',
        cops_approved = false,
        eamvu_approved = false
      WHERE id = 82
    `);
    
    console.log('✅ Reset test application to SUBMITTED_BY_SPU state');
    
    // Show initial state
    const beforeSubmission = await db.query(`
      SELECT 
        id,
        COALESCE(CONCAT(first_name, ' ', last_name), 'Unknown Applicant') as applicant_name,
        status,
        cops_approved,
        eamvu_approved
      FROM cashplus_applications
      WHERE id = 82
    `);
    
    if (beforeSubmission.rows.length > 0) {
      const app = beforeSubmission.rows[0];
      console.log(`\n📋 Before COPS submission: ${app.applicant_name} (ID: ${app.id})`);
      console.log(`   Status: ${app.status}`);
      console.log(`   COPS Approved: ${app.cops_approved}`);
      console.log(`   EAMVU Approved: ${app.eamvu_approved}`);
    }
    
    console.log('\n🔍 Possible Issues:');
    console.log('   1. Frontend calling wrong endpoint (/update-status instead of /update-status-workflow)');
    console.log('   2. Frontend not sending department="COPS" and action="approve"');
    console.log('   3. Frontend sending hardcoded status="SUBMITTED_TO_CIU"');
    
    console.log('\n✅ Correct API call should be:');
    console.log('   POST /api/applications/update-status-workflow');
    console.log('   {');
    console.log('     "losId": "82",');
    console.log('     "status": "any_value", // Gets overridden by workflow logic');
    console.log('     "applicationType": "CashPlus",');
    console.log('     "department": "COPS",');
    console.log('     "action": "approve"');
    console.log('   }');
    
    console.log('\n❌ Wrong API call (likely what frontend is doing):');
    console.log('   POST /api/applications/update-status');
    console.log('   {');
    console.log('     "losId": "82",');
    console.log('     "status": "SUBMITTED_TO_CIU", // Hardcoded wrong status');
    console.log('     "applicationType": "CashPlus"');
    console.log('   }');
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Check COPS dashboard frontend code');
    console.log('   2. Look for the submit/approve button handler');
    console.log('   3. Ensure it calls /update-status-workflow with correct parameters');
    console.log('   4. Make sure department="COPS" and action="approve"');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugCOPSSubmission();