#!/usr/bin/env node
/**
 * Simple test to verify resources module loads and has content
 */

console.log('Testing resources module...\n');

try {
  // Import the compiled resources module
  const { registerResources } = await import('./dist/resources/index.js');

  console.log('✓ Resources module imported successfully');
  console.log('✓ registerResources function exists:', typeof registerResources === 'function');

  // Create a mock server to test registration
  const mockHandlers = new Map();
  const mockServer = {
    setRequestHandler: (schema, handler) => {
      // Extract method value similar to how Server class does it
      const shape = schema.shape || schema._def?.shape?.();
      const methodSchema = shape?.method;

      if (!methodSchema) {
        throw new Error('Schema is missing a method literal');
      }

      // Try v4 format first
      let methodValue = methodSchema._zod?.def?.value ??
                       methodSchema._def?.value ??
                       methodSchema.value;

      if (typeof methodValue !== 'string') {
        throw new Error(`Schema method literal must be a string, got: ${typeof methodValue}`);
      }

      mockHandlers.set(methodValue, handler);
      console.log(`✓ Handler registered for: ${methodValue}`);
    }
  };

  // Call registerResources
  registerResources(mockServer);

  console.log('\n✓ registerResources() called successfully');
  console.log(`✓ Total handlers registered: ${mockHandlers.size}`);

  // Test list handler
  if (mockHandlers.has('resources/list')) {
    const listHandler = mockHandlers.get('resources/list');
    const result = await listHandler({});
    console.log(`\n✓ List handler works! Found ${result.resources.length} resources:`);
    result.resources.forEach(r => {
      console.log(`  • ${r.uri} - ${r.name}`);
    });
  } else {
    console.error('\n❌ ERROR: resources/list handler not registered');
    process.exit(1);
  }

  // Test read handler
  if (mockHandlers.has('resources/read')) {
    const readHandler = mockHandlers.get('resources/read');
    const result = await readHandler({ params: { uri: 'learn://overview' } });
    console.log(`\n✓ Read handler works! Content length: ${result.contents[0].text.length} chars`);
  } else {
    console.error('\n❌ ERROR: resources/read handler not registered');
    process.exit(1);
  }

  console.log('\n✓✓✓ All tests passed! Resources are working correctly. ✓✓✓');
  console.log('\nIf Claude Desktop still cannot see resources:');
  console.log('1. Verify Claude Desktop config points to this local directory');
  console.log('2. Fully restart Claude Desktop (close all windows)');
  console.log('3. Check Claude Desktop logs for MCP server errors');

} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
