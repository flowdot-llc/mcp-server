/**
 * FlowDot MCP Server
 *
 * Creates and configures the MCP server instance.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { FlowDotApiClient } from './api-client.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/index.js';

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
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const apiClient = new FlowDotApiClient(hubUrl, apiToken, internalSecret);

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
        resources: {},
      },
      instructions: `# FlowDot MCP — Start Here

**READ THIS FIRST.** Before using any FlowDot tool, you should read the FlowDot learning resources. They are **MCP resources** (not tools), so they won't appear in your tool list — you must fetch them explicitly via the MCP resource-read mechanism (URIs below).

## The 10 Learning Resources

FlowDot exposes 10 \`learn://\` resources that explain every major feature of the platform. Each is a complete guide with concepts, tool reference, and worked examples. Read the one that matches the user's task *before* calling tools in that area.

1. **\`learn://overview\`** — High-level overview of all FlowDot components and how they work together. Start here if you don't know where to start.
2. **\`learn://workflows\`** — Complete guide to creating, managing, and executing FlowDot workflows (visual node-and-connection automations). Read before using \`create_workflow\`, \`add_node\`, \`add_connection\`, \`execute_workflow\`, etc.
3. **\`learn://recipes\`** — Complete guide to agent recipes — orchestration workflows for complex automation (agent, parallel, loop, gate, branch, invoke steps). Read before using \`create_recipe\`, \`add_recipe_step\`, \`add_recipe_store\`, \`link_recipe\`, etc.
4. **\`learn://custom-nodes\`** — Complete guide to creating and managing custom nodes (reusable JavaScript nodes with optional LLM calls). Read before using \`create_custom_node\`, \`update_custom_node\`, etc.
5. **\`learn://apps\`** — Complete guide to building multi-file React applications with FlowDot (sandboxed frontends that can invoke workflows). Read before using \`create_app\`, \`create_app_file\`, \`edit_app_code\`, etc.
6. **\`learn://toolkits\`** — Complete guide to creating and managing MCP agent toolkits (extend agents with new tools, credential-scoped). Read before using any \`mcp__flowdot__*toolkit*\` tool.
7. **\`learn://knowledge-base\`** — Complete guide to using the FlowDot knowledge base with RAG (document upload, categories, semantic search). Read before using \`upload_text_document\`, \`query_knowledge_base\`, \`create_knowledge_category\`, etc.
8. **\`learn://email\`** — Complete guide to reading and sending emails via Gmail, Outlook, or IMAP/SMTP integrations. Read before using \`email_search\`, \`email_send\`, \`email_reply\`, \`list_email_integrations\`, etc.
9. **\`learn://comms\`** — Complete guide to notifications and messaging via Telegram, Discord, and other configured channels. Read before using \`send_notification\`, \`list_comms_channels\`, etc.
10. **\`learn://goals\`** — Complete guide to FlowDot Goals — persistent long-running objectives and daemon scheduling. Read before setting up goals, adding tasks, invoking recipes from goals, or configuring the daemon.

## How to Read a Learning Resource

Use your MCP client's resource-read capability on the URI (e.g. \`learn://recipes\`). In Claude this is the \`ReadMcpResourceTool\` — pass \`server: "flowdot"\` and \`uri: "learn://recipes"\`. You can also list all resources via \`ListMcpResourcesTool\` to confirm they're available.

## Rule of Thumb

If the user asks about a FlowDot feature area you haven't touched in this session, **read the matching \`learn://\` resource before calling tools in that area.** These guides are the ground truth and will save you from guessing at schemas, step types, store conventions, and sandbox rules.`,
    }
  );

  // Register tools
  registerTools(server, apiClient);

  // Register learning resources
  registerResources(server);

  console.error('FlowDot MCP Server initialized.');
  console.error('');
  console.error('📚 Learning Resources:');
  console.error('  Use learn:// resources to understand FlowDot concepts before using tools');
  console.error('  Available: learn://overview, learn://workflows, learn://recipes,');
  console.error('            learn://custom-nodes, learn://apps, learn://toolkits, learn://knowledge-base,');
  console.error('            learn://email, learn://comms, learn://goals');
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
