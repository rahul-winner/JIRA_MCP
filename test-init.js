#!/usr/bin/env node
/**
 * Test script to verify MCP initialization and notification sequence
 * Tests the exact sequence that Goose uses
 */

const SERVER_URL = process.env.MCP_URL || 'http://localhost:3000/mcp';

async function testFullSequence() {
  console.log(`Testing MCP server at: ${SERVER_URL}\n`);
  
  // Step 1: Initialize
  console.log('Step 1: Sending initialize request...');
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  try {
    const initResponse = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify(initRequest)
    });
    
    if (!initResponse.ok) {
      console.error(`❌ Initialize failed: HTTP ${initResponse.status}`);
      const text = await initResponse.text();
      console.error('Response:', text);
      process.exit(1);
    }
    
    const initData = await initResponse.json();
    console.log('✅ Initialize successful!');
    console.log(JSON.stringify(initData, null, 2));
    
    // Step 2: Send initialized notification (no response expected)
    console.log('\nStep 2: Sending initialized notification...');
    const notificationRequest = {
      jsonrpc: '2.0',
      method: 'notifications/initialized'
      // Note: notifications don't have an 'id' field
    };
    
    const notifResponse = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify(notificationRequest)
    });
    
    if (!notifResponse.ok) {
      console.error(`❌ Notification failed: HTTP ${notifResponse.status}`);
      const text = await notifResponse.text();
      console.error('Response:', text);
      process.exit(1);
    }
    
    console.log('✅ Notification acknowledged!');
    
    // Step 3: List tools
    console.log('\nStep 3: Listing available tools...');
    const listRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };
    
    const listResponse = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify(listRequest)
    });
    
    if (!listResponse.ok) {
      console.error(`❌ Tools list failed: HTTP ${listResponse.status}`);
      const text = await listResponse.text();
      console.error('Response:', text);
      process.exit(1);
    }
    
    const listData = await listResponse.json();
    console.log('✅ Tools list successful!');
    console.log(`Found ${listData.result.tools.length} tools:`);
    listData.result.tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description.substring(0, 60)}...`);
    });
    
    console.log('\n✅ ALL TESTS PASSED! Server is ready for Goose integration.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure the server is running: npm start');
    console.error('2. Check if the port is correct (default: 3000)');
    console.error('3. Try using 127.0.0.1 instead of localhost:');
    console.error('   MCP_URL=http://127.0.0.1:3000/mcp node test-init.js');
    console.error('4. If on VPN, try disconnecting temporarily');
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const healthUrl = SERVER_URL.replace('/mcp', '/health');
    const response = await fetch(healthUrl);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Server is running: ${data.service}\n`);
      return true;
    }
  } catch (error) {
    console.error('❌ Server is not running. Please start it with: npm start');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  await checkServer();
  await testFullSequence();
}

main();
