const express = require('express');
const router = express.Router();

console.log('📍 Minimal applications route loaded');

// Try loading database
console.log('📍 Loading database...');
const db = require('../db1');
console.log('✅ Database loaded successfully');

// Simple test endpoint
router.get('/agents-minimal', (req, res) => {
  console.log('📍 Minimal agents route called');
  res.json({ 
    message: 'Minimal agents route works!', 
    timestamp: new Date().toISOString() 
  });
});

// Database test endpoint
router.get('/agents', async (req, res) => {
  try {
    console.log('🔄 Testing database query...');
    const result = await db.query('SELECT COUNT(*) as count FROM eamvu_agents');
    console.log(`✅ Database query successful: ${result.rows[0].count} agents`);
    
    const agents = await db.query(`
      SELECT 
        agent_id,
        name,
        email,
        phone,
        status,
        location,
        CASE 
          WHEN expertise IS NULL THEN NULL
          ELSE array_to_string(expertise, ', ')
        END as expertise,
        max_concurrent_assignments
      FROM eamvu_agents
      WHERE status = 'active'
      ORDER BY name
    `);
    
    console.log(`✅ Found ${agents.rows.length} active agents`);
    res.json(agents.rows);
    
  } catch (error) {
    console.error('❌ Error in agents route:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch agents', details: error.message });
  }
});

module.exports = router;