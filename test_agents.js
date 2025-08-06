const db = require('./db1');

async function testAgents() {
  try {
    console.log('🔄 Testing EAMVU agents query...');
    
    // Test basic table existence
    console.log('1. Testing table existence...');
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'eamvu_agents'
      );
    `);
    console.log('   eamvu_agents table exists:', tableCheck.rows[0].exists);
    
    // Test basic select
    console.log('2. Testing basic select...');
    const basicResult = await db.query('SELECT COUNT(*) FROM eamvu_agents');
    console.log('   Total agents:', basicResult.rows[0].count);
    
    // Test the exact query from the backend
    console.log('3. Testing exact backend query...');
    const result = await db.query(`
      SELECT 
        ea.agent_id,
        ea.name,
        ea.email,
        ea.phone,
        ea.status,
        ea.location,
        ea.expertise,
        ea.max_concurrent_assignments,
        COALESCE(
          (SELECT COUNT(*) FROM agent_assignments WHERE agent_id = ea.agent_id AND status = 'active'), 
          0
        ) as assigned_applications
      FROM eamvu_agents ea
      WHERE ea.status = 'active'
      ORDER BY ea.name
    `);
    
    console.log(`✅ Query successful! Found ${result.rows.length} agents:`);
    result.rows.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.agent_id}) - Status: ${agent.status}`);
      console.log(`     Email: ${agent.email}, Phone: ${agent.phone}`);
      console.log(`     Location: ${agent.location}, Max assignments: ${agent.max_concurrent_assignments}`);
      console.log(`     Expertise: ${agent.expertise}, Current assignments: ${agent.assigned_applications}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error testing agents:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

testAgents();