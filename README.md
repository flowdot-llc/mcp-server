# @flowdot.ai/mcp-server

Connect Claude Desktop, Cursor, Windsurf, Claude Code, and any other MCP-compatible AI client to the **entire FlowDot platform** — workflows, recipes, custom nodes, apps, knowledge bases, agent toolkits, and the full community/sharing layer.

## What is MCP?

MCP (Model Context Protocol) is an open standard that lets AI models interact with external tools and services. The FlowDot MCP Server exposes **150 tools across 17 functional categories**, plus **8 educational `learn://` resources**, giving an AI client a complete operational interface to FlowDot — no web UI required.

With this server, an AI client can:

- **Build workflows from scratch** — create graphs, add nodes, wire connections, validate, execute, stream results
- **Author and share custom nodes** — write JavaScript components, validate them with AST parsing, publish to the community
- **Develop FlowDot Apps** — full React multi-file projects with surgical code editing operations
- **Design agent recipes** — multi-step agentic programs with stores, gates, branches, loops, parallel steps, and sub-recipes
- **Manage knowledge bases (RAG)** — categories, documents, uploads, semantic queries
- **Create and invoke agent toolkits** — define new tools, configure OAuth/API-key credentials, install, invoke
- **Set up agent characters for voice calls** — list/get/create/update/delete/fork/duplicate/publish, with server-side voice-config completeness validation
- **Share and discover** — public URLs, voting, comments, favorites, community browsing
- **Run and observe executions** — start, stream via SSE, cancel, retry, view history and metrics

> **Note:** Recipes can be **designed** through MCP but must be **executed** via the FlowDot CLI (`@flowdot.ai/cli`). Recipes are long-running agentic programs that exceed AI client timeouts and require local file/code/shell access.

## Quick Start

### 1. Get an MCP Token

1. Go to [flowdot.ai](https://flowdot.ai)
2. Navigate to **Settings** > **MCP Tokens**
3. Click **Create New Token**
4. Select the scopes you need (see [Token Scopes](#token-scopes) below)
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

## Installation Options

### Option A: Claude Desktop Extension (.mcpb)

Download the `.mcpb` extension bundle and double-click to install in Claude Desktop. The extension includes Node.js runtime and all dependencies — no separate installation needed.

### Option B: npm (Cursor, Claude Code, manual config)

```bash
npx @flowdot.ai/mcp-server
```

Or install globally:

```bash
npm install -g @flowdot.ai/mcp-server
flowdot-mcp
```

## Educational Resources (`learn://`)

The server exposes 8 standalone concept guides via the MCP `ReadResourceRequest` interface. Read these *before* invoking tools to scaffold your understanding:

| Resource | Content |
|----------|---------|
| `learn://overview` | FlowDot platform overview |
| `learn://workflows` | Workflow creation guide |
| `learn://recipes` | Agent recipe orchestration guide |
| `learn://custom-nodes` | Custom node development guide |
| `learn://apps` | App development guide |
| `learn://toolkits` | Agent toolkit guide |
| `learn://knowledge-base` | Knowledge base & RAG guide |
| `learn://characters` | Agent character (voice call) setup guide |

## Available Tools

The server exposes **150 tools** organized into 17 categories.

### Core (4)
- `list_workflows` — List all workflows accessible to the authenticated user
- `execute_workflow` — Execute a workflow with optional inputs (sync or async)
- `get_execution_status` — Get the status and results of a workflow execution
- `agent_chat` — Chat with the FlowDot AI agent for workflow assistance

### Analytics & Feedback (3)
- `get_workflow_metrics` — Impressions, success/failure rates, average duration
- `get_workflow_comments` — Comments and ratings on workflows
- `get_execution_history` — Past execution history with timestamps and status

### Workflow Management (5)
- `get_workflow_details` — Detailed workflow info including nodes, connections, signature
- `get_workflow_inputs_schema` — Input schema with expected types and required fields
- `duplicate_workflow` — Create a copy of an existing workflow
- `toggle_workflow_public` — Make a workflow public or private
- `favorite_workflow` — Add/remove workflow from favorites

### Execution Enhancements (3)
- `cancel_execution` — Cancel running/pending workflow executions
- `retry_execution` — Retry failed executions with the same inputs
- `stream_execution` — Real-time SSE streaming of workflow execution

### Discovery & Search (5)
- `get_workflow_tags` — Get tags associated with a workflow
- `set_workflow_tags` — Set/update workflow tags
- `search_workflows` — Search workflows by name, description, tags
- `search` — Unified search across workflows, apps, custom nodes
- `get_public_workflows` — Browse public workflows shared by other users

### Workflow Building (4)
- `create_workflow` — Create a new empty workflow
- `delete_workflow` — Permanently delete a workflow
- `get_workflow_graph` — Get complete graph structure (all nodes + connections)
- `validate_workflow` — Validate for missing connections, invalid config, disconnected nodes

### Node Operations (5)
- `list_available_nodes` — List all node types organized by category
- `get_node_schema` — Full schema for a node type (inputs, outputs, properties)
- `add_node` — Add new node (built-in or custom via `custom_node_{hash}`)
- `update_node` — Update node position or properties
- `delete_node` — Delete node and all its connections

### Connection Operations (3)
- `add_connection` — Connect a node output to a node input
- `delete_connection` — Remove a connection between two nodes
- `get_node_connections` — Get all connections to/from a specific node

### Custom Nodes (13)
- `list_custom_nodes` — List your custom nodes with search/category filtering
- `search_public_custom_nodes` — Search public nodes shared by the community
- `get_custom_node` — Detailed custom node info (inputs, outputs, script code)
- `get_custom_node_comments` — Comments and ratings on a custom node
- `get_custom_node_template` — Generate a working script template based on I/O definitions
- `create_custom_node` — Create new custom node with script, inputs, outputs (validated with AST parsing)
- `update_custom_node` — Update name, description, code, properties
- `delete_custom_node` — Permanently delete a custom node
- `copy_custom_node` — Copy a public node to your library
- `toggle_custom_node_visibility` — Change visibility (private/public/unlisted)
- `vote_custom_node` — Upvote/downvote/remove vote
- `favorite_custom_node` — Add/remove from favorites
- `add_custom_node_comment` — Add comment or reply

### Apps (23)

#### Core App Operations (12)
- `list_apps` — List your React frontend apps
- `search_apps` — Search the public app marketplace
- `get_app` — Detailed app info including React code and linked workflows
- `create_app` — Create a new React app (Tailwind + React 18, sandboxed)
- `update_app` — Update name, description, code, config, mobile settings
- `delete_app` — Permanently delete app
- `publish_app` — Publish to the public marketplace
- `unpublish_app` — Make a published app private
- `clone_app` — Clone a public app to your library
- `link_app_workflow` — Link a workflow to an app for `invokeWorkflow()` use
- `unlink_app_workflow` — Unlink a workflow from an app
- `get_app_template` — Get starter code templates (basic, chat, dashboard, form-builder, data-viewer)

#### Surgical Code Editing (4)
- `edit_app_code` — Find/replace specific strings in app code
- `append_app_code` — Append content before the closing brace
- `prepend_app_code` — Prepend content to the start
- `insert_app_code` — Insert content after a specific pattern match

#### Multi-File App Operations (7)
- `list_app_files` — List all files in a multi-file app
- `get_app_file` — Get content of a specific file
- `create_app_file` — Create new file (jsx, js, ts, tsx, css, json, md)
- `update_app_file` — Update file content and type
- `delete_app_file` — Delete a file
- `rename_app_file` — Rename or move a file
- `set_app_entry_file` — Set a file as the app's entry point

### Sharing & Public URLs (9)
- `get_workflow_public_url` — Public shareable URL for a workflow
- `list_shared_results` — Shared execution results for a workflow
- `get_shared_result` — Specific shared result with outputs/inputs
- `get_shared_result_comments` — Comments on a shared result
- `create_shared_result` — Create a shareable link (with optional expiry)
- `add_workflow_comment` — Comment on a workflow
- `add_shared_result_comment` — Comment on a shared result
- `vote_workflow` — Upvote/downvote a workflow
- `vote_shared_result` — Upvote/downvote a shared result

### Input Presets (7)
- `list_input_presets` — Pre-configured input sets for a workflow
- `get_input_preset` — Specific preset with all values
- `create_input_preset` — Create a shareable preset
- `update_input_preset` — Update preset description/values
- `delete_input_preset` — Delete a preset
- `vote_input_preset` — Vote on a preset
- `toggle_community_inputs` — Enable/disable community inputs for a workflow

### Teams (1)
- `list_user_teams` — List all teams the user belongs to (with role + member count)

### Knowledge Base / RAG (14)
- `list_knowledge_categories` — Document categories in your knowledge base
- `create_knowledge_category` — New category with name, description, color
- `update_knowledge_category` — Update category properties
- `delete_knowledge_category` — Delete a category (documents become uncategorized)
- `list_knowledge_documents` — Documents with category/team/status filters
- `get_knowledge_document` — Document details by ID/hash
- `upload_text_document` — Upload text content directly
- `upload_document_from_url` — Download and add a document from a URL
- `move_document_to_category` — Move a document or make it uncategorized
- `transfer_document_ownership` — Transfer between personal and team knowledge base
- `reprocess_document` — Reprocess a failed/stuck document
- `delete_knowledge_document` — Permanently delete a document
- `query_knowledge_base` — Semantic + keyword RAG search
- `get_knowledge_storage` — Storage usage and limits

### Agent Toolkits (24)

Agent Toolkits let an AI client *create new tools* through the MCP interface — effectively MCP within MCP. Once installed, toolkit tools become callable via `invoke_toolkit_tool`.

#### Toolkit Management (12)
- `list_agent_toolkits` — Your toolkits
- `search_agent_toolkits` — Search public toolkit marketplace
- `get_agent_toolkit` — Toolkit details (tools, credentials, metadata)
- `get_toolkit_comments` — Comments on a toolkit
- `create_agent_toolkit` — Create a new toolkit with credential requirements
- `update_agent_toolkit` — Update title, description, category, credentials
- `delete_agent_toolkit` — Delete a toolkit
- `copy_agent_toolkit` — Create a private copy of a public toolkit
- `toggle_toolkit_visibility` — Change visibility (private/public/unlisted)
- `vote_toolkit` — Vote on a toolkit
- `favorite_toolkit` — Add/remove from favorites
- `add_toolkit_comment` — Add comment to a toolkit

#### Toolkit Usage & Invocation (12)
- `install_toolkit` — Install a toolkit on your account
- `uninstall_toolkit` — Uninstall
- `list_installed_toolkits` — Installed toolkits with credential status
- `toggle_toolkit_active` — Enable/disable an installation
- `check_toolkit_credentials` — Show which credentials are missing
- `update_toolkit_installation` — Map toolkit credentials to your API keys
- `invoke_toolkit_tool` — Execute a tool from an installed toolkit
- `list_toolkit_tools` — All tools in a toolkit
- `get_toolkit_tool` — Tool details with input/output schemas
- `create_toolkit_tool` — Create an HTTP- or Workflow-backed tool inside a toolkit
- `update_toolkit_tool` — Update tool configuration, schema, endpoint
- `delete_toolkit_tool` — Delete a tool from a toolkit

**Credential types supported:** `api_key`, `oauth` (with PKCE + scopes + refresh tokens), `bearer`, `basic`, `custom`
**Tool types supported:** `http` (REST API), `workflow` (invoke a FlowDot workflow)

### Agent Recipes (19)

Recipes are reusable agentic programs with multiple step types and persistent stores. **MCP can DESIGN recipes; only the CLI can RUN them.**

#### Recipe Core (8)
- `list_recipes` — List recipes (with `favorites_only` filter)
- `get_recipe` — Recipe details with steps, stores, metadata
- `get_recipe_definition` — Full recipe in YAML or JSON format
- `browse_recipes` — Public recipe browsing with pagination/sorting
- `create_recipe` — Create a new agent recipe
- `update_recipe` — Update metadata and `entry_step_id` (critical for execution)
- `delete_recipe` — Delete a recipe
- `fork_recipe` — Create a private copy of a public recipe

#### Step Management (4)
- `list_recipe_steps` — All steps with types, connections, config
- `add_recipe_step` — Add step (`agent`, `parallel`, `loop`, `gate`, `branch`, `invoke`)
- `update_recipe_step` — Update step name, description, config, connections
- `delete_recipe_step` — Delete a step

#### Store Management (4)
- `list_recipe_stores` — Stores (variables) in a recipe
- `add_recipe_store` — Add a store for data flow between steps
- `update_recipe_store` — Update key, label, type, default, I/O flags
- `delete_recipe_store` — Delete a store

#### Engagement (3)
- `link_recipe` — Link recipe for CLI execution with an alias
- `vote_recipe` — Vote on a public recipe
- `favorite_recipe` — Add/remove from favorites

**Step types:** `agent` (LLM with tools), `parallel` (concurrent), `loop` (iterate array), `gate` (approval checkpoint), `branch` (conditional), `invoke` (subroutine), `output` (emit coloured message to terminal)

> **Output step config:** `message` — template string (supports `{{stores.x}}` interpolation), `color` — `green | red | yellow` (default `green`). Executes instantly with no LLM call. Use it to emit progress updates, warnings, or final summaries during long-running recipes.

> To **execute** a recipe, use the FlowDot CLI:
> ```bash
> npx @flowdot.ai/cli recipes run <aliasOrHash> --input '{"key":"value"}'
> ```

### Agent Characters (8)

Voice-call personas — name + persona prompt + complete provider stack (TTS / STT / LLM). The Hub server-side validates voice-config completeness against the same `App\Support\AgentCharacterCompleteness` helper the runtime uses, so every read of a character carries an `is_complete` flag plus a `missing_fields[]` list. Read `learn://characters` for the per-provider settings shapes.

- `list_agent_characters` — List your characters with completeness badges
- `get_agent_character` — Full detail with per-field Completeness section
- `create_agent_character` — Create a new character (rejects with `CHARACTER_VOICE_CONFIG_INCOMPLETE` 422 if any required field is missing)
- `update_agent_character` — Partial update with post-merge completeness validation
- `delete_agent_character` — Hard delete (requires `confirm: true`)
- `fork_agent_character` — Copy a public character; LLM choice resets to default
- `duplicate_agent_character` — Copy your own character including LLM choice
- `toggle_agent_character_public` — Flip public/private (auto-mints stable hash on first publish)

**Required fields:** `voice_provider`, `voice_id`, `tts_model`, `voice_settings`, `stt_provider`, `stt_model`, `llm_provider`, `llm_model`, `llm_temperature`, `personality_prompt`. See `learn://characters` for recommended values per provider.

## Token Scopes

When creating an MCP token in FlowDot Settings, you can select exactly which scopes to grant. Restrict tokens to the minimum scope they need:

| Scope namespace | Tools it covers |
|---|---|
| `workflows:read` | List, search, get, view public workflows |
| `workflows:execute` | Execute workflows |
| `workflows:manage` | Create, update, delete, validate, build workflow graphs |
| `executions:read` | Status, history, stream |
| `executions:manage` | Cancel, retry |
| `agent:chat` | Agent chat |
| `custom_nodes:read` | List, search, get, get template |
| `custom_nodes:manage` | Create, update, delete, copy, toggle visibility, vote, comment |
| `apps:read` | List, search, get apps and files |
| `apps:manage` | Create, update, delete, publish, code editing, file management |
| `recipes:read` | List, get, browse, get definition |
| `recipes:manage` | Create, update, delete, fork, link, manage steps and stores |
| `agent_characters:read` | List and view agent characters (with completeness state) |
| `agent_characters:manage` | Create, edit, delete, fork, duplicate, and publish agent characters |
| `knowledge:read` | List, get, query |
| `knowledge:manage` | Upload, delete, categorize, transfer, reprocess |
| `agent_toolkits:read` | List, search, get toolkits and tools |
| `agent_toolkits:manage` | Create, update, delete, install, invoke |
| `sharing:read` | Get shared results, public URLs |
| `sharing:manage` | Create shared results, vote, comment |
| `input_presets:read` | List, get presets |
| `input_presets:manage` | Create, update, delete |
| `teams:read` | List teams |
| `discovery:read` | Search, tags, public browsing |
| `analytics:read` | Metrics, comments, history |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FLOWDOT_API_TOKEN` | Yes | — | Your MCP token (must start with `fd_mcp_`) |
| `FLOWDOT_HUB_URL` | No | `https://flowdot.ai` | FlowDot Hub URL (override for self-hosted) |
| `INTERNAL_API_SECRET` | No | — | Optional shared secret for internal API calls |

## Configuring Other MCP Clients

### Cursor

**Settings** > **MCP Servers** > **Add Server**:

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

Same configuration as Cursor — see the Windsurf documentation for the exact location of the MCP config file.

### Claude Code

Add to your Claude Code MCP configuration (typically `~/.config/claude-code/mcp.json`):

```json
{
  "mcpServers": {
    "flowdot": {
      "command": "npx",
      "args": ["@flowdot.ai/mcp-server"],
      "env": { "FLOWDOT_API_TOKEN": "fd_mcp_your_token_here" }
    }
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
FLOWDOT_API_TOKEN=fd_mcp_xxx npm start

# Watch mode
npm run dev

# Run tests
npm test

# Coverage report
npm run test:coverage

# Build the .mcpb Claude Desktop extension bundle
npm run build:mcpb
```

## Architecture

The MCP server is a **thin protocol adapter**. All HTTP communication with the FlowDot Hub is delegated to a shared `@flowdot.ai/api` package, which is also used by the FlowDot CLI and daemon. This means the same client logic, authentication, retry semantics, and pagination apply across every FlowDot surface.

### Source Layout

```
mcp-server/
├── bin/
│   └── flowdot-mcp.js          # Executable wrapper
├── src/
│   ├── index.ts                # Entry point
│   ├── server.ts               # createServer() / startServer()
│   ├── api-client.ts           # FlowDotApiClient re-export
│   ├── tools/
│   │   ├── index.ts            # Central registry (one switch case per tool)
│   │   └── *.ts                # 119 individual tool source files
│   └── utils/
│       └── script-validator.ts # AST-based custom node script validation
├── manifest.json               # MCPB Claude Desktop bundle manifest
├── scripts/
│   └── build-mcpb.js           # Builds the .mcpb extension archive
└── package.json
```

### Custom Node Script Validation

User-submitted custom node JavaScript is validated using **`acorn` AST parsing**, not regex. The validator checks:

- Syntax correctness
- Required `processData(inputs, properties, llm)` function exists
- Return statement exists and matches declared output keys exactly
- No top-level return statements
- Security patterns (no `eval`, `process`, `global`, `require`, etc.)
- Best practices (unused inputs, unhandled errors)

The script validator has its own test suite with **100% coverage thresholds** enforced via `vitest.config.ts`.

## License

See `LICENSE`.
