# Local Development Setup

## Problem: Claude Desktop Uses Published NPM Package

When you run `npx @flowdot.ai/mcp-server`, it downloads the **published version** from npm, not your local development changes.

## Solution: Point to Local Directory

### Option 1: Direct Path (Recommended for Development)

Edit your Claude Desktop config (usually at `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "flowdot-local": {
      "command": "node",
      "args": ["E:\\FlowdotPlatform\\mcp-server\\dist\\index.js"],
      "env": {
        "FLOWDOT_API_TOKEN": "fd_mcp_your_token_here"
      }
    }
  }
}
```

**Important**: After changing config, you must **fully restart Claude Desktop** (not just the conversation).

### Option 2: NPM Link (Global)

```bash
cd E:\FlowdotPlatform\mcp-server
npm link

# Then in Claude Desktop config:
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

## Testing

### 1. Test Locally First

```bash
cd E:\FlowdotPlatform\mcp-server
node test-resources.js
```

This will verify that resources are registered in your local build.

### 2. Test in Claude Desktop

After updating config and restarting Claude Desktop completely:

1. Start a new conversation
2. Try to list MCP resources (this varies by client)
3. You should see learn:// resources available
4. Try reading one: `learn://overview`

## Verification Checklist

- [ ] Built the package: `npm run build`
- [ ] Test script passes: `node test-resources.js`
- [ ] Updated Claude Desktop config to point to local directory
- [ ] **Fully restarted Claude Desktop** (close all windows, restart app)
- [ ] Started a **new conversation** in Claude Desktop
- [ ] Resources are now visible

## Common Issues

### "Resources still don't show up"
- Did you fully restart Claude Desktop (not just refresh)?
- Is the path in config.json correct (use absolute path)?
- Run `node dist/index.js` manually and check for errors

### "Server won't start"
- Check that `FLOWDOT_API_TOKEN` is set correctly
- Verify token starts with `fd_mcp_`
- Check terminal output for error messages

### "Old version still running"
- Make sure you changed from `"npx"` command to `"node"` with direct path
- Check if there are multiple Claude Desktop instances running
