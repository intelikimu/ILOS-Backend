const fs = require('fs');
const path = require('path');
const db = require('./db1');

async function setupEAMVUTables() {
  try {
    console.log('🔄 Setting up EAMVU database tables...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'setup_eamvu_tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await db.query(sqlContent);
    
    console.log('✅ EAMVU tables created successfully!');
    
    // Test the tables by fetching agents
    const agentsResult = await db.query('SELECT * FROM eamvu_agents WHERE status = $1', ['active']);
    console.log(`📋 Found ${agentsResult.rows.length} active agents in database:`);
    agentsResult.rows.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.agent_id}) - ${agent.location}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up EAMVU tables:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

setupEAMVUTables();