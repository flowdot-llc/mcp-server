/**
 * FlowDot MCP Server
 *
 * Creates and configures the MCP server instance.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { FlowDotApiClient } from './api-client.js';
import { registerTools } from './tools/index.js';

const MCP_TOKEN_PREFIX = 'fd_mcp_';

/**
 * Create and configure the FlowDot MCP server.
 */
export async function createServer(): Promise<Server> {
  // Get configuration from environment
  const apiToken = process.env.FLOWDOT_API_TOKEN;
  const hubUrl = process.env.FLOWDOT_HUB_URL || 'https://flowdot.ai';

  // Validate token
  if (!apiToken) {
    console.error('Error: FLOWDOT_API_TOKEN environment variable is required.');
    console.error('');
    console.error('To get a token:');
    console.error('  1. Go to https://flowdot.ai');
    console.error('  2. Navigate to Settings > MCP Tokens');
    console.error('  3. Create a new token with the scopes you need');
    console.error('');
    process.exit(1);
  }

  // Validate token format
  if (!apiToken.startsWith(MCP_TOKEN_PREFIX)) {
    console.error(`Error: Invalid token format. Token must start with "${MCP_TOKEN_PREFIX}".`);
    console.error('');
    console.error('Make sure you are using an MCP token, not a regular API token.');
    console.error('Get an MCP token from Settings > MCP Tokens at https://flowdot.ai');
    console.error('');
    process.exit(1);
  }

  // Create API client
  const apiClient = new FlowDotApiClient(hubUrl, apiToken);

  // Test connection
  console.error(`FlowDot MCP Server connecting to ${hubUrl}...`);
  const connected = await apiClient.testConnection();
  if (!connected) {
    console.error('Warning: Could not verify connection to FlowDot Hub.');
    console.error('The server will start, but some operations may fail.');
    console.error('');
  } else {
    console.error('Connection verified successfully.');
  }

  // Create MCP server with icon
  const server = new Server(
    {
      name: 'flowdot',
      version: '1.0.0',
      title: 'FlowDot',
      description: 'Connect Claude to FlowDot workflows - create, execute, and manage visual automation workflows',
      websiteUrl: 'https://flowdot.ai',
      icons: [
        {
          // FlowDot icon as embedded PNG data URI (universally compatible, no network required)
          src: 'data:image/png;base64,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',
          mimeType: 'image/png',
          sizes: ['32x32'],
        },
      ],
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools
  registerTools(server, apiClient);

  console.error('FlowDot MCP Server initialized.');
  console.error('');
  console.error('Available tool categories:');
  console.error('  • Workflows: Core execution, management, building, validation');
  console.error('  • Custom Nodes: Create, manage, and share custom node types');
  console.error('  • Apps: Build and manage multi-file React applications');
  console.error('  • Agent Toolkits: Create, install, and invoke MCP toolkits');
  console.error('  • Knowledge Base: Upload documents and query with RAG');
  console.error('  • Sharing: Public URLs, shared results, presets, social features');
  console.error('  • Plus: Analytics, discovery, teams, and more');
  console.error('');

  return server;
}

/**
 * Start the MCP server with stdio transport.
 */
export async function startServer(): Promise<void> {
  const server = await createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error('FlowDot MCP Server running on stdio.');
}
