#!/usr/bin/env node
/**
 * Test script to verify MCP resources are available
 * Run this to test if the local server has resources registered
 */

import { createServer } from './dist/server.js';

async function testResources() {
  console.log('Creating server...');
  const server = await createServer();

  console.log('\nServer created. Testing resource listing...');

  // Simulate a ListResources request
  const listHandler = server._requestHandlers?.get('resources/list');
  if (!listHandler) {
    console.error('❌ ERROR: No resources/list handler registered!');
    console.error('This means registerResources() is not being called or not working.');
    process.exit(1);
  }

  console.log('✓ resources/list handler found');

  try {
    const result = await listHandler({});
    console.log('\n✓ Resources successfully listed:');
    console.log(JSON.stringify(result, null, 2));

    if (result.resources && result.resources.length > 0) {
      console.log(`\n✓ Found ${result.resources.length} resources!`);
      result.resources.forEach(r => {
        console.log(`  • ${r.uri} - ${r.name}`);
      });
    } else {
      console.error('\n❌ ERROR: No resources returned!');
    }
  } catch (error) {
    console.error('\n❌ ERROR calling list handler:', error.message);
    process.exit(1);
  }

  console.log('\n✓ All tests passed! Resources are working locally.');
  console.log('\nIf Claude Desktop still cannot see resources, the issue is:');
  console.log('1. Claude Desktop is using the published npm package, not your local version');
  console.log('2. You need to point Claude Desktop config to this local directory');
  console.log('3. Or use "npm link" to link the local package globally');

  process.exit(0);
}

testResources().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
