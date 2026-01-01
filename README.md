# @flowdot.ai/mcp-server

Connect Claude Desktop, Cursor, and other MCP-compatible AI tools to FlowDot workflows.

## What is MCP?

MCP (Model Context Protocol) is an open standard that allows AI models to interact with external tools and services. With the FlowDot MCP Server, you can:

- **List and run workflows** directly from Claude Desktop or Cursor
- **Chat with the FlowDot agent** to discover and execute workflows
- **Check execution status** and get workflow results

## Quick Start

### 1. Get an MCP Token

1. Go to [flowdot.ai](https://flowdot.ai)
2. Navigate to **Settings** > **MCP Tokens**
3. Click **Create New Token**
4. Select the scopes you need:
   - `workflows:read` - List and view workflows
   - `workflows:execute` - Execute workflows
   - `executions:read` - View execution results
   - `agent:chat` - Chat with the FlowDot agent
5. Copy the token (starts with `fd_mcp_`)

### 2. Configure Claude Desktop

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "flowdot": {
      "command": "npx",
      "args": ["@flowdot.ai/mcp-server"],
      "env": {
        "FLOWDOT_API_TOKEN": "fd_mcp_your_token_here"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

After adding the configuration, restart Claude Desktop to load the MCP server.

## Available Tools

### list_workflows

List your FlowDot workflows.

```
You: "What FlowDot workflows do I have?"

Claude: I'll check your FlowDot workflows.

        Found 3 workflow(s):
        - News Summarizer (abc123) - Fetches and summarizes daily news
        - Code Reviewer (def456) - Reviews PRs with AI
        - Content Generator (ghi789) - Creates blog content
```

### execute_workflow

Execute a workflow by ID.

```
You: "Run my News Summarizer workflow"

Claude: I'll execute the News Summarizer workflow.

        Workflow executed successfully.

        Execution ID: exec_123abc
        Status: completed

        Outputs:
        {
          "summary": "Today's top stories: ..."
        }
```

### get_execution_status

Check the status of a running or completed execution.

```
You: "What's the status of execution exec_123abc?"

Claude: Execution Status: Completed
        Execution ID: exec_123abc
        Started: 2024-12-28T10:00:00Z
        Completed: 2024-12-28T10:00:15Z
        Duration: 15.23s
```

### agent_chat

Chat with the FlowDot agent to discover workflows.

```
You: "Ask FlowDot what workflows I have for content creation"

Claude: The FlowDot agent says:

        I found 2 workflows that can help with content creation:

        1. **Content Generator** - Creates blog posts from topics
        2. **Social Media Poster** - Generates and posts to social platforms

        Would you like me to run one of these?
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FLOWDOT_API_TOKEN` | Yes | - | Your MCP token (starts with `fd_mcp_`) |
| `FLOWDOT_HUB_URL` | No | `https://flowdot.ai` | FlowDot Hub URL |

## Configuring Other MCP Clients

### Cursor

Go to **Settings** > **MCP Servers** > **Add Server** and add:

```json
{
  "flowdot": {
    "command": "npx",
    "args": ["@flowdot.ai/mcp-server"],
    "env": {
      "FLOWDOT_API_TOKEN": "fd_mcp_your_token_here"
    }
  }
}
```

### Windsurf

Similar configuration as Cursor - check Windsurf documentation for MCP setup.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
FLOWDOT_API_TOKEN=fd_mcp_xxx npm start
```

## License

MIT
