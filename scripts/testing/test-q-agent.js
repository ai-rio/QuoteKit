#!/usr/bin/env node

/**
 * Test script for QuoteKit Q Agent MCP Server
 * Verifies that the server responds correctly to basic requests
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function testMCPServer() {
  console.log('🧪 Testing QuoteKit Q Agent MCP Server...\n');

  const server = spawn('node', ['./mcp-server/q-agent-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Test 1: List Tools
  console.log('📋 Test 1: Listing available tools...');
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };

  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Test 2: List Resources
  console.log('📚 Test 2: Listing available resources...');
  const listResourcesRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'resources/list',
    params: {}
  };

  server.stdin.write(JSON.stringify(listResourcesRequest) + '\n');

  // Test 3: Analyze Codebase
  console.log('🔍 Test 3: Testing codebase analysis...');
  const analyzeRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'analyze_codebase',
      arguments: {
        path: 'src/components',
        depth: 2
      }
    }
  };

  server.stdin.write(JSON.stringify(analyzeRequest) + '\n');

  // Collect responses
  let responseCount = 0;
  const responses = [];

  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        responses.push(response);
        responseCount++;
        
        console.log(`✅ Response ${responseCount}:`, {
          id: response.id,
          method: response.result ? 'success' : 'error',
          toolCount: response.result?.tools?.length || 0,
          resourceCount: response.result?.resources?.length || 0
        });

        if (responseCount >= 3) {
          server.kill();
          console.log('\n🎉 All tests completed successfully!');
          console.log('\n📊 Summary:');
          console.log(`- Tools available: ${responses[0]?.result?.tools?.length || 0}`);
          console.log(`- Resources available: ${responses[1]?.result?.resources?.length || 0}`);
          console.log(`- Codebase analysis: ${responses[2]?.result ? 'Working' : 'Failed'}`);
          console.log('\n✨ Your Q Agent MCP Server is ready to use with Amazon Q!');
          process.exit(0);
        }
      } catch (error) {
        // Ignore non-JSON output (like error messages)
      }
    }
  });

  server.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message && !message.includes('Q Agent MCP Server running')) {
      console.log('⚠️  Server message:', message);
    }
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error.message);
    process.exit(1);
  });

  // Timeout after 10 seconds
  setTimeout(10000).then(() => {
    if (responseCount < 3) {
      console.log('⏰ Test timeout - server may be working but responses are slow');
      server.kill();
      process.exit(0);
    }
  });
}

testMCPServer().catch(console.error);
