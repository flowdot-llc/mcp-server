/**
 * MCP Resources Registry
 *
 * Provides learning resources that agents can read to understand FlowDot concepts.
 * These are designed to be the FIRST thing agents check when asked about FlowDot features.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Learning resources for FlowDot system components.
 * Use URI format: learn://component-name
 *
 * Exported so the manifest emitter (scripts/emit-manifest.ts) can serialize
 * these guides into the Hub's resources/mcp/learn-resources.json, keeping the
 * remote (OAuth) connector's `learn://` resources in sync with this single
 * source of truth.
 */
export const LEARN_RESOURCES = {
  'learn://overview': {
    name: 'FlowDot Platform Overview',
    description: 'High-level overview of all FlowDot components and how they work together',
    mimeType: 'text/markdown',
    content: `# FlowDot Platform Overview

## What is FlowDot?

FlowDot is a visual workflow automation platform that lets you build, execute, and share automation workflows. It combines visual programming with AI-powered agents, custom nodes, and knowledge bases.

## Core Components

### 1. **Workflows**
Visual automation workflows with nodes and connections.
- **Learn more:** \`learn://workflows\`
- **Quick start:** Use \`list_workflows\` to see your workflows

### 2. **Recipes**
Agent orchestration workflows for complex automation.
- **Learn more:** \`learn://recipes\`
- **Quick start:** Use \`list_recipes\` to see your recipes

### 3. **Custom Nodes**
Reusable JavaScript nodes you can create and share.
- **Learn more:** \`learn://custom-nodes\`
- **Quick start:** Use \`list_custom_nodes\` to see available nodes

### 4. **Apps**
React frontend applications that can invoke workflows.
- **Learn more:** \`learn://apps\`
- **Quick start:** Use \`list_apps\` to see your apps

### 5. **Agent Toolkits**
MCP toolkits for extending AI agents with new capabilities.
- **Learn more:** \`learn://toolkits\`
- **Quick start:** Use \`mcp__flowdot__list_agent_toolkits\`

### 6. **Knowledge Base**
Document storage and RAG-powered search.
- **Learn more:** \`learn://knowledge-base\`
- **Quick start:** Use \`list_knowledge_documents\`

### 7. **Email**
Read and send emails via connected Gmail, Outlook, or IMAP/SMTP integrations.
- **Learn more:** \`learn://email\`
- **Quick start:** Use \`list_email_integrations\` then \`email_search\`

### 8. **Comms (Notifications & Messaging)**
Send notifications and read messages via Telegram, Discord, and other configured channels.
- **Learn more:** \`learn://comms\`
- **Quick start:** Use \`list_comms_channels\` then \`send_notification\`

### 9. **Goals & Daemon**
Persistent, long-running objectives executed locally by flowdot-cli or flowdot-daemon. Goals run tasks (research, code, notify, recipe, execute, loop, toolkit) on a schedule or on demand.
- **Learn more:** \`learn://goals\`
- **Quick start:** Use \`flowdot goals create "<name>"\` then \`flowdot goals run <hash>\`

### 10. **Agent Characters (Voice Calls)**
Voice-call personas with persona prompt + TTS + STT + LLM config. Required for the FlowDot voice-call feature.
- **Learn more:** \`learn://characters\`
- **Quick start:** Use \`list_agent_characters\` to see which are ready to call, \`get_agent_character\` to confirm one's config, \`update_agent_character\` to fill missing fields.

### 11. **User Profile**
View your account info and active token details.
- **Quick start:** Use \`whoami\`

### 12. **Images & Vision**
Generate images, edit images, and analyze images (vision) — via workflow nodes, the aggregator API, or BYOK image toolkits. Provider-agnostic, no fallback.
- **Learn more:** \`learn://images\`
- **Quick start:** Read \`learn://images\`, then use an \`image_manipulation\` node or a BYOK image toolkit

## Common Workflows

### Creating a Simple Workflow
1. \`create_workflow\` - Create empty workflow
2. \`list_available_nodes\` - See what nodes you can add
3. \`add_node\` - Add nodes to your workflow
4. \`add_connection\` - Connect nodes together
5. \`execute_workflow\` - Run the workflow

### Creating a Recipe
1. \`create_recipe\` - Create empty recipe
2. \`add_recipe_store\` - Define inputs/outputs
3. \`add_recipe_step\` - Add agent, loop, gate, or other steps
4. \`update_recipe_step\` - Connect steps via "next"
5. \`update_recipe\` - Set entry_step_id
6. \`link_recipe\` - Create CLI alias
7. Run via CLI: \`npx flowdot recipes run <alias>\`

### Rolling Back a Recipe Edit
Every recipe edit you make is automatically snapshotted (last 20 retained, coalesced within a 60-second window). Tools: \`list_recipe_versions\`, \`get_recipe_version\`, \`checkpoint_recipe\`, \`restore_recipe_version\`. Before any non-trivial recipe rewrite, drop a \`checkpoint_recipe(hash, label: "...")\` first. See \`learn://recipes\` → "Versioning & Undo" for the full guide.

## Where to Start

- **New to FlowDot?** Read \`learn://workflows\` first
- **Building agents?** Read \`learn://recipes\` first
- **Extending functionality?** Read \`learn://custom-nodes\` or \`learn://toolkits\`
- **Building UIs?** Read \`learn://apps\` first
- **Reading/sending email?** Read \`learn://email\` first
- **Sending notifications?** Read \`learn://comms\` first
- **Setting up autonomous goals or scheduled tasks?** Read \`learn://goals\` first
- **Setting up a voice-call character?** Read \`learn://characters\` first
- **Generating, editing, or analyzing images?** Read \`learn://images\` first

## Getting Help

- Each \`learn://\` resource has detailed examples
- Tool descriptions include usage examples
- Visit https://flowdot.ai for web interface
`,
  },

  'learn://workflows': {
    name: 'Workflows Complete Guide',
    description: 'Complete guide to creating, managing, and executing FlowDot workflows',
    mimeType: 'text/markdown',
    content: `# FlowDot Workflows - Complete Guide

## What Are Workflows?

Workflows are visual automation workflows composed of **nodes** (processing units) and **connections** (data flow). Think of them like a flowchart where each box does something and arrows show how data moves between them.

## Key Concepts

### Nodes
Processing units that perform actions:
- **Input nodes:** Receive data from workflow inputs
- **Processing nodes:** Transform, analyze, or manipulate data
- **Output nodes:** Return results
- **LLM nodes:** AI-powered processing
- **Custom nodes:** Your own JavaScript logic

### Connections
Data flows between nodes via **sockets**:
- **Output sockets:** Where a node sends data
- **Input sockets:** Where a node receives data
- Connect output socket → input socket to flow data

### Execution
When you execute a workflow:
1. Provide input values via \`inputs\` parameter
2. Workflow processes nodes in dependency order
3. Results are returned with output node data

## Building a Workflow

### Step 1: Create Workflow
\`\`\`javascript
// Create empty workflow
create_workflow({
  name: "My First Workflow",
  description: "Processes text with AI"
})
// Returns: { id: "abc123", ... }
\`\`\`

### Step 2: See Available Nodes
\`\`\`javascript
list_available_nodes()
// Returns categories and node types
\`\`\`

Common node types:
- \`TextInput\` - Accept text input
- \`LLMNode\` - AI processing
- \`TextOutput\` - Return text result
- \`HTTPRequest\` - API calls
- \`custom_node_xxx\` - Custom nodes

### Step 3: Add Nodes
\`\`\`javascript
// Add input node
add_node({
  workflow_id: "abc123",
  node_type: "TextInput",
  position: { x: 100, y: 100 },
  properties: {
    label: "User Input",
    inputName: "user_text"
  }
})
// Returns: { id: "node-1", ... }

// Add LLM processing node
add_node({
  workflow_id: "abc123",
  node_type: "LLMNode",
  position: { x: 300, y: 100 },
  properties: {
    prompt: "Summarize: {{text}}",
    model: "claude-haiku-4.5"
  }
})
// Returns: { id: "node-2", ... }

// Add output node
add_node({
  workflow_id: "abc123",
  node_type: "TextOutput",
  position: { x: 500, y: 100 }
})
// Returns: { id: "node-3", ... }
\`\`\`

### Step 4: Connect Nodes
\`\`\`javascript
// Connect input → LLM
add_connection({
  workflow_id: "abc123",
  source_node_id: "node-1",
  source_socket_id: "text",
  target_node_id: "node-2",
  target_socket_id: "text"
})

// Connect LLM → output
add_connection({
  workflow_id: "abc123",
  source_node_id: "node-2",
  source_socket_id: "response",
  target_node_id: "node-3",
  target_socket_id: "Consolidated Text"
})
\`\`\`

### Step 5: Execute
\`\`\`javascript
execute_workflow({
  workflow_id: "abc123",
  inputs: {
    user_text: "Long text to summarize..."
  }
})
// Returns execution results
\`\`\`

## Sync vs Async Execution

\`execute_workflow\` supports two modes:

| Mode | When To Use | Behavior |
|------|-------------|----------|
| **Sync** (default for fast workflows) | Quick workflows (<30s) where you need the result immediately | Call blocks until the workflow completes; result returned in the same response |
| **Async** | Long-running workflows, parallel work, fire-and-forget | Returns an \`execution_id\` immediately; poll \`get_execution_status\` or use \`stream_execution\` for real-time updates |

\`\`\`javascript
// Async pattern
const { execution_id } = await execute_workflow({
  workflow_id: "abc123",
  inputs: { /* ... */ },
  wait_for_completion: false   // Async mode
});

// Then poll
const status = await get_execution_status({ execution_id });

// Or stream events in real time
const stream = await stream_execution({ execution_id });
\`\`\`

**Why this matters:** AI clients have request timeouts (often 30-60 seconds). Sync mode will fail on workflows that exceed those limits. For any workflow involving multiple LLM calls, large file processing, or external API chains, **default to async**.

## Data Flow & Type Handling

Data flows from one node's output socket to another node's input socket. A few rules to remember when designing workflows:

- **Socket types must be compatible.** Connecting a number socket to a string socket will either fail validation or trigger an automatic coercion. Run \`validate_workflow\` to surface mismatches before execution.
- **Output socket names matter.** When you connect with \`add_connection\`, the \`source_socket_id\` and \`target_socket_id\` must match exact socket names from each node's schema. Use \`get_node_schema\` to see them.
- **Null/undefined propagation.** If an upstream node fails or produces no value, downstream nodes receive null. Design nodes to handle nulls gracefully or use a validator node early in the chain.
- **One source can fan out.** A single output socket can connect to multiple downstream input sockets — you don't need to duplicate the upstream node.
- **Convergence requires explicit merging.** If multiple nodes feed into one downstream node, that downstream node needs an input socket that accepts multiple sources, OR you need an explicit merge/join node.

## Advanced Features

### Getting Workflow Structure
\`\`\`javascript
// See all nodes and connections
get_workflow_graph({ workflow_id: "abc123" })

// Get input requirements
get_workflow_inputs_schema({ workflow_id: "abc123" })

// Validate workflow
validate_workflow({ workflow_id: "abc123" })
\`\`\`

### Managing Workflows
\`\`\`javascript
// List your workflows
list_workflows()

// Search workflows
search_workflows({ query: "summarize" })

// Duplicate a workflow
duplicate_workflow({ workflow_id: "abc123", name: "Copy of My Workflow" })

// Make workflow public
toggle_workflow_public({ workflow_id: "abc123", is_public: true })

// Delete workflow
delete_workflow({ workflow_id: "abc123" })
\`\`\`

### Execution Management
\`\`\`javascript
// Get execution status
get_execution_status({ execution_id: "exec-123" })

// Cancel running execution
cancel_execution({ execution_id: "exec-123" })

// Retry failed execution
retry_execution({ execution_id: "exec-123" })

// View execution history
get_execution_history({ workflow_id: "abc123" })
\`\`\`

## Common Patterns

Pick a shape before you start adding nodes. Most workflows fit one of these:

### Pattern 1: Linear Processing
\`\`\`
Input → Transform → LLM → Output
\`\`\`
The simplest case. Each node feeds the next. Use this for "take input, do N steps, return result."

### Pattern 2: Branching
\`\`\`
Input → Condition Node → Path A → Output A
                       → Path B → Output B
\`\`\`
Use a condition or router node to send data down different paths based on its content. Each path can have its own downstream nodes. Useful for "if X, do Y; otherwise do Z."

### Pattern 3: Parallel Fan-Out + Merge
\`\`\`
              ┌→ Process A ─┐
Input ───────┼→ Process B ─┼→ Merge → Output
              └→ Process C ─┘
\`\`\`
A single input feeds three independent processing chains, which then converge into a merge node. Useful for "do these N independent things and combine the results." All three branches execute in parallel.

### Pattern 4: Loop Processing
\`\`\`
Input → Generate List → Loop Node → Process Each Item → Collect → Output
\`\`\`
Use this when you need to process every item in an array. The loop node runs the inner subgraph once per item and collects the outputs. Pair with parallel execution for speed.

### Pattern 5: External API Chain
\`\`\`
Input → HTTP Request 1 → Transform → HTTP Request 2 → Output
\`\`\`
Each HTTP node makes an API call, the transform node reshapes the response into the next request's input. Use this for "fetch from API A, then use that to fetch from API B."

**Tip:** When designing a workflow, sketch the pattern first as ASCII or pseudocode. The visual graph is a faithful representation of that sketch — once you know the pattern, the node-and-connection setup is mechanical.

## Debugging Workflows

When a workflow doesn't behave the way you expect, work through these in order:

### 1. Validate before executing
\`\`\`javascript
validate_workflow({ workflow_id: "abc123" })
\`\`\`
Catches missing required inputs, disconnected nodes, cycles, and socket-type mismatches without spending tokens on a failed execution.

### 2. Inspect the graph
\`\`\`javascript
get_workflow_graph({ workflow_id: "abc123" })
\`\`\`
Returns every node and connection. Useful for confirming that the structure matches your mental model — especially after a series of \`add_node\` / \`add_connection\` calls where you might have lost track of step IDs.

### 3. Check the input schema
\`\`\`javascript
get_workflow_inputs_schema({ workflow_id: "abc123" })
\`\`\`
Confirms which input names the workflow expects, their types, and which are required. The most common execution failure is "input name doesn't match" — this prevents that.

### 4. Read execution history
\`\`\`javascript
get_execution_history({ workflow_id: "abc123" })
get_execution_status({ execution_id: "exec-123" })
\`\`\`
Past executions include per-node status, inputs, outputs, and error messages. If a recent run failed, this is where you find out why.

### 5. Stream a fresh execution
\`\`\`javascript
const { execution_id } = await execute_workflow({ /* ... */, wait_for_completion: false });
const stream = await stream_execution({ execution_id });
\`\`\`
Watch each node fire in real time. Lets you see exactly which node fails and what value it received.

### Common failure modes

| Symptom | Likely Cause |
|---------|--------------|
| "Input X is required" | Input name in \`execute_workflow\` doesn't match the input node's \`inputName\` property |
| "Node X has no incoming connection" | Forgot to call \`add_connection\` for one of the input sockets |
| "Socket type mismatch" | Connected an output socket to an input socket of an incompatible type |
| "Node X failed: undefined is not..." | An upstream node returned null and the downstream node didn't handle it |
| Workflow times out | Workflow is too long for sync mode — re-run with \`wait_for_completion: false\` |
| LLM node returns nothing | The prompt template references a variable that wasn't connected |
| Custom node returns wrong shape | Custom node's \`return\` keys don't match its declared output names |

## Best Practices

1. **Name things clearly:** Node labels should describe what they do
2. **Use input nodes:** Define workflow inputs explicitly
3. **Test incrementally:** Execute after each major change
4. **Validate early:** Run \`validate_workflow\` before executing
5. **Handle errors:** Consider error paths for critical workflows

## Troubleshooting

### Workflow Won't Execute
- Check \`validate_workflow\` for errors
- Ensure all required inputs are provided
- Verify all nodes are connected properly

### Unexpected Results
- Check \`get_execution_history\` for execution logs
- Verify node configurations are correct
- Test individual nodes in isolation

### Can't Find Nodes
- Use \`list_available_nodes\` to see all available types
- Check if custom nodes are published
- Verify node names match exactly (case-sensitive)

## Related Resources

- **Custom Nodes:** \`learn://custom-nodes\` - Create your own node types
- **Apps:** \`learn://apps\` - Build UIs that execute workflows
- **Recipes:** \`learn://recipes\` - Agent-driven workflow orchestration
`,
  },

  'learn://recipes': {
    name: 'Recipes Complete Guide',
    description: 'Complete guide to agent recipes - orchestration workflows for complex automation',
    mimeType: 'text/markdown',
    content: `# FlowDot Recipes - Complete Guide

## What Are Recipes?

Recipes are **agent orchestration workflows** that combine AI agents, conditional logic, loops, approvals, and parallel execution to handle complex tasks. Unlike visual workflows, recipes are designed for programmatic agent-driven automation.

**CRITICAL:** MCP tools can only **DESIGN** recipes. To **RUN** a recipe, use the FlowDot CLI:
\`\`\`bash
npx flowdot recipes run <alias> --input '{"key":"value"}'
\`\`\`

**TIP — every edit is reversible.** Every \`update_recipe\`, \`add_recipe_step\`, \`update_recipe_step\`, \`delete_recipe_step\`, \`add_recipe_store\`, \`update_recipe_store\`, and \`delete_recipe_store\` you make creates an automatic version snapshot. If the user dislikes your changes, call \`list_recipe_versions\` then \`restore_recipe_version\` to roll back. Before any non-trivial rewrite, drop a \`checkpoint_recipe\` first so the user has a precise labeled rollback point. See **Versioning & Undo** at the bottom of this guide.

## Key Concepts

### Steps
The building blocks of a recipe:
- **agent:** AI agent with tools (read, search, edit, etc.)
- **loop:** Iterate over arrays (sequential or parallel)
- **parallel:** Run multiple steps concurrently
- **gate:** Require approval or user input
- **branch:** Conditional routing based on data
- **invoke:** Call another recipe (subroutines)
- **output:** Emit a coloured message to the terminal (no LLM, instant) — config: \`message\` (supports \`{{stores.x}}\`), \`color\` (\`green\`|\`red\`|\`yellow\`, default \`green\`)

### Stores
Variables that hold data throughout execution:
- **Input stores:** Values provided when running
- **Output stores:** Values returned after completion
- **Internal stores:** Temporary data storage

### Connections
Steps connect via:
- **next:** The step to run after success
- **on_error:** The step to run if error occurs

### Interpolation
Reference data in prompts and conditions:
- \`{{inputs.request}}\` - The CLI task argument
- \`{{store_key}}\` - Any store value
- \`{{step.step_id}}\` - Output from a previous step

## Architecture Patterns

Before designing a recipe, pick the right *shape*. Most recipes fall into one of three patterns. Knowing the pattern up front determines which step types you need and how stores connect, which prevents you from painting yourself into a corner.

### Pattern 1: Orchestrator + Workers (most common)

For research, exploration, or any task where the work fans out into independent sub-tasks:

\`\`\`
1. Orchestrator (agent)
   - Analyzes the request
   - Generates sub-tasks as a JSON array
   - Outputs to: questions[]

2. Worker Loop (loop step over questions[])
   - Runs Worker Agent for each item
   - parallel: true, max_concurrent: 5
   - Collects results to: search_results[]

3. Synthesizer (agent)
   - Reads all search_results[]
   - Produces final coherent answer
   - Outputs to: answer
\`\`\`

This is the canonical shape for any "research a topic", "review N files", or "analyze N items" task.

### Pattern 2: Sequential Pipeline

For linear transformation tasks where each step depends on the previous one:

\`\`\`
Parser → Validator → Transformer → Formatter
\`\`\`

Each step has a single \`next\` and no parallelism.

### Pattern 3: Parallel Fan-Out

For independent concurrent tasks that converge into one aggregator:

\`\`\`
         ┌→ Task A ─┐
Request ─┼→ Task B ─┼→ Aggregator
         └→ Task C ─┘
\`\`\`

Use a \`parallel\` step containing the three tasks, with the aggregator as the \`next\` step.

## Building a Recipe

### Step 1: Create Recipe
\`\`\`javascript
create_recipe({
  name: "code-reviewer",
  description: "Reviews code changes and suggests improvements"
})
// Returns: { hash: "abc123xyz", ... }
// SAVE THIS HASH - you need it for all operations!
\`\`\`

### Step 2: Define Stores (Inputs/Outputs)

**CRITICAL:** Name your primary input store \`request\` - the CLI passes the task argument as \`inputs.request\`.

\`\`\`javascript
// Primary input (receives CLI task)
add_recipe_store({
  hash: "abc123xyz",
  key: "request",
  label: "Task Request",
  description: "The task provided by the user",
  schema_type: "string",
  is_input: true
})

// Output store
add_recipe_store({
  hash: "abc123xyz",
  key: "review_result",
  label: "Review Result",
  schema_type: "string",
  is_output: true
})

// Internal stores for intermediate data
add_recipe_store({
  hash: "abc123xyz",
  key: "file_list",
  schema_type: "array"
})
\`\`\`

### Step 3: Add Steps

#### Agent Step (AI Processing)
\`\`\`javascript
add_recipe_step({
  hash: "abc123xyz",
  name: "analyze-code",
  type: "agent",
  config: {
    user_prompt: "Review the code: {{inputs.request}}. List files to check.",
    tools: ["read", "search", "analyze"],
    output_store: "file_list",
    max_iterations: 10
  }
})
// Returns: { id: "step-1", ... }
// SAVE THE STEP ID!
\`\`\`

**IMPORTANT:** Use \`user_prompt\` (NOT \`prompt\`) - this is the field the runtime expects.

**Built-in tools:**
- \`read\` - Read files
- \`search\` - Search codebase
- \`analyze\` - Analyze code
- \`find-definition\` - Find function/class definitions
- \`web-search\` - Search the web
- \`edit\` - Edit files
- \`execute-command\` - Run shell commands
- \`create-file\` - Create new files

**You are NOT limited to the built-in tools.** The \`tools\` array accepts arbitrary tool references, and the recipe runtime resolves them against three sources at execution time:

1. **Built-ins** — the 8 tools above
2. **Local MCP servers** — any MCP server the user has configured in their CLI environment (e.g. \`schwab\`, \`robinhood\`, \`electron-qa\`, \`playwright\`, a custom stdio server they wrote)
3. **FlowDot toolkits** — any agent toolkit the user has installed (see \`learn://toolkits\`)

This means you can design generic recipes like *"QA these websites using the electron-qa browser tool"* or *"Rebalance this portfolio using the Schwab trading tool"* without knowing which specific MCP server the user has — you just declare the namespace or a wildcard and the runtime wires it up.

### Tool Reference Naming

| Source | Syntax | Example |
|---|---|---|
| Built-in | \`<name>\` | \`read\`, \`search\`, \`edit\` |
| Specific MCP tool | \`mcp__<server>__<tool>\` | \`mcp__schwab__get_accounts\` |
| All tools from one MCP server | \`mcp__<server>__*\` | \`mcp__electron-qa__*\` |
| All MCP tools from every server | \`mcp__*\` | \`mcp__*\` |
| Specific toolkit tool | \`toolkit__<name>__<tool>\` | \`toolkit__spotify__search_tracks\` |
| All tools from one toolkit | \`toolkit__<name>__*\` | \`toolkit__trading__*\` |

You can freely mix built-ins, MCP references, and toolkit references in a single \`tools\` array:

\`\`\`javascript
add_recipe_step({
  hash: "abc123xyz",
  name: "qa-website",
  type: "agent",
  config: {
    user_prompt: "QA the site at {{current_task.url}}: {{current_task.goal}}",
    tools: [
      "mcp__electron-qa__*",   // all browser-automation tools
      "create-file",            // built-in, to write the evidence file
      "web-search"              // built-in, for lookups
    ],
    output_store: "qa_results"
  }
})
\`\`\`

### Prompt Lecturing for MCP Tools

MCP and toolkit tools follow the same prompt-lecturing rules as built-ins — maybe more so. Small models do NOT know what \`mcp__schwab__place_order\` does just because it's in the tool list. Name the tools explicitly in the prompt, give concrete example invocations, and spell out the expected output shape. Example:

\`\`\`
You have access to the electron-qa browser tools. To QA a page you MUST:
1. Call 'mcp__electron-qa__launch_app' with the URL
2. Call 'mcp__electron-qa__describe_screen' to see what's rendered
3. Call 'mcp__electron-qa__find_element' and 'mcp__electron-qa__perform_action' to exercise the feature
4. Call 'mcp__electron-qa__take_screenshot' and save the path to evidence
5. Call 'mcp__electron-qa__close_app' before reporting

DO NOT skip steps 1 or 5. DO NOT invent element selectors you haven't seen in a describe_screen result.
\`\`\`

### Runtime Prerequisite

MCP tools are resolved at **execution time** against the CLI user's MCP server configuration. The recipe definition itself stores the tool names as strings — there is no compile-time check that \`mcp__schwab__*\` exists. If the user runs your recipe without a \`schwab\` MCP server configured, the wildcard expands to nothing and the agent will have no Schwab tools available. Design your prompts defensively, and document required MCP servers / toolkits in the recipe description.

#### Loop Step (Iterate)
\`\`\`javascript
add_recipe_step({
  hash: "abc123xyz",
  name: "review-each-file",
  type: "loop",
  config: {
    loop_over: "file_list",           // Store with array
    loop_variable: "current_file",    // Name for current item
    loop_step_id: "step-3",           // Step to run per item
    parallel: true,                    // Run iterations concurrently
    max_concurrent: 5                  // Max 5 at once
  }
})
// Returns: { id: "step-2", ... }
\`\`\`

#### Parallel Step (Concurrent)
\`\`\`javascript
add_recipe_step({
  hash: "abc123xyz",
  name: "run-checks",
  type: "parallel",
  config: {
    parallel_step_ids: ["step-4", "step-5", "step-6"]
  }
})
\`\`\`

#### Gate Step (Approval/Input)
\`\`\`javascript
add_recipe_step({
  hash: "abc123xyz",
  name: "approve-changes",
  type: "gate",
  config: {
    requires_approval: true,
    approval_prompt: "Review findings:\\n{{findings}}\\n\\nApprove?",
    input_options: {
      button_mode: "preset",
      preset: "approve_deny",
      allow_comment: true,
      comment_required: false
    },
    input_output_store: "approval_decision"
  }
})
\`\`\`

**Gate Input Presets:**
- \`approve_deny\` - Approve or Deny buttons
- \`yes_no\` - Yes or No buttons
- \`continue_cancel\` - Continue or Cancel buttons

**Custom buttons:**
\`\`\`json
{
  "button_mode": "custom",
  "buttons": [
    { "label": "Fix Now", "value": "fix", "isApproval": true },
    { "label": "Skip", "value": "skip", "isApproval": false }
  ]
}
\`\`\`

#### Branch Step (Conditional)
\`\`\`javascript
add_recipe_step({
  hash: "abc123xyz",
  name: "route-by-severity",
  type: "branch",
  config: {
    conditions: [
      { expression: "{{severity}} === 'high'", then: "step-urgent" },
      { expression: "{{severity}} === 'medium'", then: "step-normal" }
    ],
    default: "step-low-priority"
  }
})
\`\`\`

#### Invoke Step (Subroutine)
\`\`\`javascript
add_recipe_step({
  hash: "abc123xyz",
  name: "call-linter",
  type: "invoke",
  config: {
    recipe_hash: "linter-recipe-hash",
    input_mapping: {
      "file_path": "{{current_file}}"
    },
    output_mapping: {
      "lint_result": "lint_output"
    }
  }
})
\`\`\`

### Step 4: Connect Steps
\`\`\`javascript
// Set the "next" step for sequential flow
update_recipe_step({
  hash: "abc123xyz",
  step_id: "step-1",
  next: "step-2",           // Run step-2 after step-1 succeeds
  on_error: "step-error"    // Run step-error if step-1 fails
})
\`\`\`

### Step 5: Set Entry Point

**CRITICAL:** Recipe won't run until you set the entry_step_id!

\`\`\`javascript
update_recipe({
  hash: "abc123xyz",
  entry_step_id: "step-1"  // First step to run
})
\`\`\`

### Step 6: Link for CLI Access
\`\`\`javascript
link_recipe({
  hash: "abc123xyz",
  alias: "code-reviewer"  // Use hyphens, not underscores!
})
\`\`\`

**CRITICAL Alias Rules:**
- Use HYPHENS: \`my-recipe\` ✓
- NO underscores: \`my_recipe\` ✗ (causes 422 error)
- Lowercase, alphanumeric + hyphens only

### Step 7: Run via CLI
\`\`\`bash
# Run with alias
npx flowdot recipes run code-reviewer --input '{"request":"Review src/app.js"}'

# Or with hash
npx flowdot recipes run abc123xyz --input '{"request":"Review src/app.js"}'
\`\`\`

## Complete Example

\`\`\`javascript
// 1. Create recipe
const recipe = await create_recipe({
  name: "code-reviewer",
  description: "Reviews code and suggests improvements"
});
const hash = recipe.hash;

// 2. Define stores
await add_recipe_store({ hash, key: "request", is_input: true });
await add_recipe_store({ hash, key: "review", is_output: true });
await add_recipe_store({ hash, key: "files" });

// 3. Add agent step
const step1 = await add_recipe_step({
  hash,
  name: "find-files",
  type: "agent",
  config: {
    user_prompt: "Find files to review: {{inputs.request}}",
    tools: ["search"],
    output_store: "files"
  }
});

// 4. Add review step
const step2 = await add_recipe_step({
  hash,
  name: "review-code",
  type: "agent",
  config: {
    user_prompt: "Review these files: {{files}}",
    tools: ["read", "analyze"],
    output_store: "review"
  }
});

// 5. Connect steps
await update_recipe_step({ hash, step_id: step1.id, next: step2.id });

// 6. Set entry point
await update_recipe({ hash, entry_step_id: step1.id });

// 7. Link for CLI
await link_recipe({ hash, alias: "code-reviewer" });
\`\`\`

## Model Tiers

Recipes support different model tiers per step. Pick the cheapest tier that works:

| Tier | Use Case | Example Models |
|------|----------|----------------|
| \`lite\` | Simple extraction, formatting, classification | gemini-2.5-flash-lite |
| \`capable\` | General reasoning, tool use, most agent steps | gpt-4o-mini, gemini-2.5-flash |
| \`complex\` | Hard reasoning, final synthesis, judgment calls | claude-3.5-sonnet, gpt-4o |

Set per agent step in the config:

\`\`\`javascript
add_recipe_step({
  hash: "abc123xyz",
  name: "synthesize",
  type: "agent",
  config: {
    model_tier: "complex",   // Use complex only for the final synthesis
    user_prompt: "...",
    output_store: "answer"
  }
})
\`\`\`

**Cost optimization rule of thumb:** Use \`lite\` for any deterministic extraction, \`capable\` for tool-using agents (the bulk of most recipes), and \`complex\` only when judgment quality matters and \`capable\` isn't enough. A typical research recipe runs 80% of its steps on \`lite\` or \`capable\`, with one \`complex\` synthesizer at the end.

## Designing for Small Models

Recipes should work on \`lite\` and \`capable\` tiers, not just \`complex\`. Small models are fast and cheap but they need **explicit, prescriptive prompts**. Vague prompts that work on \`complex\` will silently fail on \`lite\`.

**The problem:**

\`\`\`
Use the search tool to find relevant files.
\`\`\`

A small model with this prompt doesn't know what to search for, picks bad keywords, runs one search, gets nothing, and gives up.

**The fix: prescriptive prompt lecturing.** Tell the model exactly what to do, with concrete examples:

\`\`\`
### Step 1: Search for Related Files
Use the 'search' tool with keywords from the user's request. Examples:
- For "how does authentication work" → search for: auth, login, token, session
- For "how does routing work" → search for: router, route, endpoint, handler
- For "how does the database work" → search for: database, query, model, schema

Run at least 3 different searches with different keywords.
\`\`\`

This is the single most important skill for writing recipes that scale across model tiers.

## Prompt Lecturing Principles

When writing agent step prompts, apply these five principles:

### 1. Give Concrete Examples

**Bad:**
\`\`\`
Search for files related to the request.
\`\`\`

**Good:**
\`\`\`
Search for files using these example patterns:
- "handleLogin" - function names
- "AuthService" - class names
- "Bearer" - specific strings in code
\`\`\`

### 2. Quantify Requirements

**Bad:**
\`\`\`
Use tools before responding.
\`\`\`

**Good:**
\`\`\`
You MUST:
1. Run at least 3 different searches
2. Read at least 2 files
3. Only then generate your response
\`\`\`

### 3. Provide Fallback Paths

**Bad:**
\`\`\`
Search for the relevant code.
\`\`\`

**Good:**
\`\`\`
Search for relevant code. If your first search returns no results:
- Try alternative keywords
- Search for broader terms
- Look for related concepts
\`\`\`

### 4. Specify Exact Output Format

**Bad:**
\`\`\`
Return your findings as JSON.
\`\`\`

**Good:**
\`\`\`
Your final response must be ONLY a valid JSON array. No markdown, no explanation:
["Question about file 1?", "Question about file 2?", "Question 3?"]

Example correct output:
["How does AuthService.authenticate() validate tokens?", "What middleware checks sessions?"]
\`\`\`

### 5. Prevent Common Failures

**Bad:**
\`\`\`
Find information about authentication.
\`\`\`

**Good:**
\`\`\`
You are searching LOCAL FILES in a codebase.
DO NOT use web search.
DO NOT make up file paths.
DO NOT cite files you haven't actually read with the 'read' tool.
\`\`\`

**The meta-rule:** Show, don't tell. A concrete example is worth ten sentences of description.

## Gate Steps via COMMS (Remote Approvals)

Gate steps don't only pause for terminal approval — they can route the approval request through a user's COMMS channel (Telegram, Discord) so they can approve from anywhere. The user clicks a button on their phone and the recipe continues.

This is what enables long-running recipes that span hours. The user kicks off the recipe, walks away, gets a Telegram notification at the gate step, taps a button, and the recipe continues without them returning to their terminal.

The same \`input_options\` schema works for COMMS as for terminal gates — preset buttons, custom buttons, \`allow_comment\`, and \`comment_required\` all behave identically. The only difference is the *channel* through which the approval is collected, and that's controlled by the user's COMMS configuration, not by the recipe definition.

**For recipe designers:** You don't need to write COMMS-specific code. Just author the gate step as you normally would. If the user has a COMMS channel configured and the recipe is run with COMMS routing enabled, the gate request automatically flows through that channel. The recipe is portable across terminal-only and remote-controlled execution without any change.

## Managing Recipes

\`\`\`javascript
// List recipes
list_recipes()

// Get recipe details
get_recipe({ hash: "abc123xyz" })

// Get full definition (YAML/JSON)
get_recipe_definition({ hash: "abc123xyz", format: "yaml" })

// List steps
list_recipe_steps({ hash: "abc123xyz" })

// List stores
list_recipe_stores({ hash: "abc123xyz" })

// Browse public recipes
browse_recipes({ search: "code", sort: "popular" })

// Fork a public recipe
fork_recipe({ hash: "public-recipe-hash", name: "My Fork" })

// Delete recipe
delete_recipe({ hash: "abc123xyz", confirm: true })
\`\`\`

## Debugging Recipes

When a recipe doesn't work, check these in order:

### 1. Inspect the recipe definition

Use \`get_recipe_definition({ hash, format: "yaml" })\` to dump the entire recipe as YAML and review it. This is the fastest way to spot misconfigured stores, missing connections, or wrong step types.

### 2. List the steps and stores explicitly

\`\`\`javascript
list_recipe_steps({ hash: "abc123xyz" })
list_recipe_stores({ hash: "abc123xyz" })
\`\`\`

Confirm:
- The entry step ID matches the first step you want to run
- Every step's \`next\` points to a real step ID
- Every \`output_store\` references a real store key
- The primary input store is named \`request\`

### 3. Check for the most common mistakes

| Symptom | Cause |
|---------|-------|
| Recipe won't start | \`entry_step_id\` not set on the recipe |
| 422 error linking alias | Alias contains underscores instead of hyphens |
| Agent ignores prompt | Used \`prompt\` instead of \`user_prompt\` in agent step config |
| Loop produces empty results | \`output_store\` not set on the loop step config |
| Step output not visible to next step | The step's \`output_store\` doesn't match what the next step interpolates |
| Branch step always falls through to default | \`expression\` syntax wrong — must be a JS-style boolean expression |
| Small model gives up immediately | Prompt isn't prescriptive enough — apply prompt lecturing principles |
| MCP tool not found at runtime | User's CLI environment doesn't have that MCP server configured — document required servers in the recipe description |
| \`mcp__*\` wildcard expands to nothing | No MCP servers registered in the CLI, or the named server isn't running |

### 4. Persistent execution state (CLI-side)

When a recipe runs on the FlowDot CLI, every execution persists state to disk so you can post-mortem failures. Each execution gets its own folder with:

- **state.json** — overall execution state
- **stores.json** — store values at each step
- **logs/** — per-step logs

The CLI also supports a \`DEBUG=RECIPE\` environment variable for verbose recipe-runtime tracing. Both of these are CLI-side artifacts — MCP-driven debugging works through \`get_recipe_definition\`, \`list_recipe_steps\`, and \`list_recipe_stores\` instead.

## Best Practices

1. **Name primary input \`request\`** - CLI convention
2. **Use \`user_prompt\` not \`prompt\`** - Runtime requirement
3. **Set entry_step_id** - Recipe won't run without it
4. **Use hyphens in aliases** - Not underscores
5. **Save all IDs** - You need hashes and step IDs for updates
6. **Test incrementally** - Build one step at a time
7. **Handle errors** - Use \`on_error\` for critical steps
8. **Reach beyond the built-ins** - If the task needs browser automation, trading APIs, or any external capability, check whether the user has an MCP server or toolkit for it and reference its tools directly in the step's \`tools\` array (e.g. \`mcp__electron-qa__*\`) rather than trying to shoehorn it into \`execute-command\`

## Troubleshooting

### Recipe Won't Execute
- Check entry_step_id is set: \`update_recipe\`
- Verify alias is linked: \`link_recipe\`
- Ensure stores are defined (especially \`request\`)

### Steps Not Connecting
- Verify step IDs are correct
- Use \`list_recipe_steps\` to see all step IDs
- Check \`next\` and \`on_error\` are valid step IDs

### Agent Steps Failing
- Use \`user_prompt\` not \`prompt\`
- Verify tool names are correct
- Check interpolation syntax: \`{{store_key}}\`

## Recipe Design Checklist

Before declaring a recipe done, verify:

- [ ] Architecture pattern chosen up front (Orchestrator+Workers / Sequential / Parallel Fan-Out)
- [ ] Primary input store is named \`request\`
- [ ] Output stores marked with \`is_output: true\`
- [ ] All intermediate stores defined with appropriate types
- [ ] Every agent step has \`user_prompt\` (not \`prompt\`)
- [ ] Every agent step has \`output_store\` configured
- [ ] Every loop step has \`loop_variable\` and \`output_store\`
- [ ] All steps connected via \`next\`
- [ ] \`on_error\` set on critical steps
- [ ] \`entry_step_id\` set on the recipe
- [ ] Alias linked using **hyphens**, not underscores
- [ ] Each step uses the cheapest model tier that works (\`lite\` > \`capable\` > \`complex\`)
- [ ] Prompts include concrete examples (Principle 1)
- [ ] Prompts quantify requirements (Principle 2)
- [ ] Prompts provide fallback paths (Principle 3)
- [ ] Output format explicitly specified with example (Principle 4)
- [ ] Common failure modes called out as DO NOT instructions (Principle 5)
- [ ] Any external capability (browser, trading, email, etc.) is wired via an \`mcp__*\` or \`toolkit__*\` tool reference rather than hacked around with \`execute-command\`
- [ ] Required MCP servers / toolkits listed in the recipe description so users know what to configure

## Versioning & Undo

Every recipe edit you make through MCP is reversible. The Hub captures a version snapshot of the entire recipe definition (metadata + every step + every store + entry_step_id) before each mutating call, retains the last 20 snapshots per recipe, and exposes them through four tools you can call any time.

**This means you can confidently rewrite a recipe.** If the user dislikes the result, roll back. If they then change their mind, undo the rollback. The system never silently destroys prior state.

### What triggers an auto-snapshot

Any mutation through MCP, the Hub web editor, or the CLI:
- \`update_recipe\` (metadata, visibility, entry_step_id)
- \`add_recipe_step\`, \`update_recipe_step\`, \`delete_recipe_step\`
- \`add_recipe_store\`, \`update_recipe_store\`, \`delete_recipe_store\`
- \`delete_recipe\` (yes — even delete is undoable until the soft-delete is purged)

What does **not** trigger a snapshot (no recipe edit happened):
- \`get_recipe\`, \`list_recipe_steps\`, \`get_recipe_definition\` (read-only)
- \`vote_recipe\`, \`favorite_recipe\`, \`link_recipe\` (social/personal state, not the recipe)
- \`fork_recipe\` (creates a new recipe with its own fresh version chain)
- \`create_recipe\` (the recipe is new — first edit will be its v1)

### Coalescing — one snapshot per "agent turn"

If you make several mutations in quick succession (same user + same source within 60 seconds), they coalesce into a single snapshot capturing the state *before* the burst. So if you add 8 steps and update 3 of them in one Claude turn, the version history shows ONE rollback point ("before that agent turn") — not 11 noisy rows.

Coalescing only applies to \`parent_kind: "mutation"\` snapshots. Manual checkpoints (\`checkpoint_recipe\`) and restore markers always create their own row regardless of the window.

### The four tools

**\`list_recipe_versions(hash)\`** — read scope. Returns up to 20 versions newest-first. Each entry:
\`\`\`
{
  version_number: 14,
  source: "mcp",
  label: null,                          // or "before agent rewrite"
  parent_kind: "mutation",              // | "checkpoint" | "restore" | "initial"
  restored_from_version_id: null,       // set on restore markers
  created_at: "2026-05-12T18:33:12+00:00",
  created_by: { name: "Elliot", hash: "..." },
  definition_size_bytes: 4823
}
\`\`\`

**\`get_recipe_version(hash, version_number)\`** — read scope. Returns the full definition snapshot for ONE version. Use this to inspect what's in a version BEFORE restoring, so you can describe the change to the user accurately ("v12 has 5 steps, v14 has 7 — restoring would remove the new email-sender and notification steps").

**\`checkpoint_recipe(hash, label?)\`** — manage scope. Creates an explicit snapshot RIGHT NOW, bypassing coalescing. Always pass a \`label\` so the version list is human-readable later. Use this BEFORE any risky multi-step rewrite — you'll get a precise rollback point.

**\`restore_recipe_version(hash, version_number, confirm: true)\`** — manage scope. Applies a prior version's definition as the new live state. Before applying, the service:
1. Snapshots current state as a "pre-restore" version (so this restore is itself undoable)
2. Wipes current steps + stores
3. Replays the snapshotted steps + stores
4. Writes a "post-restore" marker pointing at the version that was applied

The response gives you back both marker numbers:
\`\`\`
{
  restored_to: 12,
  new_head_version: 18,         // the post-restore marker
  pre_restore_version: 17       // pass this to restore_recipe_version to undo the rollback
}
\`\`\`

\`confirm: true\` is REQUIRED — there is no implicit confirmation.

### Decision rule — when to manually checkpoint

| Situation | Checkpoint? |
|---|---|
| User asks for a single small edit ("change this prompt") | No — auto-snapshot covers it |
| User asks you to "rewrite the recipe to do X instead" | **Yes** — \`checkpoint_recipe(hash, label: "before X rewrite")\` first |
| You're about to delete several steps | **Yes** — easier rollback than reconstructing from auto-snapshot |
| User says "experiment with a different approach" | **Yes** — label the checkpoint with the prior approach name |
| You're adding one new step | No — auto-snapshot covers it |

### Worked example: rewriting a recipe

User: "Rewrite the scanner recipe to use parallel search instead of sequential."

Right approach:
\`\`\`
1. checkpoint_recipe(hash: "g0AENsn8Wq", label: "sequential scanner v1")
   → response: { version_number: 12, ... }

2. Make your edits: update_recipe_step, add_recipe_step, etc.
   These auto-coalesce into a single pre-mutation snapshot (v13)
   plus the final state lives on the recipe itself.

3. Tell the user: "Done. You're now on the parallel version. If you
   want to roll back, the sequential version is checkpoint v12 —
   I can restore it with one call."
\`\`\`

If they say roll back:
\`\`\`
1. list_recipe_versions(hash: "g0AENsn8Wq")
   → confirm v12 is the checkpoint you made
2. restore_recipe_version(hash: "g0AENsn8Wq", version_number: 12, confirm: true)
   → response: { restored_to: 12, new_head_version: 15, pre_restore_version: 14 }
3. Tell the user: "Restored. If you change your mind, the parallel
   version is v14 — I can restore that to bring it back."
\`\`\`

### How to talk about versions

When you call \`list_recipe_versions\` and present results to the user, format them human-readably. Don't dump JSON. Do something like:

\`\`\`
Version history for "scanner":
  v15 (just now)  · restore       · restored to v12
  v14             · restore       · pre-restore snapshot
  v13             · mutation      · 14:32, 6 step edits
  v12             · checkpoint    · "sequential scanner v1"
  v11             · mutation      · 13:08
\`\`\`

Only call \`get_recipe_version\` if the user (or your own judgment) actually needs the full definition to make a decision. The summary list usually suffices.

### Common pitfalls

- **\`confirm: true\` is mandatory on restore.** Forgetting it returns an error.
- **Versions are per-recipe.** You can't restore one recipe's version onto a different recipe (rejected with \`InvalidArgumentException\`).
- **Forking starts a fresh history.** The forked recipe's version chain begins empty; the source recipe's versions don't carry over.
- **20 is the retention ceiling.** Once a recipe accumulates 20 versions, the oldest one drops off when the 21st arrives. If something old matters, drop a checkpoint with a descriptive label — labels survive as long as the version row does, and the label makes it findable.
- **Don't restore without inspecting first** unless the user explicitly asked for a specific version. When in doubt, \`get_recipe_version\` to confirm what's in the snapshot.
- **Restore replaces stores AND steps.** If the user added a store between snapshots and you restore an earlier version, that store goes away. Mention this when you describe the restore.

### Source attribution

The \`source\` field tells the user where each edit came from:
- \`mcp\` — Claude Desktop, Cursor, voice agent, native app (anything through MCP)
- \`web\` — Hub recipe editor
- \`cli\` — \`flowdot recipes versions checkpoint\` ran from the terminal
- \`system\` — unattributed

When you read the history back to a user, source helps disambiguate "I made that edit" from "the web editor made that edit" from "a cron job made that edit".

## Related Resources

- **Workflows:** \`learn://workflows\` - Visual automation workflows
- **Custom Nodes:** \`learn://custom-nodes\` - Extend agent capabilities
- **Toolkits:** \`learn://toolkits\` - MCP toolkit integration
`,
  },

  'learn://custom-nodes': {
    name: 'Custom Nodes Complete Guide',
    description: 'Complete guide to creating and managing custom nodes in FlowDot',
    mimeType: 'text/markdown',
    content: `# FlowDot Custom Nodes - Complete Guide

## What Are Custom Nodes?

Custom Nodes are **reusable JavaScript processing units** that you can create, share, and use in workflows. They extend FlowDot's built-in nodes with your own custom logic.

## Key Concepts

### Inputs
Data the node receives:
- Define name, data type, and description
- Access via \`inputs.InputName\` in script
- **Valid types:** text, number, boolean, json, array, any

### Outputs
Data the node produces:
- Define name, data type, and description
- Return via \`return { OutputName: value }\`
- **Must match exactly** (case-sensitive)

### Properties
Configuration values:
- Set by user in node UI
- Access via \`properties.propertyKey\`
- Examples: API URLs, prompts, thresholds

### Script
JavaScript code that processes inputs:
- **Must define:** \`function processData(inputs, properties, llm)\`
- **Must return:** Object with output names as keys
- **Sandboxed:** No imports, eval, or file system access

### LLM Capability (Optional)
Enable AI features:
- Users see Quick Select buttons (FlowDot, Simple, Capable, Complex)
- Script can call \`llm.call()\` to make LLM requests
- Useful for AI-powered processing

## Inputs vs Properties: When to Use Which

Both inputs and properties feed data into your node, but they're meant for different things. Choosing wrong is the most common design mistake in custom nodes.

| Use **inputs** when | Use **properties** when |
|---------------------|--------------------------|
| The value comes from another node at runtime | The value is configured once when the node is added to a workflow |
| The value changes per execution | The value is the same every execution |
| The value is dynamic (e.g., user query, file contents, API response) | The value is static (e.g., API URL, prompt template, threshold) |
| You want the value to flow through the workflow graph | You want the value to be invisible at the graph level |

**Examples:**
- A summarizer node: \`Text\` is an **input** (changes per call), \`maxLength\` is a **property** (configured once)
- An HTTP wrapper node: \`requestBody\` is an **input** (built upstream), \`apiBaseUrl\` is a **property** (set per workflow)
- A classifier node: \`text\` is an **input**, \`categories\` is a **property** (the fixed set of labels)

**Rule of thumb:** If you'd connect an arrow to it from another node, it's an input. If a user would type it into a config form, it's a property.

## Creating a Custom Node

### Step 1: Get Template (Optional)
\`\`\`javascript
get_custom_node_template({
  inputs: [
    { name: "Text", dataType: "text" },
    { name: "MaxLength", dataType: "number" }
  ],
  outputs: [
    { name: "Summary", dataType: "text" }
  ],
  llm_enabled: true
})
// Returns template code you can customize
\`\`\`

### Step 2: Write Your Script

**REQUIRED FORMAT:**
\`\`\`javascript
function processData(inputs, properties, llm) {
  // Access inputs by exact names
  const text = inputs.Text || '';
  const maxLength = inputs.MaxLength || 100;

  // Access properties
  const apiUrl = properties.apiUrl || 'https://api.example.com';

  // Your logic here
  const summary = text.substring(0, maxLength);

  // Return object with keys matching output names EXACTLY
  return {
    Summary: summary
  };
}
\`\`\`

**With LLM:**
\`\`\`javascript
function processData(inputs, properties, llm) {
  const text = inputs.Text || '';

  // Call LLM
  const result = llm.call({
    prompt: \`Summarize: \${text}\`,
    temperature: 0.7,
    maxTokens: 500
  });

  return {
    Summary: result.success ? result.response : result.error
  };
}
\`\`\`

**Important Rules:**
- ✅ processData function is REQUIRED
- ✅ Input/output names are case-sensitive
- ✅ Return keys must match output names exactly
- ❌ No top-level return statements
- ❌ No require/import, eval, process, global
- ❌ No file system access
- ✅ Available: console, JSON, Math, String, Array methods

## What the Script Validator Enforces

Before your custom node is saved, FlowDot's MCP server runs your script through an **AST-based validator** (using the \`acorn\` JavaScript parser) — not regex. This means the validator can catch things that pattern matching would miss. Knowing what's checked helps you avoid silent rejection.

**Hard errors (script will be rejected):**
- **Syntax errors** — must be valid ES2020 JavaScript
- **Missing \`processData\` function** — the validator walks the AST looking for a top-level function declaration with that exact name
- **No return statement inside \`processData\`** — function with no return is rejected
- **Top-level return statements** — rejected (returns must be inside the function)
- **Output key mismatches** — every output you declared must appear as a key in the function's return statement; extras are also flagged
- **Banned globals** — any reference to \`eval\`, \`Function\`, \`require\`, \`import\`, \`process\`, \`global\`, \`globalThis\`, \`window\`, \`document\`, \`fetch\`, \`XMLHttpRequest\`, or \`WebSocket\` is rejected

**Soft warnings (script saves but you'll see warnings):**
- Unused inputs (declared in your inputs array but never read in the script)
- Unhandled error paths in async-style code
- Complex control flow that might be hard to maintain

**Why this matters:** The validator catches mismatches between your declared schema (the inputs/outputs arrays you pass to \`create_custom_node\`) and your actual code. If you declare an output named \`Summary\` but your code returns \`{ summary: ... }\` (lowercase), the validator will reject the script with a clear error pointing to the mismatch — you don't have to wait until runtime to find out.

**Practical workflow:**
1. Get a template with \`get_custom_node_template\` — this generates code where inputs and outputs already match your schema
2. Modify the template body, but keep the input/output access patterns
3. Submit with \`create_custom_node\` — if the validator rejects, the error message tells you exactly what to fix

### Step 3: Create Node
\`\`\`javascript
create_custom_node({
  name: "text-summarizer",
  title: "Text Summarizer",
  description: "Summarizes text to a specified length",
  inputs: [
    {
      name: "Text",
      dataType: "text",
      description: "The text to summarize"
    },
    {
      name: "MaxLength",
      dataType: "number",
      description: "Maximum summary length"
    }
  ],
  outputs: [
    {
      name: "Summary",
      dataType: "text",
      description: "The summarized text"
    }
  ],
  script_code: "function processData(inputs, properties, llm) { ... }",
  llm_enabled: false,
  execution_timeout: 5000,
  memory_limit: 128
})
// Returns: { hash: "node-abc123", ... }
\`\`\`

### Step 4: Test Your Node
\`\`\`javascript
// Add to a workflow
add_node({
  workflow_id: "workflow-123",
  node_type: "custom_node_abc123",  // custom_node_{hash}
  position: { x: 100, y: 100 }
})
\`\`\`

## LLM-Enabled Nodes

Enable AI capabilities in your custom nodes:

\`\`\`javascript
create_custom_node({
  name: "ai-analyzer",
  title: "AI Analyzer",
  description: "Analyzes data with AI",
  inputs: [{ name: "Data", dataType: "text" }],
  outputs: [{ name: "Analysis", dataType: "text" }],
  llm_enabled: true,  // Enable LLM
  script_code: \`
    function processData(inputs, properties, llm) {
      const result = llm.call({
        prompt: "Analyze: " + inputs.Data,
        systemPrompt: "You are an expert analyst.",
        temperature: 0.7,
        maxTokens: 1000
      });

      return {
        Analysis: result.success ? result.response : "Error: " + result.error
      };
    }
  \`
})
\`\`\`

**LLM Response Structure:**
\`\`\`javascript
{
  success: boolean,      // true if call succeeded
  response: string,      // The LLM's response text
  error: string | null,  // Error message if failed
  provider: string,      // Provider used (e.g., "openai")
  model: string,         // Model used (e.g., "gpt-4")
  tokens: { prompt, response, total }
}
\`\`\`

### LLM Call Best Practices

The \`llm.call()\` API is simple but the parameters matter a lot for cost, speed, and reliability:

| Parameter | What It Does | Typical Values |
|-----------|--------------|----------------|
| \`prompt\` | The user message | Your actual request |
| \`systemPrompt\` | Persistent instructions for the model | "You are a JSON formatter. Always return valid JSON." |
| \`temperature\` | Randomness (0 = deterministic, 1 = creative) | **0** for extraction/classification, **0.3** for structured generation, **0.7** for creative writing |
| \`maxTokens\` | Cap on response length | Match your actual need — bigger costs more |

**Always check \`result.success\` before using \`result.response\`.** LLM calls fail more often than you expect — rate limits, network blips, content filters. If you blindly use \`result.response\`, you'll inject \`undefined\` into your output and downstream nodes will break.

**Cost discipline:**
- Custom nodes that call LLMs run *every time the workflow runs*. A node called inside a loop multiplies cost by the loop size.
- Use the lowest temperature that works. Higher temperature isn't free — it correlates with longer, more verbose responses.
- Set \`maxTokens\` aggressively. The model will stop when it hits the cap, but it won't produce 10x the tokens you asked for.
- For deterministic tasks (extraction, classification, formatting), \`temperature: 0\` + low \`maxTokens\` is the right shape.

**Pattern: graceful LLM fallback**
\`\`\`javascript
function processData(inputs, properties, llm) {
  const text = inputs.Text || '';
  if (!text) return { Result: '' };

  const result = llm.call({
    prompt: \`Extract the main topic from: \${text}\`,
    systemPrompt: "Reply with ONLY the topic as a single short phrase.",
    temperature: 0,
    maxTokens: 20
  });

  return {
    Result: result.success ? result.response.trim() : '[LLM failed: ' + result.error + ']'
  };
}
\`\`\`

The fallback string lets downstream nodes detect failure without crashing.

## Managing Custom Nodes

\`\`\`javascript
// List your nodes
list_custom_nodes({ search: "summarizer" })

// Search public nodes
search_public_custom_nodes({
  query: "text processing",
  verified_only: true
})

// Get node details
get_custom_node({ node_id: "node-abc123" })

// Update node
update_custom_node({
  node_id: "node-abc123",
  description: "New description",
  script_code: "function processData(...) { ... }"
})

// Delete node
delete_custom_node({ node_id: "node-abc123" })

// Copy public node to your library
copy_custom_node({
  node_id: "public-node-xyz",
  name: "my-custom-analyzer"
})
\`\`\`

## Sharing Custom Nodes

\`\`\`javascript
// Make public
toggle_custom_node_visibility({
  node_id: "node-abc123",
  visibility: "public"
})

// Make private
toggle_custom_node_visibility({
  node_id: "node-abc123",
  visibility: "private"
})

// Unlisted (accessible via link only)
toggle_custom_node_visibility({
  node_id: "node-abc123",
  visibility: "unlisted"
})
\`\`\`

## Common Patterns

### Pattern 1: Data Transformation
\`\`\`javascript
function processData(inputs, properties, llm) {
  const data = inputs.Data || {};

  // Transform
  const transformed = Object.keys(data).reduce((acc, key) => {
    acc[key.toUpperCase()] = data[key];
    return acc;
  }, {});

  return { Transformed: transformed };
}
\`\`\`

### Pattern 2: API Integration
\`\`\`javascript
function processData(inputs, properties, llm) {
  const query = inputs.Query || '';
  const apiKey = properties.apiKey || '';

  // Note: No fetch() in sandbox - use HTTPRequest node instead
  // This pattern shows data preparation

  const requestData = {
    query: query,
    apiKey: apiKey
  };

  return { RequestData: requestData };
}
\`\`\`

### Pattern 3: Conditional Logic
\`\`\`javascript
function processData(inputs, properties, llm) {
  const value = inputs.Value || 0;
  const threshold = properties.threshold || 50;

  let category;
  if (value > threshold * 2) {
    category = 'high';
  } else if (value > threshold) {
    category = 'medium';
  } else {
    category = 'low';
  }

  return { Category: category };
}
\`\`\`

### Pattern 4: Array Processing
\`\`\`javascript
function processData(inputs, properties, llm) {
  const items = inputs.Items || [];

  const filtered = items.filter(item => item.active);
  const mapped = filtered.map(item => ({
    id: item.id,
    name: item.name.toUpperCase()
  }));

  return { ProcessedItems: mapped };
}
\`\`\`

## Best Practices

1. **Validate inputs:** Always provide defaults
2. **Clear naming:** Use descriptive input/output names
3. **Handle errors:** Try-catch for risky operations
4. **Test thoroughly:** Test with edge cases
5. **Document:** Add clear descriptions
6. **Keep it simple:** One clear purpose per node
7. **Use LLM wisely:** Only when AI adds value

## Troubleshooting

### Script Validation Errors
- Check function name: must be \`processData\`
- Verify return object keys match output names exactly
- Remove any top-level code outside function
- No imports or require statements

### Runtime Errors
- Check input names match exactly (case-sensitive)
- Verify all inputs have defaults: \`inputs.X || defaultValue\`
- Console.log for debugging: \`console.log("Debug:", value)\`

### LLM Calls Failing
- Ensure \`llm_enabled: true\` when creating node
- Check LLM response: \`result.success\` before using
- Handle errors: \`result.error\` when \`success\` is false

## Related Resources

- **Workflows:** \`learn://workflows\` - Use custom nodes in workflows
- **Templates:** Use \`get_custom_node_template\` for starter code
- **Public Nodes:** Browse with \`search_public_custom_nodes\`
`,
  },

  'learn://apps': {
    name: 'Apps Complete Guide',
    description: 'Complete guide to building multi-file React applications with FlowDot',
    mimeType: 'text/markdown',
    content: `# FlowDot Apps - Complete Guide

## What Are Apps?

Apps are **React frontend applications** that run in a sandboxed browser environment. They can invoke FlowDot workflows as backends to create full-stack applications.

**Use cases:**
- Custom UIs for workflows
- Dashboards and data visualization
- Interactive forms and wizards
- Chat interfaces with workflow backends
- Data exploration tools

## Key Concepts

### Execution Environment
Apps run in a sandboxed iframe with:
- **React 18** (global - no imports needed)
- **Tailwind CSS** (full utility classes)
- **FlowDot color tokens:** primary-50 to primary-900, secondary-50 to secondary-900
- **invokeWorkflow()** function to call linked workflows
- **invokeTool()** function to call tools from linked toolkits (see "Toolkit Integration")

### Multi-File Structure
All apps are multi-file by default:
- **Entry file:** Main component (App.jsx)
- **Components:** Reusable UI components
- **Utilities:** Helper functions
- **Hooks:** Custom React hooks
- **Styles:** CSS files

### Bundler & Cross-File Imports

When the app runs, all files are bundled together by an in-browser ESBuild WASM bundler. This is what makes multi-file apps possible inside a sandboxed iframe.

**Cross-file imports use ESM-style \`import\`/\`export\` syntax** — and these *are* allowed (unlike React imports, which are not, because React is injected as a global). The bundler resolves them at build time.

\`\`\`javascript
// File: components/DataCard.jsx
function DataCard({ title, value }) {
  return <div className="p-4 bg-white">{title}: {value}</div>;
}
export default DataCard;

// File: utils/format.js
export function formatNumber(n) {
  return new Intl.NumberFormat().format(n);
}

// File: App.jsx (entry)
import DataCard from './components/DataCard.jsx';
import { formatNumber } from './utils/format.js';

function App() {
  return <DataCard title="Total" value={formatNumber(1234567)} />;
}
export default App;
\`\`\`

**Path resolution rules:**
- Paths are relative to the importing file
- Always include the file extension (\`.jsx\`, \`.js\`, etc.)
- Files are referenced by the \`path\` field you used in \`create_app_file\`
- The entry file is set with \`set_app_entry_file\` (defaults to \`App.jsx\`)

**The two import rules to remember:**
- ✅ **Cross-file imports (your own files):** Use ESM \`import\`/\`export\` — these are bundled
- ❌ **External library imports:** Most are NOT allowed (see "Allowed Libraries" below) — and React specifically is a *global*, not an import

### Allowed Libraries

Beyond React (which is global), the bundler has a whitelist of external libraries that *are* importable. Use \`get_app_template\` to see examples for each:

| Library | Purpose | Import |
|---------|---------|--------|
| **Lucide React** | Icon library (~1000 icons) | \`import { Search, X, Check } from 'lucide-react';\` |
| **Recharts** | Charting library | \`import { LineChart, Line, XAxis } from 'recharts';\` |
| **Framer Motion** | Animation primitives | \`import { motion } from 'framer-motion';\` |
| **clsx / classnames** | Conditional className helper | \`import clsx from 'clsx';\` |
| **date-fns** | Date manipulation | \`import { format } from 'date-fns';\` |

Anything else — including \`fetch\`, \`axios\`, Node built-ins, or arbitrary npm packages — will fail at bundle time. **If you need network access, call a workflow via \`invokeWorkflow()\` instead** — workflows run on the server side and can hit external APIs freely.

If you're not sure whether a library is allowed, the bundler error message will tell you. The error is loud and immediate, not silent.

### Display Modes
- **windowed:** Standard view with FlowDot header (default)
- **fullscreen:** Full viewport, minimal control bar
- **embedded:** No FlowDot UI, for iframe embedding

## CRITICAL CODE RULES

**These rules are MANDATORY due to sandbox constraints:**

1. **NO IMPORTS** - React is global
   \`\`\`javascript
   // ❌ WRONG
   import React from 'react';
   import { useState } from 'react';

   // ✅ CORRECT
   function MyApp() {
     const [state, setState] = React.useState(null);
   }
   \`\`\`

2. **MUST export default**
   \`\`\`javascript
   function MyApp() {
     // component code
   }

   export default MyApp;  // REQUIRED!
   \`\`\`

3. **Function must be named**
   \`\`\`javascript
   // ❌ WRONG
   export default function() { ... }

   // ✅ CORRECT
   function MyApp() { ... }
   export default MyApp;
   \`\`\`

4. **Use Tailwind CSS only**
   \`\`\`javascript
   // ❌ WRONG (no inline styles)
   <div style={{ color: 'red' }}>Text</div>

   // ✅ CORRECT
   <div className="text-red-500">Text</div>
   \`\`\`

5. **NO FORM ELEMENTS**
   \`\`\`javascript
   // ❌ WRONG (sandbox blocks forms)
   <form onSubmit={handleSubmit}>
     <button type="submit">Submit</button>
   </form>

   // ✅ CORRECT
   <div>
     <input onKeyDown={(e) => e.key === 'Enter' && handleClick()} />
     <button type="button" onClick={handleClick}>Submit</button>
   </div>
   \`\`\`

6. **ALL BUTTONS need type="button"**
   \`\`\`javascript
   <button type="button" onClick={handleClick}>Click Me</button>
   \`\`\`

## Why the Sandbox Restrictions Exist

The "no imports, no forms, no fetch" rules aren't arbitrary — they exist because every FlowDot app runs inside an **iframe sandbox** that intentionally restricts what client-side code can do.

| Restriction | Reason |
|-------------|--------|
| **No \`<form>\` tags** | The sandbox blocks form submissions because they would trigger a full-page navigation that escapes the iframe. Use buttons + state instead. |
| **No \`fetch\` / \`XMLHttpRequest\`** | The sandbox has no network access. This prevents apps from leaking user data, calling third-party APIs without consent, or being used as exfiltration vectors. **All network calls go through \`invokeWorkflow()\`**, which runs server-side under the user's permissions and is auditable. |
| **No Node built-ins** | This is a browser, not Node — but more importantly, things like \`fs\`, \`child_process\`, or \`os\` would be a security disaster even if they worked. |
| **No imports for React itself** | React is injected as a global so the bundle stays small and consistent. Letting users import their own React would let them load unchecked versions. |
| **All buttons need \`type="button"\`** | Default \`<button>\` type is \`submit\`, which inside any form-like context tries to navigate. Setting \`type="button"\` is harmless and prevents the sandbox from blocking the click. |

**Mental model:** An app is a *renderer*. It draws UI, manages local state, and calls workflows. It does not talk to the network or the host browser directly. If you want to do something an app can't do, the answer is almost always "make a workflow that does it and invoke it from the app."

## Creating an App

### Step 1: Create App
\`\`\`javascript
create_app({
  name: "my-dashboard",
  description: "Interactive dashboard with workflow backend",
  category: "productivity",
  tags: ["dashboard", "analytics"]
})
// Returns: { id: "app-abc123", ... }
\`\`\`

This creates an app with a default Hello World App.jsx entry file.

### Step 2: Update Entry File
\`\`\`javascript
update_app_file({
  app_id: "app-abc123",
  file_path: "App.jsx",
  content: \`
function MyDashboard() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const result = await invokeWorkflow('workflow-hash', {
        input: 'fetch data'
      });
      const output = getNodeOutput(result, 'Output Node');
      setData(output);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        My Dashboard
      </h1>

      <button
        type="button"
        onClick={handleFetch}
        disabled={loading}
        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>

      {data && (
        <div className="mt-4 p-4 bg-white rounded shadow">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default MyDashboard;
  \`
})
\`\`\`

### Step 3: Add Additional Files
\`\`\`javascript
// Create a component
create_app_file({
  app_id: "app-abc123",
  path: "components/DataCard.jsx",
  type: "component",
  content: \`
function DataCard({ title, value }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-3xl font-bold text-primary-600">{value}</p>
    </div>
  );
}

export default DataCard;
  \`
})

// Create a utility
create_app_file({
  app_id: "app-abc123",
  path: "utils/helpers.js",
  type: "utility",
  content: \`
export function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}
  \`
})
\`\`\`

### Step 4: Link Workflow
\`\`\`javascript
link_app_workflow({
  app_id: "app-abc123",
  workflow_hash: "workflow-xyz",
  alias: "dataFetcher"
})
\`\`\`

## Workflow Integration

### Invoking Workflows
\`\`\`javascript
const result = await invokeWorkflow('workflow-hash', {
  inputName: 'value'
});
\`\`\`

### Workflow Response Structure
\`\`\`javascript
{
  success: boolean,
  data: {
    "[nodeId]": {
      nodeId: "uuid",
      nodeTitle: "My Output Node",
      nodeType: "text_output",
      outputs: {
        "Consolidated Text": {
          value: "the actual data",
          metadata: {...}
        }
      }
    }
  }
}
\`\`\`

### Extract Output Helper
**CRITICAL:** Use this helper to safely extract workflow outputs:

\`\`\`javascript
const getNodeOutput = (result, nodeTitle, socketName = 'Consolidated Text') => {
  if (!result?.data) return null;
  const node = Object.values(result.data).find(n => n.nodeTitle === nodeTitle);
  return node?.outputs?.[socketName]?.value;
};

// Usage
const result = await invokeWorkflow('hash', { input });
const data = getNodeOutput(result, 'Output Node');
if (data) {
  // use data
}
\`\`\`

## File & Media Attachments

Apps can pass **files (PDF/TXT/CSV/JSON), images, and audio** into workflows as ordinary
input values — no upload endpoint, no extra linking. The attachment rides inside the
\`invokeWorkflow\` inputs as a base64 data URL.

### The contract

For an input name that maps to a \`file_upload\`, \`image_input\`, or \`audio_input\` node,
pass either a bare data-URL string or (preferred) an object:

\`\`\`javascript
{
  dataUrl: 'data:application/pdf;base64,JVBERi0x...',  // required
  name: 'resume.pdf',        // strongly recommended for files: the extension drives parsing
  mimeType: 'audio/webm',    // optional (audio)
  duration: 12.5             // optional (audio, seconds)
}
\`\`\`

**Input names:** \`text_input\` nodes are addressed by their \`frontend_label\`; \`file_upload\`,
\`image_input\`, and \`audio_input\` nodes are addressed by their **node title**. Keep input
node titles unique within a workflow.

### Reading a file in the sandbox

\`<input type="file">\` and FileReader work inside the app sandbox. A \`readFileAsDataUrl(file)\`
helper is injected alongside \`invokeWorkflow\`:

\`\`\`javascript
function ResumeUpload() {
  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const dataUrl = await readFileAsDataUrl(f);
    const result = await invokeWorkflow('workflow-hash', {
      'Resume File': { dataUrl, name: f.name },
      'Notes': 'optional text inputs still work alongside attachments'
    });
    // ... getNodeOutput(...) as usual
  };
  return <input type="file" accept=".pdf,.txt" onChange={handleFile} />;
}
\`\`\`

### What the workflow sees

- \`file_upload\` node: the file is parsed server-side (PDF text extraction, UTF-8 for
  txt/csv/json) and emitted on **File Content** / **File Info** — same as an editor upload.
  Unknown file types yield empty content.
- \`image_input\` node: emits the data URL on **Image URL** / **Image Data**, ready for
  \`vision_analysis\`.
- \`audio_input\` node: emits **Audio Data** \`{ dataUrl, filename, duration, mimeType }\`,
  ready for \`speech_to_text\`.
- If a node's socket is fed by a real connection, the connection wins over the attachment.

### Size limits

Keep each file at or under **10MB raw** (base64 adds ~33%) and total inputs under **20MB**
(the server rejects larger payloads with a clear error; file decode is capped at 15MB).
On mobile, stay nearer 10MB total.

### Rendering media results

Workflow outputs that contain data URLs (e.g. \`image_manipulation\` → **Image Data**) can be
rendered directly: \`<img src={dataUrl} />\` or \`<audio src={dataUrl} controls />\` — the
sandbox CSP allows \`data:\` and \`blob:\` for images and media.

## Toolkit Integration

Apps can also call **toolkit tools** — the same way they call workflows. This lets you build
a custom front-end on top of any installed toolkit (a Spotify search box, a trading dashboard,
an email triage UI, etc.).

### Linking a toolkit

\`\`\`javascript
link_app_toolkit({
  app_id: "app-abc123",
  toolkit_hash: "TOOLKIT_HASH",   // your own toolkit OR any public one
  alias: "spotify"                // optional friendly name
})
\`\`\`

**You MUST link a toolkit before the app can call it**, and in your code you reference it by the
**alias** you set here OR by the toolkit **hash** — the toolkit's \`name\` field is NOT a valid
reference. An unlinked toolkit (or one referenced by name) fails every call with
\`Toolkit "X" is not linked to this app\`. So: pick an alias when you link, then pass that exact
alias as the first arg of \`invokeTool()\`. Link one toolkit per \`link_app_toolkit\` call.

### Calling a tool with invokeTool()

\`\`\`javascript
// invokeTool(toolkitHashOrAlias, toolName, inputs)
const result = await invokeTool('spotify', 'search-tracks', {
  query: 'Miles Davis',
  type: 'track'
});
\`\`\`

The result is the tool's own response object (the same shape \`invoke_toolkit_tool\` returns) —
there is no node-output wrapper, so you use it directly. The call resolves the standard
\`{ success, data, error }\` envelope; \`invokeTool()\` resolves with \`data\` on success and rejects
on failure.

### Per-user installations & the connect prompt (IMPORTANT)

Unlike workflows (which run by hash), a toolkit tool runs against the **viewing user's own
installation**, using **their own credentials**. The app author links the toolkit, but each
viewer connects their own keys.

If a viewer has not installed/connected the toolkit, the tool call rejects and the app runner
shows an inline **"Connect <toolkit>"** prompt that deep-links to the toolkit page. Always wrap
\`invokeTool()\` in try/catch so your UI degrades gracefully while the viewer connects:

\`\`\`javascript
try {
  const tracks = await invokeTool('spotify', 'search-tracks', { query, type: 'track' });
  setResults(tracks);
} catch (err) {
  // Viewer may need to connect the toolkit — the runner surfaces the connect prompt.
  setError(err.message);
}
\`\`\`

Credentials never leave their owner. Linking a public toolkit is fine and expected — viewers
authenticate with their own accounts.

### Rate limits & dashboards that fan out many calls

The in-app tool endpoint is rate-limited (~60 calls/min per user). A dashboard that fires many
\`invokeTool()\` calls at once on load (several toolkits in parallel, or per-item detail calls)
will trip this and get HTTP 429 **"Too Many Attempts."** Cap concurrency and back off — route
every call through a small governor instead of calling \`invokeTool()\` directly:

\`\`\`javascript
const MAX = 2; let active = 0; const q = [];
const pump = () => { while (active < MAX && q.length) { const j = q.shift(); active++;
  Promise.resolve().then(j.fn).then(j.res, j.rej).finally(() => { active--; pump(); }); } };
const gate = (fn) => new Promise((res, rej) => { q.push({ fn, res, rej }); pump(); });
async function callTool(tk, tool, inputs) {
  for (let attempt = 0; ; attempt++) {
    try { return await gate(() => invokeTool(tk, tool, inputs)); }
    catch (e) {
      if (/429|too many/i.test(e.message) && attempt < 5) {
        await new Promise(r => setTimeout(r, 700 * 2 ** attempt)); continue;
      }
      throw e;
    }
  }
}
// then: const data = await callTool('spotify', 'search-tracks', { query, type: 'track' });
\`\`\`

## Managing Apps

\`\`\`javascript
// List your apps
list_apps({ search: "dashboard" })

// Search public apps
search_apps({ query: "analytics", sort: "trending" })

// Get app details
get_app({ app_id: "app-abc123" })

// List files in app
list_app_files({ app_id: "app-abc123" })

// Get specific file
get_app_file({ app_id: "app-abc123", file_path: "App.jsx" })

// Update app metadata
update_app({
  app_id: "app-abc123",
  name: "New Name",
  description: "New description",
  config: { displayMode: "fullscreen" }
})

// Delete file
delete_app_file({ app_id: "app-abc123", file_path: "old-file.jsx" })

// Rename/move file
rename_app_file({
  app_id: "app-abc123",
  file_path: "Button.jsx",
  new_path: "components/Button.jsx"
})
\`\`\`

## Code Editing Tools

### Surgical Edits (Find/Replace)
\`\`\`javascript
edit_app_code({
  app_id: "app-abc123",
  old_string: "const [count, setCount] = React.useState(0);",
  new_string: "const [count, setCount] = React.useState(10);"
})
\`\`\`

### Insert Code
\`\`\`javascript
insert_app_code({
  app_id: "app-abc123",
  after_pattern: "const [data, setData] = React.useState(null);",
  content: "\\n  const [error, setError] = React.useState(null);"
})
\`\`\`

### Append Code
\`\`\`javascript
append_app_code({
  app_id: "app-abc123",
  content: "\\n\\n// Helper functions\\nfunction formatData(d) { return d; }"
})
\`\`\`

### Prepend Code
\`\`\`javascript
prepend_app_code({
  app_id: "app-abc123",
  content: "// Dashboard Configuration\\nconst API_URL = 'https://api.example.com';\\n\\n"
})
\`\`\`

## Templates

Get starter code for common patterns:

\`\`\`javascript
get_app_template({ template: "basic" })
get_app_template({ template: "chat" })
get_app_template({ template: "dashboard" })
get_app_template({ template: "form-builder" })
get_app_template({ template: "data-viewer" })
get_app_template({ template: "all" })  // See all templates
\`\`\`

## Publishing Apps

\`\`\`javascript
// Publish to marketplace
publish_app({ app_id: "app-abc123" })

// Unpublish (make private)
unpublish_app({ app_id: "app-abc123" })

// Clone public app
clone_app({
  app_id: "public-app-xyz",
  name: "My Custom Dashboard"
})
\`\`\`

## Best Practices

1. **Start with templates:** Use \`get_app_template\`
2. **One component per file:** Keep files focused
3. **Use getNodeOutput helper:** Always for workflow results
4. **Type="button" everywhere:** Prevent form behavior
5. **Tailwind only:** No inline styles
6. **Test incrementally:** Build piece by piece
7. **Link workflows first:** Before invoking them

## Common Patterns

### Loading States
\`\`\`javascript
const [loading, setLoading] = React.useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    const result = await invokeWorkflow('hash', { input });
    // handle result
  } finally {
    setLoading(false);
  }
};
\`\`\`

### Error Handling
\`\`\`javascript
const [error, setError] = React.useState(null);

try {
  const result = await invokeWorkflow('hash', { input });
  setError(null);
} catch (err) {
  setError(err.message);
}
\`\`\`

### Enter Key Submission
\`\`\`javascript
<input
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }}
/>
\`\`\`

## Troubleshooting

### Import Errors
- Remove all import statements
- Use React.useState, React.useEffect, etc.

### Form Not Working
- Remove <form> tags
- Add type="button" to all buttons
- Use onKeyDown for Enter key

### Workflow Not Responding
- Check workflow is linked: \`link_app_workflow\`
- Use getNodeOutput helper to extract data
- Verify node titles match exactly

## Related Resources

- **Workflows:** \`learn://workflows\` - Create workflow backends
- **Templates:** \`get_app_template\` - Starter code patterns
`,
  },

  'learn://toolkits': {
    name: 'Agent Toolkits Complete Guide',
    description: 'Complete guide to creating and managing MCP agent toolkits',
    mimeType: 'text/markdown',
    content: `# FlowDot Agent Toolkits - Complete Guide

## What Are Agent Toolkits?

Agent Toolkits are **collections of MCP tools** that extend AI agents with new capabilities. They bundle related tools (API integrations, data processors, etc.) with shared credentials and configuration.

**Think of it as:** Creating mini MCP servers that can be installed and used by agents.

## Key Concepts

### Toolkits
Collections of related tools:
- **Name:** Unique identifier (e.g., "spotify-api")
- **Tools:** Array of HTTP or Workflow-based tools
- **Credentials:** Shared API keys, OAuth tokens, etc.
- **Visibility:** public, private, or unlisted

### Tools
Individual capabilities within a toolkit:
- **HTTP tools:** Make REST API calls
- **Workflow tools:** Execute FlowDot workflows
- **Input schema:** Define required parameters
- **Output schema:** Define expected responses

> **Building an image toolkit?** See \`learn://images\` — image toolkits are HTTP tools authenticated by the user's own provider key (BYOK), with the model passed as an input and an opt-in \`endpoint_config.persist_images: true\` that stores results to the user's bucket and returns served URLs instead of multi-MB base64.

### Credentials
Authentication requirements:
- **api_key:** Standard API keys
- **oauth:** OAuth 2.0 tokens (auto-refreshable)
- **bearer:** Bearer tokens
- **basic:** Basic auth
- **custom:** Custom authentication

### Installation
Users install toolkits to their account:
- Map toolkit credentials to their stored API keys
- Enable/disable as needed
- Invoke tools with credentials applied

## Creating a Toolkit

### Step 1: Create Toolkit
\`\`\`javascript
create_agent_toolkit({
  name: "spotify-api",
  title: "Spotify API",
  description: "Access Spotify music data and playback",
  category: "api-integration",
  tags: ["music", "api", "streaming"],
  credential_requirements: [
    {
      key_name: "SPOTIFY_CLIENT_ID",
      label: "Spotify Client ID",
      credential_type: "api_key",
      is_required: true,
      description: "Your Spotify app client ID"
    },
    {
      key_name: "SPOTIFY_CLIENT_SECRET",
      label: "Spotify Client Secret",
      credential_type: "api_key",
      is_required: true,
      description: "Your Spotify app client secret"
    }
  ]
})
// Returns: { id: "toolkit-abc123", ... }
\`\`\`

### Step 2: Add HTTP Tool
\`\`\`javascript
create_toolkit_tool({
  toolkit_id: "toolkit-abc123",
  name: "search-tracks",
  title: "Search Tracks",
  description: "Search for tracks on Spotify",
  tool_type: "http",
  endpoint_config: {
    method: "GET",
    url: "https://api.spotify.com/v1/search"
  },
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query"
      },
      type: {
        type: "string",
        enum: ["track", "album", "artist"],
        description: "Type of content to search"
      },
      limit: {
        type: "number",
        description: "Number of results (1-50)"
      }
    },
    required: ["query", "type"]
  },
  credential_keys: ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET"]
})
\`\`\`

### Step 3: Add Workflow Tool
\`\`\`javascript
create_toolkit_tool({
  toolkit_id: "toolkit-abc123",
  name: "analyze-playlist",
  title: "Analyze Playlist",
  description: "Analyze a Spotify playlist with AI",
  tool_type: "workflow",
  workflow_hash: "workflow-xyz",
  input_schema: {
    type: "object",
    properties: {
      playlist_id: {
        type: "string",
        description: "Spotify playlist ID"
      }
    },
    required: ["playlist_id"]
  }
})
\`\`\`

## Designing HTTP Tool Schemas

The \`input_schema\` you give a tool is **the only thing the calling AI agent sees** when it decides whether and how to invoke your tool. A bad schema produces bad tool calls. A great schema turns a tool into something the agent can use confidently on the first try.

### Schema design rules

1. **Use rich \`description\` fields, not just types.** Every property should have a description that tells the agent *when* to use it and *what shape* the value should take. Type alone is not enough.

   \`\`\`javascript
   // ❌ Weak
   query: { type: "string" }

   // ✅ Strong
   query: {
     type: "string",
     description: "Search query as a single phrase. Spaces are allowed. Keep under 100 chars. Examples: 'jazz piano 1960s', 'Miles Davis Kind of Blue'."
   }
   \`\`\`

2. **Use \`enum\` for closed sets.** If a parameter only accepts certain values, list them. This eliminates a whole class of guessing errors.

   \`\`\`javascript
   type: {
     type: "string",
     enum: ["track", "album", "artist", "playlist"],
     description: "What kind of Spotify entity to search for"
   }
   \`\`\`

3. **Mark required fields explicitly.** The \`required\` array at the schema root tells the agent which fields it cannot omit. Anything not in \`required\` is optional and the agent will know it can skip it.

4. **Constrain numeric ranges.** If a parameter has min/max bounds, encode them with \`minimum\` and \`maximum\`. The agent will respect them.

   \`\`\`javascript
   limit: {
     type: "number",
     minimum: 1,
     maximum: 50,
     description: "Number of results to return (default 20, max 50)"
   }
   \`\`\`

5. **Describe what the tool *does* in the tool description, not just what it is.** "Searches Spotify" is weak. "Searches Spotify's catalog by free-text query and returns matching tracks, albums, or artists with metadata. Use this when the user asks about a song, album, or artist by name." is strong.

6. **Avoid \`additionalProperties: true\` unless you mean it.** If you allow arbitrary extra fields, agents will start passing fields that don't exist on your endpoint and your API will reject them silently.

### Output schemas matter too

If your tool defines an \`output_schema\`, the agent uses it to know what shape the response will have — which means it can chain tools together more confidently. A tool that returns \`{ tracks: [...] }\` should declare that. The next tool can then expect \`tracks\` as input without having to inspect the actual response first.

### The mental test

Before saving a tool, ask yourself: *if I gave this schema to a stranger who has never seen the underlying API, could they make a successful call on the first try using only the schema and descriptions?* If not, the schema needs more detail.

## OAuth Configuration

For APIs requiring OAuth 2.0:

\`\`\`javascript
create_agent_toolkit({
  name: "schwab-trading",
  title: "Schwab Trading API",
  description: "Access Schwab brokerage data",
  credential_requirements: [
    {
      key_name: "SCHWAB_APP_KEY",
      label: "Schwab App Key (Client ID)",
      credential_type: "api_key",
      is_required: true,
      description: "Your Schwab Developer App Key"
    },
    {
      key_name: "SCHWAB_APP_SECRET",
      label: "Schwab App Secret (Client Secret)",
      credential_type: "api_key",
      is_required: true,
      description: "Your Schwab Developer App Secret"
    },
    {
      key_name: "SCHWAB_ACCESS_TOKEN",
      label: "Schwab Access Token",
      credential_type: "oauth",
      is_required: true,
      description: "OAuth access token (auto-refreshed by FlowDot via stored refresh token)",
      oauth_config: {
        authorization_url: "https://api.schwabapi.com/v1/oauth/authorize",
        token_endpoint: "https://api.schwabapi.com/v1/oauth/token",
        scopes: ["api"],
        client_id_credential_key: "SCHWAB_APP_KEY",
        client_secret_credential_key: "SCHWAB_APP_SECRET",
        token_endpoint_auth_method: "client_secret_basic",
        callback_mode: "localhost",
        localhost_redirect_uri: "https://127.0.0.1",
        auto_refresh_enabled: true,
        pkce_enabled: false,
        auth_error_codes: [401, 403],
        auth_error_patterns: ["invalid_token", "expired_token", "Unauthorized"]
      }
    }
  ]
})
\`\`\`

Each Schwab API tool's \`endpoint_config\` must declare a Bearer header to inject the access token, e.g.:
\`\`\`javascript
endpoint_config: {
  method: "GET",
  url: "https://api.schwabapi.com/trader/v1/accounts/accountNumbers",
  headers: { "Authorization": "Bearer {{credential.SCHWAB_ACCESS_TOKEN}}" }
}
\`\`\`
The platform does **not** auto-add an Authorization header for the \`oauth\` credential type — toolkit authors declare it. This is intentional so signed-request toolkits (HMAC, Ed25519) can keep their custom auth scheme without a special case.

**OAuth Config Fields:**
- **authorization_url:** OAuth authorization endpoint
- **token_endpoint:** Token exchange endpoint
- **scopes:** Array of OAuth scopes
- **client_id_credential_key:** Key name of credential with client ID
- **client_secret_credential_key:** Key name of credential with client secret
- **token_endpoint_auth_method:** \`"client_secret_post"\` (default) sends client_id/secret in body. \`"client_secret_basic"\` sends them as a \`Authorization: Basic …\` header — required by Schwab and some other providers. \`"none"\` is for public clients (PKCE-only).
- **token_endpoint_extra_params:** Optional object of extra body params for token requests (provider quirks).
- **callback_mode:** \`"server"\` (default) routes the OAuth redirect to the FlowDot Hub. \`"localhost"\` routes it to a localhost URL — for providers like Schwab whose developer console only accepts \`https://127.0.0.1\` callbacks. The user is shown a manual code-paste UI in this mode.
- **localhost_redirect_uri:** Required when \`callback_mode: "localhost"\` (e.g., \`"https://127.0.0.1"\`).
- **auto_refresh_enabled:** Boolean (default \`true\`). When true, the executor auto-refreshes expired access tokens using the stored refresh_token before bubbling a re-auth prompt.
- **pkce_enabled:** Enable PKCE (recommended for any provider that supports it; Schwab does not).
- **auth_error_codes:** HTTP codes indicating auth failure
- **auth_error_patterns:** Error message patterns for auth failure. These now run on **every** response (including HTTP 200) so providers that signal failure with \`200 OK\` + an error code in the body (TikTok's \`{"code":40105}\`, some Meta endpoints) are correctly classified.

**Non-Standard OAuth Provider Fields** (for providers that deviate from RFC 6749):
- **param_overrides:** Rename map for standard OAuth 2.0 param names. Used when a provider renames \`client_id\`, \`client_secret\`, \`code\`, \`refresh_token\`, etc. Example for TikTok Marketing: \`{ client_id: "app_id", client_secret: "secret", code: "auth_code" }\`. Keys may be any of: \`client_id\`, \`client_secret\`, \`code\`, \`redirect_uri\`, \`response_type\`, \`state\`, \`scope\`, \`grant_type\`, \`refresh_token\`, \`code_verifier\`, \`code_challenge\`, \`code_challenge_method\`. Standard names not in the map pass through unchanged, so spec-compliant providers ignore this field.
- **scope_separator:** Separator used when joining multiple scopes in the authorize-URL \`scope\` param. Default is a single space (RFC 6749 §3.3). Some providers expect \`","\` (TikTok Content) or \`"+"\`.
- **body_format:** Body encoding for the token-endpoint POST. \`"form"\` (default) is \`application/x-www-form-urlencoded\` per RFC 6749 §4.1.3. \`"json"\` is required by TikTok Marketing's token endpoint.
- **response_field_paths:** Dot-notation paths for extracting standard fields from a **nested** token-endpoint response. Use when a provider wraps the token block — TikTok Marketing returns \`{ "code": 0, "data": { "access_token": "...", "refresh_token": "...", "expires_in": ... } }\`. Map: \`{ access_token: "data.access_token", refresh_token: "data.refresh_token", expires_in: "data.expires_in" }\`. Keys may be any of: \`access_token\`, \`refresh_token\`, \`expires_in\`, \`token_type\`, \`scope\`. Standard fields not mapped resolve at the top level.

### When to Use Each Credential Type

| Credential type | Use when | Notes |
|---|---|---|
| **api_key** | The API uses a long-lived static key in a header (e.g., \`X-API-Key\`, \`Authorization: ApiKey ...\`) | Simplest. No refresh needed. Good for OpenAI, Anthropic, most data APIs. |
| **bearer** | The API uses a static \`Authorization: Bearer <token>\` header without OAuth | Like api_key but with the standard \`Bearer\` prefix. |
| **basic** | The API uses HTTP Basic Auth (\`Authorization: Basic base64(user:pass)\`) | Rare for modern APIs but still common in legacy services. |
| **oauth** | The API requires user-delegated access via OAuth 2.0 | Use this for any API where the user logs in to authorize access (Google, Schwab, Notion, GitHub user data, etc.). Tokens auto-refresh. |
| **custom** | The API has a non-standard auth flow that none of the others fit (e.g., mutual TLS, request signing schemes outside ed25519/HMAC) | Used as a free-form credential type. **For the common case of per-request signed-request auth (Robinhood Crypto, Binance, Coinbase Pro, Kraken, etc.), use the dedicated \`signing\` block on \`endpoint_config\` — see "Signed-Request Auth" below.** |

### Why PKCE Matters

PKCE (Proof Key for Code Exchange) is an OAuth 2.0 extension that prevents authorization code interception. Set \`pkce_enabled: true\` whenever the OAuth provider supports it — most modern providers (Google, Schwab, Notion, GitHub) do. PKCE adds no friction for the user; it just makes the flow safer.

The only reason to leave PKCE off is if the provider explicitly doesn't support it and rejects the extra parameters.

### How Token Refresh Actually Works

When a tool call returns one of the \`auth_error_codes\` (typically 401 or 403), or the response body matches one of the \`auth_error_patterns\` (e.g., \`"invalid_token"\`, \`"expired_token"\`), FlowDot:

1. Looks up the stored refresh_token from the encrypted \`agent_toolkit_oauth_tokens\` table for this (user, installation, credential_key).
2. POSTs to \`token_endpoint\` with \`grant_type=refresh_token\` using the configured \`token_endpoint_auth_method\` (Basic auth or body params).
3. Persists the new \`access_token\` (and the new \`refresh_token\` if the response includes one — many providers, including Schwab inside the 7-day window, return the same refresh_token unchanged).
4. Retries the original tool call exactly once with the new access token. If it still 401s, the platform falls through to a re-auth response (\`needs_oauth_reauth: true\`) so the calling client (CLI / native / mobile / web) can prompt the user.

The retry is bounded at one attempt to prevent loops if the refresh succeeds but the new token is also rejected.

**Things you must get right for refresh to work:**
- \`token_endpoint_auth_method\` must match what the provider accepts. Schwab requires \`"client_secret_basic"\`. Most modern providers accept both; default is \`"client_secret_post"\`.
- \`auth_error_codes\` must include every status code the API returns on token expiry (some APIs use 401, some use 403, some use both).
- \`auth_error_patterns\` should include the actual error string the API returns — check the API docs for the exact wording.
- \`client_id_credential_key\` and \`client_secret_credential_key\` must point to credentials that are actually populated at refresh time (not just at install time).
- The user must complete one initial OAuth dance (via the web "Reconnect" UI) before auto-refresh is possible. The dance is what populates \`agent_toolkit_oauth_tokens\` with both access AND refresh tokens.

**If refresh is failing:** the most common cause is that the API returns a 200 OK with an error body instead of a 4xx code. In that case, add the error pattern to \`auth_error_patterns\` so FlowDot can detect it from the body. Second most common cause: \`token_endpoint_auth_method\` mismatch — try toggling between \`"client_secret_basic"\` and \`"client_secret_post"\`.

### When Refresh Tokens Themselves Expire

Refresh tokens have provider-defined lifetimes (Schwab: 7 days; Google: indefinite until revoked; many others: 30-90 days). When the refresh-token grant fails, the executor returns:
\`\`\`json
{
  "success": false,
  "needs_oauth_reauth": true,
  "oauth_reauth": {
    "credential_key": "SCHWAB_ACCESS_TOKEN",
    "credential_label": "Schwab Access Token",
    "installation_id": 33,
    "initiate_url": "/hub/toolkit-oauth/initiate/33/SCHWAB_ACCESS_TOKEN"
  }
}
\`\`\`
The CLI / native / mobile app should open \`<flowdot-web-base>/toolkits?reauth_installation_id=<id>&reauth_credential_key=<key>\` in the user's browser. The web app auto-launches the Reconnect modal for that specific credential. After the user completes the OAuth dance once, automated runs resume.

## endpoint_config Reference (HTTP Tools)

\`endpoint_config\` is the heart of an HTTP tool. The Step 2 example above only showed \`url\` + \`method\`, but the full schema is much richer. Every template string supports \`{{credential.KEY_NAME}}\` and \`{{input.field_name}}\` substitution.

| Field | Type | Purpose |
|---|---|---|
| \`url\` | string (template) | API endpoint URL. Embed path params via \`{{input.X}}\` (e.g., \`https://api.example.com/users/{{input.user_id}}\`). |
| \`method\` | enum | \`GET\` / \`POST\` / \`PUT\` / \`PATCH\` / \`DELETE\`. |
| \`headers\` | object<string, template> | Request headers. Each value supports template substitution. Use this for static auth headers like \`Authorization: Bearer {{credential.API_KEY}}\`. |
| \`query_params\` | object<string, template> | Query string params. Prefer this over embedding params in \`url\` so they're URL-encoded correctly. **Empty templated values are skipped** — see Behavior Notes. |
| \`body_template\` | object | JSON body for POST/PUT/PATCH/DELETE. Recursively interpolated. **Empty string values are stripped** — see Behavior Notes. |
| \`body_format\` | enum | \`json\` (default) or \`form\` for \`application/x-www-form-urlencoded\` (used by OAuth token endpoints). |
| \`response_mapping\` | object<string, JSONPath> | Optional projection of response fields, e.g., \`{ "id": "$.data.id", "items": "$.data.results" }\`. When present, the tool returns only the mapped fields. |
| \`signing\` | object | Per-request signed-request auth (Ed25519, HMAC). See "Signed-Request Auth" section below. |

### Worked example — Stripe API key in header, GET with query filters

\`\`\`javascript
create_toolkit_tool({
  toolkit_id: "toolkit-abc123",
  name: "list-subscriptions",
  title: "List Subscriptions",
  description: "List Stripe subscriptions, optionally filtered by customer or status.",
  tool_type: "http",
  credential_keys: ["STRIPE_API_KEY"],
  endpoint_config: {
    method: "GET",
    url: "https://api.stripe.com/v1/subscriptions",
    headers: {
      "Authorization": "Bearer {{credential.STRIPE_API_KEY}}"
    },
    query_params: {
      "customer": "{{input.customer_id}}",
      "status": "{{input.status}}",
      "limit": "{{input.limit}}"
    },
    response_mapping: {
      "subscriptions": "$.data",
      "has_more": "$.has_more"
    }
  },
  input_schema: {
    type: "object",
    properties: {
      customer_id: { type: "string", description: "Stripe customer ID, e.g., cus_..." },
      status: { type: "string", enum: ["active", "canceled", "past_due"] },
      limit: { type: "number", minimum: 1, maximum: 100 }
    }
    // No required fields — all filters are optional thanks to empty-skip behavior
  }
})
\`\`\`

### Worked example — POST with form body (OAuth token refresh)

\`\`\`javascript
create_toolkit_tool({
  toolkit_id: "toolkit-abc123",
  name: "refresh-token",
  tool_type: "http",
  credential_keys: ["REFRESH_TOKEN", "CLIENT_ID", "CLIENT_SECRET"],
  endpoint_config: {
    method: "POST",
    url: "https://oauth.example.com/token",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body_format: "form",
    body_template: {
      grant_type: "refresh_token",
      refresh_token: "{{credential.REFRESH_TOKEN}}",
      client_id: "{{credential.CLIENT_ID}}",
      client_secret: "{{credential.CLIENT_SECRET}}"
    }
  }
})
\`\`\`

## Behavior Notes (Important for Tool Authors)

These behaviors of the HTTP executor matter when designing tools. Get them wrong and your tool will silently fail.

1. **Empty templated values are skipped from \`query_params\` and \`body_template\`.** When the agent omits an input, \`{{input.foo}}\` interpolates to \`""\` and the executor drops the field rather than sending \`?foo=\` or \`"foo": ""\`. This lets you declare optional inputs and XOR fields naturally:

   \`\`\`javascript
   body_template: {
     limit_price: "{{input.limit_price}}",      // required, always present
     asset_quantity: "{{input.asset_quantity}}", // XOR with quote_amount
     quote_amount: "{{input.quote_amount}}"      // XOR with asset_quantity
   }
   \`\`\`

   The agent provides one of \`asset_quantity\` / \`quote_amount\`; the unused one is dropped from the body. APIs like Robinhood reject \`""\` for these fields, so the empty-skip is essential.

2. **POST/PUT/PATCH/DELETE without \`body_template\` send an empty body** (not Laravel's default \`[]\` JSON). Some APIs (e.g., Robinhood's \`cancel-order\`) require POST with no body and a signature computed over an empty body string. Just omit \`body_template\` and the executor sends a body-less request.

3. **\`headers\` does NOT skip empty values.** A header template that resolves to \`""\` is sent as \`Header: \` so the upstream API rejects the request loudly. This is intentional — silently stripping an auth header would mask a misconfigured credential.

4. **\`url\` interpolation runs before \`query_params\` are appended.** Path params and query params can both be templated and they don't interfere.

5. **\`response_mapping\` runs only on JSON responses.** If the API returns non-JSON (HTML, plain text), the raw body is returned as-is and \`response_mapping\` is ignored.

6. **\`credential_keys\` on the tool gate which credentials the executor resolves.** If you reference \`{{credential.X}}\` in any template but \`X\` isn't in the tool's \`credential_keys\` array, the resolution returns empty and the substitution becomes \`""\`. Always declare every credential your tool references.

## Signed-Request Auth (Crypto Exchanges & Similar APIs)

Some APIs — most notably crypto exchanges (**Robinhood Crypto, Binance, Coinbase Pro, Kraken, Bybit, OKX, BitMEX**) — require a **fresh cryptographic signature on every request**, computed over a message like \`apiKey + timestamp + path + method + body\`. Static credential types (api_key, oauth, etc.) cannot do this.

For these APIs, declare the \`signing\` block on \`endpoint_config\`. The executor will generate a fresh timestamp, compute the signature, and inject the signed headers per request — no code, no workflow.

### Schema

\`\`\`javascript
endpoint_config: {
  method: "GET",
  url: "https://trading.robinhood.com/api/v1/crypto/trading/accounts/",
  signing: {
    algorithm: "ed25519",                       // "ed25519" | "hmac-sha256" | "hmac-sha512"
    key_credential: "ROBINHOOD_PRIVATE_KEY",    // credential key holding the signing key
    message_template:
      "{{credential.ROBINHOOD_API_KEY}}{{__timestamp}}{{__path}}{{__method}}{{__body}}",
    timestamp_format: "unix_seconds",           // "unix_seconds" | "unix_millis" | "iso8601"
    headers: {
      "x-api-key":   "{{credential.ROBINHOOD_API_KEY}}",
      "x-timestamp": "{{__timestamp}}",
      "x-signature": "{{__signature_b64}}"      // also "{{__signature_hex}}"
    }
  }
}
\`\`\`

### Special template variables (only valid inside \`signing\`)

| Variable | Resolves to |
|---|---|
| \`{{__timestamp}}\` | Generated per request, formatted per \`timestamp_format\` |
| \`{{__path}}\` | URL path component, **including query string** after templating |
| \`{{__method}}\` | HTTP method (uppercase) |
| \`{{__body}}\` | \`""\` for GET (or any method without \`body_template\`); JSON-encoded body otherwise |
| \`{{__signature_b64}}\` | Computed signature, base64 |
| \`{{__signature_hex}}\` | Computed signature, lowercase hex |

\`{{credential.X}}\` works inside the signing block too — that's how you reference the API key alongside the signature.

### Algorithm choice

| API | Algorithm | Key format |
|---|---|---|
| Robinhood Crypto | \`ed25519\` | Base64 32-byte seed (or 64-byte secretKey) |
| Binance, Coinbase Pro, Kraken, Bybit, OKX | \`hmac-sha256\` | Raw secret string (no base64 needed) |
| BitMEX | \`hmac-sha256\` | Raw secret string |

For \`ed25519\`, the executor accepts either a 32-byte seed (it derives the keypair) or a 64-byte secretKey directly. For HMAC variants, the credential value is used as-is as the HMAC key.

### Worked example — full Robinhood get-account tool

\`\`\`javascript
create_toolkit_tool({
  toolkit_id: "toolkit-abc123",
  name: "get-account",
  title: "Get Crypto Account",
  description: "Get the user's Robinhood Crypto account: account number, status, and buying power in USD.",
  tool_type: "http",
  credential_keys: ["ROBINHOOD_API_KEY", "ROBINHOOD_PRIVATE_KEY"],
  input_schema: { type: "object", properties: {} },
  endpoint_config: {
    method: "GET",
    url: "https://trading.robinhood.com/api/v1/crypto/trading/accounts/",
    signing: {
      algorithm: "ed25519",
      key_credential: "ROBINHOOD_PRIVATE_KEY",
      message_template:
        "{{credential.ROBINHOOD_API_KEY}}{{__timestamp}}{{__path}}{{__method}}{{__body}}",
      timestamp_format: "unix_seconds",
      headers: {
        "x-api-key":   "{{credential.ROBINHOOD_API_KEY}}",
        "x-timestamp": "{{__timestamp}}",
        "x-signature": "{{__signature_b64}}"
      }
    }
  },
  output_schema: {
    type: "object",
    properties: {
      account_number: { type: "string" },
      status: { type: "string", enum: ["active", "deactivated", "sell_only"] },
      buying_power: { type: "string" },
      buying_power_currency: { type: "string" }
    }
  }
})
\`\`\`

### Common pitfalls

- **The path used in signing includes the query string.** If you put query params in \`url\` (e.g., \`?symbol=BTC-USD\`) instead of \`query_params\`, signing still works because \`{{__path}}\` reflects the post-substitution URL. But prefer \`query_params\` for proper encoding.
- **POST without body but with signing**: omit \`body_template\` entirely. \`{{__body}}\` resolves to \`""\` and the executor sends an empty-body request. Required for endpoints like \`cancel-order\`.
- **Key material safety**: the Hub never logs the credential value, the signing message, or the resulting signature. Exception messages on signing failure include only the credential **key name**, never the bytes.
- **Don't put \`{{__signature_b64}}\` in \`message_template\`** — the signature is computed *from* the message, so it can't reference itself. Use it only in the \`headers\` map.

## Installing & Using Toolkits

### Install Toolkit
\`\`\`javascript
install_toolkit({ toolkit_id: "toolkit-abc123" })
// Returns: { installation_id: "install-xyz", ... }
\`\`\`

### Configure Credentials
\`\`\`javascript
update_toolkit_installation({
  installation_id: "install-xyz",
  credential_mapping: {
    "SPOTIFY_CLIENT_ID": "my-spotify-client-id",
    "SPOTIFY_CLIENT_SECRET": "my-spotify-secret"
  }
})
\`\`\`

### Invoke Tool
\`\`\`javascript
invoke_toolkit_tool({
  installation_id: "install-xyz",
  tool_name: "search-tracks",
  inputs: {
    query: "Miles Davis",
    type: "track",
    limit: 10
  }
})
\`\`\`

### Dynamic Credentials (OAuth)
\`\`\`javascript
// Pass fresh tokens from a token refresh call
invoke_toolkit_tool({
  installation_id: "install-xyz",
  tool_name: "get-account",
  credential_overrides: {
    "SCHWAB_ACCESS_TOKEN": freshTokenValue
  }
})
\`\`\`

## Managing Toolkits

\`\`\`javascript
// List your toolkits
mcp__flowdot__list_agent_toolkits({ search: "api" })

// Search public toolkits
mcp__flowdot__search_agent_toolkits({
  query: "spotify",
  verified_only: true
})

// Get toolkit details
mcp__flowdot__get_agent_toolkit({ toolkit_id: "toolkit-abc123" })

// List tools in toolkit
mcp__flowdot__list_toolkit_tools({ toolkit_id: "toolkit-abc123" })

// Update toolkit
mcp__flowdot__update_agent_toolkit({
  toolkit_id: "toolkit-abc123",
  description: "Updated description"
})

// Delete toolkit
mcp__flowdot__delete_agent_toolkit({ toolkit_id: "toolkit-abc123" })
\`\`\`

## Managing Tools

\`\`\`javascript
// Get tool details
mcp__flowdot__get_toolkit_tool({
  toolkit_id: "toolkit-abc123",
  tool_id: "tool-xyz"
})

// Update tool
mcp__flowdot__update_toolkit_tool({
  toolkit_id: "toolkit-abc123",
  tool_id: "tool-xyz",
  description: "Updated description",
  input_schema: { /* new schema */ }
})

// Delete tool
mcp__flowdot__delete_toolkit_tool({
  toolkit_id: "toolkit-abc123",
  tool_id: "tool-xyz"
})
\`\`\`

## Managing Installations

\`\`\`javascript
// List installed toolkits
mcp__flowdot__list_installed_toolkits()

// Check credentials
mcp__flowdot__check_toolkit_credentials({
  installation_id: "install-xyz"
})

// Enable/disable installation
mcp__flowdot__toggle_toolkit_active({
  installation_id: "install-xyz",
  is_active: false
})

// Uninstall
mcp__flowdot__uninstall_toolkit({
  installation_id: "install-xyz"
})
\`\`\`

## Sharing Toolkits

\`\`\`javascript
// Make public
mcp__flowdot__toggle_toolkit_visibility({
  toolkit_id: "toolkit-abc123",
  visibility: "public"
})

// Vote on toolkit
mcp__flowdot__vote_toolkit({
  toolkit_id: "toolkit-abc123",
  vote: "up"
})

// Favorite toolkit
mcp__flowdot__favorite_toolkit({
  toolkit_id: "toolkit-abc123",
  favorite: true
})

// Add comment
mcp__flowdot__add_toolkit_comment({
  toolkit_id: "toolkit-abc123",
  content: "Great toolkit for music APIs!"
})
\`\`\`

## Best Practices

1. **Group related tools:** Keep toolkits focused on one domain
2. **Clear credential names:** Use descriptive key names
3. **OAuth when possible:** Enables auto-refresh
4. **Document thoroughly:** Add descriptions to everything
5. **Test credentials:** Verify all required credentials work
6. **Version carefully:** Breaking changes need new toolkit
7. **Security first:** Never expose credentials in tool configs

## Common Patterns

### Pattern 1: RESTful API Toolkit
- Multiple HTTP tools for different endpoints
- Shared API key credentials
- Input schemas matching API parameters

### Pattern 2: AI-Powered Toolkit
- Workflow tools calling LLM workflows
- Pre-configured prompts and processing
- Abstracted complexity

### Pattern 3: Hybrid Toolkit
- HTTP tools for data fetching
- Workflow tools for processing
- Combined capabilities

## Troubleshooting

### Credentials Not Working
- Check \`check_toolkit_credentials\`
- Verify credential mapping is correct
- Ensure API keys are valid

### OAuth Tokens Expiring
- Verify oauth_config is complete
- Check auth_error_codes and patterns
- Ensure client credentials are correct

### Tool Invocation Failing
- Verify input schema requirements
- Check endpoint configuration
- Test with credential_overrides

## Related Resources

- **Workflows:** \`learn://workflows\` - Build workflow-based tools
- **Custom Nodes:** \`learn://custom-nodes\` - Extend processing capabilities
`,
  },

  'learn://knowledge-base': {
    name: 'Knowledge Base Complete Guide',
    description: 'Complete guide to using the FlowDot knowledge base with RAG',
    mimeType: 'text/markdown',
    content: `# FlowDot Knowledge Base - Complete Guide

## What Is the Knowledge Base?

The Knowledge Base is a **document storage and RAG (Retrieval-Augmented Generation) system** that lets you:
- Upload documents (PDF, DOCX, TXT, Markdown, CSV, JSON)
- Organize with categories and teams
- Search with semantic + keyword search
- Use in workflows and agents for context

## Key Concepts

### Documents
Files uploaded to your knowledge base:
- **Max size:** 50MB per file
- **Formats:** PDF, DOCX, TXT, MD, CSV, JSON
- **Processing:** Auto-chunked and embedded
- **Status:** pending → processing → ready or failed

### Categories
Organization for documents:
- Create categories to group related docs
- Color-coded for visual organization
- Can be personal or team-based

### Teams
Shared knowledge bases:
- Share documents with team members
- Team-specific categories
- Access control per team

### Chunking
Documents are split into chunks:
- Each chunk is embedded for semantic search
- Optimized chunk size for context
- Preserves document structure

### RAG Search
Retrieval-Augmented Generation:
- Semantic search (meaning-based)
- Keyword search (exact matches)
- Returns ranked chunks with sources
- Use results to ground AI responses

## Writing Documents for Good Retrieval

The shape of your documents directly determines whether RAG queries return useful results. A 100-page PDF with no headings is harder to retrieve from than the same content split into well-structured sections, even though both contain the same information.

### Why structure matters

When a document is uploaded, FlowDot splits it into chunks (typically a few hundred tokens each), generates an embedding for every chunk, and stores them. At query time, the user's question is embedded and the system returns the chunks with the most similar embeddings.

This means **the chunk is the unit of retrieval**, not the document. A well-formed chunk contains a single coherent idea that makes sense on its own, with enough surrounding context that an LLM reading it (without seeing the rest of the document) can still understand what it's about.

### Document preparation rules

1. **Use headings.** Markdown \`#\` / \`##\` headers, or PDF section headings, give the chunker natural break points and the embedder useful context. A document with no headings becomes a soup that's hard to retrieve from.

2. **One topic per section.** If a section covers three different concepts, the chunks will mix them and embeddings will be averaged. Split into three sections instead.

3. **Front-load the topic in each section.** The first sentence of a section should name what the section is about. Embeddings weight earlier tokens more, so "OAuth Configuration: To set up OAuth..." retrieves better than "To set up OAuth, which we use because..."

4. **Avoid pronoun chains across paragraphs.** A chunk that says "It uses the same approach as before" without explaining what "it" is becomes useless when retrieved out of context. Repeat nouns when in doubt.

5. **Inline definitions.** If a section uses a term defined elsewhere, briefly redefine it. Each chunk should be self-contained.

6. **Prefer Markdown over PDF when you have the choice.** Markdown round-trips through chunking with no formatting loss. PDFs lose tables, footnotes, and sometimes paragraph boundaries.

7. **Split very long documents.** A 200-page manual is better as ten 20-page documents organized in a category than as one giant file. Each upload is a discrete retrievable unit.

### What to avoid

- **Wall-of-text without breaks** — chunker has nothing to grab onto
- **Tables of contents and index pages** — these get embedded as if they were content and pollute results
- **Heavily templated repeated content** (e.g., 50 product pages with identical headers) — embeddings collapse and the system can't distinguish between them
- **Image-only PDFs** — there's no text to chunk; OCR if needed before uploading

## Uploading Documents

### Upload Text Content
\`\`\`javascript
upload_text_document({
  title: "Project Overview",
  content: "This is the content of my document...",
  mime_type: "text/markdown",
  category_id: 123  // optional
})
// Returns: { id: 456, status: "processing", ... }
\`\`\`

### Upload from URL
\`\`\`javascript
upload_document_from_url({
  url: "https://example.com/whitepaper.pdf",
  title: "Company Whitepaper",
  category_id: 123  // optional
})
\`\`\`

### Check Processing Status
\`\`\`javascript
get_knowledge_document({ document_id: 456 })
// Returns: { status: "ready", chunk_count: 42, ... }
\`\`\`

## Organizing Documents

### Create Categories
\`\`\`javascript
create_knowledge_category({
  name: "Product Documentation",
  description: "Official product docs and guides",
  color: "#3B82F6"
})
// Returns: { id: 123, ... }
\`\`\`

### List Categories
\`\`\`javascript
list_knowledge_categories()
list_knowledge_categories({ team_id: 5 })  // Team-specific
list_knowledge_categories({ personal: true })  // Personal only
\`\`\`

### Move Document to Category
\`\`\`javascript
move_document_to_category({
  document_id: 456,
  category_id: 123
})

// Or remove from category
move_document_to_category({
  document_id: 456,
  category_id: null
})
\`\`\`

### Update Category
\`\`\`javascript
update_knowledge_category({
  category_id: 123,
  name: "Updated Name",
  description: "New description",
  color: "#EF4444"
})
\`\`\`

## Searching the Knowledge Base

### Basic Search
\`\`\`javascript
query_knowledge_base({
  query: "How do I configure OAuth authentication?",
  top_k: 5
})
// Returns: Array of matching chunks with sources
\`\`\`

### Search Specific Category
\`\`\`javascript
query_knowledge_base({
  query: "deployment procedures",
  category_id: 123,
  top_k: 10
})
\`\`\`

### Search Team Documents
\`\`\`javascript
query_knowledge_base({
  query: "security policies",
  team_id: 5,
  include_personal: false,
  top_k: 5
})
\`\`\`

### Search Response Structure
\`\`\`javascript
[
  {
    chunk_text: "...relevant text...",
    document_title: "Security Guidelines",
    document_id: 456,
    score: 0.89,
    metadata: {
      page: 3,
      section: "OAuth Configuration"
    }
  },
  // ... more results
]
\`\`\`

## Querying Effectively

The query you pass to \`query_knowledge_base\` is itself embedded and compared against chunk embeddings. The shape of the query matters as much as the shape of the documents.

### Query design principles

1. **Phrase queries as questions or statements, not keyword soup.** Semantic search works on meaning, not term frequency. \`"How do I configure OAuth for the Schwab API"\` will retrieve better than \`"oauth schwab config"\`.

2. **Be specific about what you want.** A query like \`"authentication"\` will match every chunk that mentions auth — too broad to be useful. \`"How do I refresh an OAuth access token when it expires?"\` will retrieve the exact section you need.

3. **Match the document's vocabulary when possible.** If the docs say "API key" but the user asks about "credentials," use \`"API key for the X service"\` rather than \`"X credentials"\`. Embeddings handle synonyms decently but exact term matches still help.

4. **Ask one question per query.** \`"How do I install the toolkit and configure OAuth and refresh tokens"\` will return mediocre results for all three. Ask each separately and combine the results in your prompt.

### Tuning \`top_k\`

\`top_k\` controls how many chunks to return. Defaults to 5-10:
- **3-5**: Use when you need a focused, high-precision answer
- **10**: Use for general research questions where you want broader coverage
- **20+**: Use when you're going to feed everything into a synthesis step and need comprehensive coverage. Be aware this dilutes signal — the bottom of the list is often noise.

### Filtering by category or team

Pass \`category_id\` or \`team_id\` to narrow the search scope. This dramatically improves quality when you know the answer is in a specific area:

\`\`\`javascript
// Search only in product docs
query_knowledge_base({
  query: "How do I deploy to production?",
  category_id: 123,  // "Product Documentation" category
  top_k: 5
})
\`\`\`

This is faster *and* more accurate than searching everything — the embedding model can't distinguish between "production deployment" in your product docs and "production deployment" in a competitor analysis from a different category.

### Using results as LLM context (the actual RAG pattern)

The point of \`query_knowledge_base\` is rarely to show results to a user directly — it's to feed them as context into an LLM call. The standard pattern:

\`\`\`javascript
// 1. Retrieve
const results = await query_knowledge_base({
  query: "{{inputs.user_question}}",
  top_k: 5
});

// 2. Format as context
const context = results.map(r =>
  \`[Source: \${r.document_title}, score: \${r.score}]\\n\${r.chunk_text}\`
).join('\\n\\n---\\n\\n');

// 3. Pass to LLM with explicit instructions
// (typically done in an agent step's user_prompt)
const prompt = \`
Answer the user's question using ONLY the provided context.
If the context doesn't contain the answer, say so.
ALWAYS cite the source document title.

CONTEXT:
\${context}

QUESTION: {{inputs.user_question}}
\`;
\`\`\`

**The "ALWAYS cite" instruction is critical.** Without it, LLMs will silently mix retrieved facts with their training data, and you'll have no way to verify what came from where.

**The "ONLY the provided context" instruction is also critical.** Without it, the LLM will fall back to its training data for things the docs don't mention, which defeats the purpose of having a knowledge base.

## Managing Documents

### List Documents
\`\`\`javascript
list_knowledge_documents()
list_knowledge_documents({ category_id: 123 })
list_knowledge_documents({ status: "ready" })
list_knowledge_documents({ team_id: 5 })
\`\`\`

### Get Document Details
\`\`\`javascript
get_knowledge_document({ document_id: 456 })
// Returns: Full metadata, chunks, processing status
\`\`\`

### Reprocess Failed Document
\`\`\`javascript
reprocess_document({ document_id: 456 })
\`\`\`

### Delete Document
\`\`\`javascript
delete_knowledge_document({ document_id: 456 })
\`\`\`

## Team Features

### List Your Teams
\`\`\`javascript
list_user_teams()
// Returns: Teams you belong to with roles
\`\`\`

### Upload to Team
\`\`\`javascript
upload_text_document({
  title: "Team Playbook",
  content: "...",
  team_id: 5
})
\`\`\`

### Transfer Document Ownership
\`\`\`javascript
// Personal → Team
transfer_document_ownership({
  document_id: 456,
  team_id: 5,
  category_id: 789  // optional team category
})

// Team → Personal
transfer_document_ownership({
  document_id: 456,
  team_id: null  // or omit
})
\`\`\`

## Storage Management

### Check Storage Usage
\`\`\`javascript
get_knowledge_storage()
// Returns: {
//   used_bytes: 12345678,
//   limit_bytes: 1073741824,
//   document_count: 42,
//   percentage_used: 1.15
// }
\`\`\`

## Using in Workflows & Agents

### In Agent Steps
\`\`\`javascript
add_recipe_step({
  hash: "recipe-xyz",
  name: "research",
  type: "agent",
  config: {
    user_prompt: \`
      Search knowledge base for: {{inputs.request}}

      Use query_knowledge_base tool to find relevant information.
      Summarize the findings.
    \`,
    tools: ["query_knowledge_base", "search"],
    output_store: "research_result"
  }
})
\`\`\`

### In Workflows
Use a custom node or LLM node that:
1. Calls \`query_knowledge_base\`
2. Retrieves relevant chunks
3. Uses chunks as context for generation

## Best Practices

1. **Categorize from the start:** Easier to find later
2. **Descriptive titles:** Help with search ranking
3. **Check status:** Wait for "ready" before using
4. **Team vs personal:** Decide visibility upfront
5. **Regular cleanup:** Delete outdated docs
6. **Optimize queries:** Specific questions work best
7. **Use top_k wisely:** 5-10 results usually enough

## Common Patterns

### Pattern 1: Documentation Assistant
1. Upload product documentation
2. Create "docs" category
3. Agent searches knowledge base
4. Returns specific answers with sources

### Pattern 2: Team Knowledge
1. Upload team playbooks, procedures
2. Share via team knowledge base
3. Team members query for guidance
4. Consistent information across team

### Pattern 3: Research Assistant
1. Upload research papers, articles
2. Categorize by topic
3. Agent finds relevant passages
4. Synthesizes insights from multiple sources

## Troubleshooting

### Document Stuck in "processing"
- Wait a few minutes (large docs take time)
- Check \`get_knowledge_document\` for status
- If stuck >10min, try \`reprocess_document\`

### Search Returns No Results
- Verify document status is "ready"
- Try more general query terms
- Check document is in expected category
- Ensure team/personal filters are correct

### Upload Fails
- Check file size (<50MB)
- Verify file format is supported
- Try simpler filename (no special chars)

## Related Resources

- **Recipes:** \`learn://recipes\` - Use knowledge base in agent workflows
- **Custom Nodes:** \`learn://custom-nodes\` - Build RAG-powered nodes
- **Workflows:** \`learn://workflows\` - Integrate knowledge base lookups
`,
  },

  'learn://email': {
    name: 'Email Complete Guide',
    description: 'Complete guide to reading and sending emails via Gmail, Outlook, or IMAP/SMTP integrations',
    mimeType: 'text/markdown',
    content: `# Email — Complete Guide

## Overview

FlowDot MCP lets you read and send emails through any Gmail, Outlook, or IMAP/SMTP integration you have connected in your FlowDot account. All email actions are gated by the **mailbox grant system** — MCP tokens with the appropriate scope get automatic grants.

## Required Scopes

| Scope | What it unlocks |
|-------|----------------|
| \`email:read\` | \`list_email_integrations\`, \`email_search\`, \`email_read\`, \`email_list_threads\` |
| \`email:call\` | All of the above **plus** \`email_send\`, \`email_reply\`, \`email_draft\`, \`email_label\`, \`email_archive\`, \`email_delete\` |

## Step 1 — Find Your Integration ID

Always call \`list_email_integrations\` first. It returns the \`id\` you pass to every email tool.

\`\`\`
list_email_integrations
→ [{ id: 10, provider: "gmail", email: "you@example.com" }]
\`\`\`

## Email Tools Reference

### Reading Email

#### \`email_search\`
Search your mailbox with Gmail-style query syntax.

**Parameters:**
- \`integration_id\` (required) — from \`list_email_integrations\`
- \`query\` (required) — Gmail search query string
- \`max_results\` (optional, default 10)

**Query examples:**
\`\`\`
is:unread                       — unread messages
from:alice@example.com          — from a specific sender
subject:invoice                 — subject contains "invoice"
newer_than:7d                   — received in last 7 days
has:attachment                  — has attachments
label:INBOX is:unread           — unread inbox
from:boss subject:urgent        — combined filters
\`\`\`

**Returns:** Array of messages with \`message_id\`, \`thread_id\`, headers (from/to/subject/date), snippet, labels, attachments list.

---

#### \`email_read\`
Fetch the full content of a specific message.

**Parameters:**
- \`integration_id\` (required)
- \`message_id\` (required) — from \`email_search\` results
- \`include_body\` (optional, default true)

**Returns:** Full message with \`body_text\`, \`body_html\`, headers, attachments.

---

#### \`email_list_threads\`
List email threads (conversation groups).

**Parameters:**
- \`integration_id\` (required)
- \`label\` (optional) — e.g. \`"INBOX"\`, \`"SENT"\`, \`"STARRED"\`
- \`max_results\` (optional, default 10)

**Returns:** Array of threads with message count and participant list.

---

### Sending & Composing

#### \`email_send\`
Send a new email.

**Parameters:**
- \`integration_id\` (required)
- \`to\` (required) — recipient address or comma-separated list
- \`subject\` (required)
- \`body\` (required) — plain text body
- \`cc\` (optional)
- \`bcc\` (optional)

**Returns:** \`message_id\` of the sent message.

---

#### \`email_reply\`
Reply to an existing message.

**Parameters:**
- \`integration_id\` (required)
- \`message_id\` (required) — the message to reply to
- \`body\` (required) — plain text reply body
- \`all\` (optional, default false) — reply-all

---

#### \`email_draft\`
Save a draft without sending.

**Parameters:**
- \`integration_id\` (required)
- \`to\`, \`subject\`, \`body\` (required)
- \`cc\`, \`bcc\` (optional)

---

### Organising

#### \`email_label\`
Add or remove labels/folders.

**Parameters:**
- \`integration_id\` (required)
- \`message_id\` (required)
- \`add\` (optional) — array of label names to add
- \`remove\` (optional) — array of label names to remove

---

#### \`email_archive\`
Archive a message (removes from inbox without deleting).

**Parameters:**
- \`integration_id\` (required)
- \`message_id\` (required)

---

#### \`email_delete\`
Permanently delete a message.

**Parameters:**
- \`integration_id\` (required)
- \`message_id\` (required)

---

## Typical Workflows

### Check Unread Inbox
\`\`\`
1. list_email_integrations            → get integration_id
2. email_search(query="is:unread")    → get message list
3. email_read(message_id="...")       → read specific message
\`\`\`

### Send an Email
\`\`\`
1. list_email_integrations            → get integration_id
2. email_send(to="...", subject="...", body="...")
\`\`\`

### Search and Reply
\`\`\`
1. list_email_integrations
2. email_search(query="from:alice subject:invoice")
3. email_read(message_id="...")       → read full content
4. email_reply(message_id="...", body="...")
\`\`\`

### Triage Inbox
\`\`\`
1. list_email_integrations
2. email_search(query="is:unread newer_than:1d")
3. For each message:
   - email_read → understand content
   - email_label(add=["STARRED"]) or email_archive
\`\`\`

## Mailbox Grant System

MCP tokens with \`email:read\` or \`email:call\` scope are automatically granted access to the mailbox without requiring Telegram/Discord approval. Grants are created per-token per-action, so each action type (search, send, reply, etc.) is gated separately but all auto-approved for MCP tokens.

For agents (non-MCP), each action requires an explicit user approval via configured comms channels.

## Related Resources

- **Comms:** \`learn://comms\` - Send notifications and messages
- **Workflows:** \`learn://workflows\` - Automate email processing
- **Recipes:** \`learn://recipes\` - Build email-driven agent workflows
`,
  },

  'learn://comms': {
    name: 'Comms (Notifications & Messaging) Complete Guide',
    description: 'Complete guide to sending notifications and reading messages via Telegram, Discord, and other configured channels',
    mimeType: 'text/markdown',
    content: `# Comms — Notifications & Messaging Complete Guide

## Overview

FlowDot Comms lets you send notifications and messages via channels you have configured in your FlowDot account (Telegram, Discord, etc.). You can also list your configured channels and read notification history.

## Required Scopes

| Scope | What it unlocks |
|-------|----------------|
| \`comms:read\` | \`list_comms_channels\`, \`list_notifications\` |
| \`comms:send\` | \`send_notification\` |

## Comms Tools Reference

### \`list_comms_channels\`
List all notification channels you have configured.

**Parameters:** none

**Returns:** Array of channels with \`id\`, \`type\` (telegram, discord, etc.), \`name\`, and \`is_active\` flag.

**Use this first** to find your channel IDs before sending.

---

### \`send_notification\`
Send a notification or message via one or more configured channels.

**Parameters:**
- \`message\` (required) — the notification text
- \`channel_ids\` (optional) — array of specific channel IDs to send to. If omitted, sends to all active channels.
- \`title\` (optional) — notification title (shown in some channel types)
- \`url\` (optional) — link to attach to the notification

**Returns:** Confirmation with list of channels the message was dispatched to.

**Example — send to all channels:**
\`\`\`
send_notification(message="Workflow completed successfully")
\`\`\`

**Example — send to a specific channel:**
\`\`\`
1. list_comms_channels → find channel id, e.g. 3
2. send_notification(message="Deploy done", channel_ids=[3])
\`\`\`

---

### \`list_notifications\`
Read recent notification history (messages previously sent through your channels).

**Parameters:**
- \`limit\` (optional, default 20) — number of notifications to return

**Returns:** Array of past notifications with \`id\`, \`message\`, \`channel\`, \`sent_at\`, \`status\`.

---

## Typical Workflows

### Notify yourself when something finishes
\`\`\`
1. [do the work]
2. send_notification(message="Done: workflow XYZ completed. Result: ...")
\`\`\`

### Send to a specific channel
\`\`\`
1. list_comms_channels          → find your Telegram channel id
2. send_notification(
     message="Alert: error detected",
     channel_ids=[<telegram_id>],
     title="FlowDot Alert"
   )
\`\`\`

### Check recent notification history
\`\`\`
list_notifications(limit=10)
\`\`\`

## Channel Types

FlowDot supports multiple channel types. The exact set depends on what you have configured in your account settings:

- **Telegram** — sends via a connected Telegram bot
- **Discord** — sends via a Discord webhook or bot
- Other channels may be available depending on your account configuration

## Related Resources

- **Email:** \`learn://email\` - Read and send emails
- **Workflows:** \`learn://workflows\` - Trigger notifications from workflow steps
- **Recipes:** \`learn://recipes\` - Use comms in agent orchestration
`,
  },

  'learn://goals': {
    name: 'Goals & Daemon Complete Guide',
    description: 'Complete guide to FlowDot Goals — persistent long-running objectives executed locally by flowdot-cli/daemon with scheduling, task handlers, and recipe invocation. Goals can be created and managed via MCP tools or the CLI.',
    mimeType: 'text/markdown',
    content: `# FlowDot Goals — Complete Guide

## What Are Goals?

Goals are persistent, long-running objectives that execute **locally** via \`flowdot-cli\` or \`flowdot-daemon\`. All autonomous execution happens on the user's machine — NOT on the server.

**Division of responsibility:**
- **Hub (server):** CRUD storage, schedule tracking, COMMS channel config
- **MCP (this server):** Create and manage goals, tasks, milestones — but NOT invoke/run them
- **CLI (\`flowdot-cli\`):** Goal creation, task management, manual runs, result viewing
- **Daemon (\`flowdot-daemon\`):** Autonomous scheduled execution — \`GoalScheduler\` polls Hub every 60s

**Architecture principle:** Server resources are expensive. Goal execution is free — it runs on the user's machine.

> **⚠️ IMPORTANT — MCP cannot run goals.** You can create and manage goal structure via MCP tools, but to actually invoke/execute a goal you must use the CLI (\`flowdot goals run <hash>\` or \`flowdot goals trigger <hash>\`) or the FlowDot native app. The daemon handles scheduled autonomous execution.

---

## MCP Tools Reference

All 16 goal management tools require a token with the \`goals:manage\` scope.

### Goal CRUD

| Tool | Description |
|------|-------------|
| \`list_goals\` | List all goals, optionally filtered by status |
| \`create_goal\` | Create a new goal (name, description, priority, allowed_actions) |
| \`get_goal\` | Get full details for a goal by hash |
| \`update_goal\` | Update name, description, priority, or allowed_actions |
| \`delete_goal\` | Permanently delete a goal and all its tasks/milestones |

### Goal Status Transitions

| Tool | Description | Valid from |
|------|-------------|------------|
| \`pause_goal\` | Pause an active goal | active |
| \`resume_goal\` | Resume a paused goal | paused |
| \`complete_goal\` | Mark goal as completed | active |
| \`abandon_goal\` | Abandon a goal (soft delete, keeps record) | active, paused |

### Task Management

| Tool | Description |
|------|-------------|
| \`list_goal_tasks\` | List tasks for a goal (optional status filter) |
| \`add_goal_task\` | Add a task (title, description, task_type, scheduled_for) |
| \`delete_goal_task\` | Delete a task by ID |

### Milestone Management

| Tool | Description |
|------|-------------|
| \`list_goal_milestones\` | List milestones for a goal |
| \`add_goal_milestone\` | Add a milestone (title, description, target_date) |
| \`complete_goal_milestone\` | Mark a milestone as completed |
| \`delete_goal_milestone\` | Delete a milestone by ID |

### Quick Start via MCP

\`\`\`
1. create_goal  — name: "Run daily aggregator outreach"
2. add_goal_task — goal_hash: <hash>, title: "Run recipe aggregator-outreach-daily", task_type: "recipe"
3. [CLI only] flowdot goals run <hash>   ← MCP cannot do this step
\`\`\`

---

---

## CLI Quick Reference

\`\`\`bash
# Goal lifecycle
flowdot goals create "<name>"                        # Create a new goal
flowdot goals list                                   # List all goals
flowdot goals show <hash>                            # Show goal details, milestones, tasks
flowdot goals run <hash>                             # Run a goal now (manual trigger)
flowdot goals results <hash>                         # View accumulated results

# Tasks
flowdot goals task:add <hash> "<description>" -t <type>   # Add a task
flowdot goals generate <hash>                              # AI-generate tasks from goal + milestones

# Resources (context for task handlers)
flowdot goals resource:add <hash> --category "<KB category name>"   # Link a KB category as RAG context

# Daemon (for scheduled/autonomous execution)
flowdot daemon start                                 # Start the background daemon
\`\`\`

---

## Task Types

All task handlers are fully implemented and working:

| Type | What It Does |
|------|-------------|
| \`research\` | Web search + RAG context queries; stores results locally |
| \`code\` | LLM drafting (resumes, cover letters, analyses) using RAG data |
| \`draft\` | Alias for \`code\` |
| \`notify\` | Sends Telegram/Discord notification via COMMS |
| \`recipe\` | Invokes a FlowDot recipe by alias/hash (fire-and-forget for long recipes) |
| \`execute\` | Runs a shell command (60s timeout, security checks applied) |
| \`loop\` | Creates a recurring daemon loop via IPC |
| \`toolkit\` | Executes an Agent Toolkit tool |

---

## Recipe Task

The \`recipe\` task type invokes a FlowDot recipe from within a goal. It uses a **fire-and-forget** pattern — the task returns immediately while the recipe runs in the background. When the recipe completes, a Telegram notification is sent automatically.

**Adding a recipe task:**
\`\`\`bash
flowdot goals task:add <hash> "Run recipe aggregator-outreach-daily" -t recipe
\`\`\`

The recipe handler parses the alias from the task title (e.g. \`Run recipe my-recipe\`) and passes goal context as inputs:
\`\`\`json
{ "request": "...", "goal_name": "...", "goal_hash": "...", "previous_results": "..." }
\`\`\`

**Permission required:** \`recipes\` must be in the goal's allowed actions.

---

## Toolkit Task

Executes an Agent Toolkit tool (server-side API integrations like Stripe, Meta Ads, etc.):

\`\`\`bash
# Full format with JSON inputs in a code block
flowdot goals task:add <hash> "Call toolkit__stripe__list-subscriptions
\\\`\\\`\\\`json
{\\"limit\\": 10}
\\\`\\\`\\\`" -t toolkit

# Shorthand format
flowdot goals task:add <hash> "Run stripe/get-customer with {\\"customer_id\\": \\"cus_123\\"}" -t toolkit
\`\`\`

**Permission required:** \`toolkits\` must be in the goal's allowed actions.

---

## Notify Task

Sends a notification via configured COMMS channels (Telegram, Discord):

\`\`\`bash
flowdot goals task:add <hash> "Send Telegram notification with today's results" -t notify
\`\`\`

**Permission required:** \`comms\` must be in the goal's allowed actions.

---

## Permission System

Goals support fine-grained action permissions.

**Approval modes:** \`full\`, \`category\`, \`trusted\`

**Available actions:**
\`\`\`
web-search   workflows   comms      file-read   file-write
api-calls    code-execute  rag      recipes     toolkits    loops
\`\`\`

**Which handlers check permissions:**
| Handler | Permission checked |
|---------|-------------------|
| \`recipe\` | \`recipes\` |
| \`execute\` | \`code-execute\` |
| \`loop\` | \`loops\` |
| \`toolkit\` | \`toolkits\` |

---

## Scheduling (Daemon)

Goals run automatically via the **GoalScheduler** inside \`flowdot-daemon\`:

- Polls Hub every **60 seconds** for goals where \`next_run_at\` is in the past
- Max **3 concurrent executions**
- Calls \`markGoalStarted()\` and \`markGoalCompleted()\` back to Hub when done
- Broadcasts IPC events for monitoring

**The daemon must be running for scheduled goals:**
\`\`\`bash
flowdot daemon start
\`\`\`

---

## Local Storage

Every goal execution writes results to disk at \`~/.flowdot/goals/<hash>/\`:

\`\`\`
~/.flowdot/goals/<hash>/
├── runs/
│   └── 2026-04-16_09-00/
│       ├── run.json              # Run metadata (started, ended, status)
│       ├── tasks/
│       │   ├── 1.json            # Task 1 result
│       │   └── 2.json            # Task 2 result
│       └── logs/
│           └── execution.log
└── results/
    ├── jobs_found.json           # Accumulated results
    └── drafts/
\`\`\`

View results:
\`\`\`bash
flowdot goals results <hash>      # Shows task-specific summaries
\`\`\`

---

## Linking Knowledge Base Context

Link a KB category to give goal task handlers RAG access to your documents:

\`\`\`bash
flowdot goals resource:add <hash> --category "Developer Accomplishments"
\`\`\`

This makes all documents in that KB category available to \`research\`, \`code\`, and \`recipe\` task handlers for contextual grounding.

---

## Complete Example: Daily Recipe Goal

Set up a goal that runs the \`aggregator-outreach-daily\` recipe every day:

\`\`\`bash
# 1. Create the goal
flowdot goals create "Run daily aggregator outreach"
# Note the hash from output, e.g. "abc123"

# 2. Add a recipe task
flowdot goals task:add abc123 "Run recipe aggregator-outreach-daily" -t recipe

# 3. Run it manually now to test
flowdot goals run abc123

# 4. View what happened
flowdot goals results abc123

# 5. For autonomous daily runs — start the daemon
flowdot daemon start
# The daemon will poll Hub and execute the goal automatically when scheduled
\`\`\`

---

## Verified Working Task Handlers (as of 2026-04-01)

| Handler | Status |
|---------|--------|
| research | Working — web search + RAG |
| code | Working — LLM content generation |
| draft | Working — alias for code |
| notify | Working — Telegram/Discord delivery |
| recipe | Working — fire-and-forget, auto-notifies on completion |
| execute | Working — shell commands with 60s timeout |
| loop | Working — creates daemon loops via IPC |
| toolkit | Working — Agent Toolkit tools |

---

## Related Resources

- \`learn://recipes\` — Agent recipes that goals can invoke via the \`recipe\` task type
- \`learn://knowledge-base\` — Link KB categories as goal RAG context
- \`learn://comms\` — Notification channels used by \`notify\` tasks
- \`learn://toolkits\` — Toolkit tools invocable from \`toolkit\` tasks
`,
  },

  'learn://characters': {
    name: 'Agent Characters — Voice Call Setup Guide',
    description: 'Complete guide to creating, inspecting, and configuring agent characters for FlowDot voice calls — including the 10 required fields and per-provider settings',
    mimeType: 'text/markdown',
    content: `# Agent Characters — Voice Call Setup Guide

## What an agent character is

An **agent character** is a voice-call persona: a name + avatar + persona prompt bundled with a complete provider stack — TTS (text-to-speech voice), STT (speech-to-text), and LLM (the brain). When a user starts a voice call from the FlowDot web/mobile UI against a character, the LiveKit voice-agent worker reads the character's saved config and dispatches into the room. **No fallback, no defaults at runtime** — every required field must be set or the call refuses to start.

## Required Scopes

| Scope | What it unlocks |
|---|---|
| \`agent_characters:read\` | \`list_agent_characters\`, \`get_agent_character\` |
| \`agent_characters:manage\` | \`create_agent_character\`, \`update_agent_character\`, \`delete_agent_character\`, \`fork_agent_character\`, \`duplicate_agent_character\`, \`toggle_agent_character_public\` |

## The 10 required fields (the contract)

\`get_agent_character\` returns a \`Completeness\` section listing each of these. \`create_agent_character\` and \`update_agent_character\` reject any payload that would leave the row incomplete with HTTP 422 \`code: CHARACTER_VOICE_CONFIG_INCOMPLETE\` and a \`missing[]\` list.

| # | Field | What it is | Where it goes |
|---|---|---|---|
| 1 | \`voice_provider\` | TTS provider id | Selects which TTS plugin runs server-side |
| 2 | \`voice_id\` | Provider-specific voice reference | Picks the actual voice |
| 3 | \`tts_model\` | TTS model id | Picks the synthesis model |
| 4 | \`voice_settings\` | Provider-specific settings object | Knobs the TTS plugin reads |
| 5 | \`stt_provider\` | STT provider id | Speech-to-text plugin |
| 6 | \`stt_model\` | STT model id | Specific STT model |
| 7 | \`llm_provider\` | LLM provider id | Which LLM stack |
| 8 | \`llm_model\` | LLM model id | Specific model — must be one the FlowDot aggregator currently serves if \`llm_provider = 'flowdot'\` |
| 9 | \`llm_temperature\` | 0–2 | Sampling temperature |
| 10 | \`personality_prompt\` | Free-text persona / system prompt | Drives the voice agent's character |

## Per-provider voice_settings shapes

\`voice_settings\` is provider-specific. The runtime plugin validates it; the editor validator only checks it's a non-empty object.

### Fish Audio (\`voice_provider: 'fish-audio'\`)
\`\`\`json
{
  "temperature": 0.7,
  "top_p": 0.9,
  "latency": "normal",
  "chunk_length": 200
}
\`\`\`
- \`latency\`: one of \`'normal'\`, \`'balanced'\`, \`'low'\`
- Get a voice id with \`mcp__fish-audio__fish_audio_voices\` (action: \`list\` or \`search\`).
- Recommended \`tts_model\`: \`'s1'\`

### ElevenLabs (\`voice_provider: 'elevenlabs'\`)
\`\`\`json
{
  "stability": 0.7,
  "similarity_boost": 0.8
}
\`\`\`
- Recommended \`tts_model\`: \`'eleven_turbo_v2'\` or \`'eleven_multilingual_v2'\`

### Cartesia (\`voice_provider: 'cartesia'\`)
\`\`\`json
{
  "speed": "normal",
  "emotion": []
}
\`\`\`

### OpenAI TTS (\`voice_provider: 'openai'\`)
\`\`\`json
{
  "speed": 1.0
}
\`\`\`
- Recommended \`tts_model\`: \`'tts-1'\` or \`'tts-1-hd'\`

## STT and LLM choices

- **STT:** Currently only \`stt_provider: 'openai'\` (\`stt_model: 'whisper-1'\`) is supported by the LiveKit voice-agent worker. ElevenLabs Scribe and Fish Audio STT do not yet have LiveKit plugins. \`'browser'\` STT is incompatible with the server-side audio pipeline.
- **LLM:** \`llm_provider\` can be \`'openai'\`, \`'anthropic'\`, \`'flowdot'\` (the aggregator), etc. When using \`'flowdot'\`, \`llm_model\` must be one the aggregator currently serves — if the runtime hits APITimeoutError on the model, swap it on the character (NOT on the user's tier preferences — the character's saved \`llm_model\` is read first).

## Workflow: setup → confirm → call

\`\`\`
1.  list_agent_characters
       └─ See which characters are ready (✅) and which are missing fields (⚠️)
2.  get_agent_character           ── confirm one specific character
       └─ Per-field Completeness section + voice_settings JSON
3.  create_agent_character        ── make a new one from scratch
       OR
    update_agent_character        ── fill in missing fields on an existing one
       └─ On 422 CHARACTER_VOICE_CONFIG_INCOMPLETE: ask the user for the
          missing fields by name; resend
4.  get_agent_character           ── confirm is_complete: true
5.  User starts the voice call from the FlowDot web/mobile UI
\`\`\`

## Worked example — full Fish-Audio + OpenAI-STT + FlowDot-LLM character

\`\`\`json
{
  "name": "Test Harness",
  "voice_provider": "fish-audio",
  "voice_id": "<paste from fish_audio_voices>",
  "tts_model": "s1",
  "voice_settings": {
    "temperature": 0.7,
    "top_p": 0.9,
    "latency": "normal",
    "chunk_length": 200
  },
  "stt_provider": "openai",
  "stt_model": "whisper-1",
  "llm_provider": "flowdot",
  "llm_model": "redpill/anthropic/claude-haiku-4.5",
  "llm_temperature": 0.6,
  "personality_prompt": "You are a concise test assistant. Keep replies under two sentences.",
  "is_public": false
}
\`\`\`

Pass that to \`create_agent_character\` and the response carries \`is_complete: true\` and the new \`id\`.

## Fork vs. duplicate

- \`fork_agent_character\` — copy a **public** character (by hash). Voice + persona are copied, **LLM is reset** to the DB default \`'default'\`/\`'default'\`. The forked character will report incomplete until you fill in \`llm_provider\`/\`llm_model\`/\`llm_temperature\`.
- \`duplicate_agent_character\` — copy one of **your own** characters (by id). The whole config including LLM is copied; the new name is suffixed with \` (Copy)\`.

## Visibility

\`toggle_agent_character_public\` flips public/private. The first time a character goes public a stable hash is auto-generated and preserved across future toggles, so a public URL stays valid even after a private→public→private cycle.

## Cross-references

- \`learn://overview\` — where characters fit in the platform
- \`learn://recipes\` — recipes are agentic *programs*; characters are voice *personas*. Different. Recipes can reference characters but not vice-versa.
- \`Docs/LIVE_CALLS_TRUTH.md\` (in the Hub repo) — the no-fallback runtime contract these tools mirror.
- \`mcp__fish-audio__fish_audio_voices\` / \`mcp__elevenlabs__*\` (if installed) — pick a real \`voice_id\` before calling \`create_agent_character\`.
`,
  },
  'learn://images': {
    name: 'Images & Vision Complete Guide',
    description: 'How to generate images, edit images, and analyze images (vision) on FlowDot — including building image toolkits and persisting images to the user bucket',
    mimeType: 'text/markdown',
    content: `# FlowDot Images & Vision - Complete Guide

Everything about doing **image things** on FlowDot: generating images, editing images, and **vision** (feeding an image in for analysis) — plus how to package image capabilities into a toolkit and store generated images so they serve from a direct link.

## Two rules that govern ALL image work

1. **100% provider/model-agnostic.** There are NO hardcoded model ids or provider names anywhere in the platform. A model is "known" to do image-gen or vision only because its own metadata says so. **The model is always an input you pass in — never something you guess or hardcode.** Do not put a model name like a specific "nano banana" build into a tool, a UI, or a prompt; pass it as a parameter at call time.
2. **No fallback.** If the chosen provider/model/default isn't configured, the error surfaces. FlowDot never silently substitutes a different model or provider. Design for explicit configuration, not graceful degradation.

## The three surfaces (pick by who pays and who calls)

| Surface | Use when | Auth / who pays | Returns |
|---|---|---|---|
| **Workflow nodes** (\`image_manipulation\`, \`vision_analysis\`) | The work happens *inside a workflow*, as the user | The user's chosen provider — their BYOK vault key, or the FlowDot aggregator (credits) | image data / analysis text |
| **Aggregator API** (\`POST /api/v1/images/generations\`, \`/images/edits\`, vision via \`/chat/completions\`) | An **external** OpenAI-compatible client is calling FlowDot | FlowDot aggregator with an \`fd_agg_\` key (vault keys + credits) | OpenAI-shaped JSON |
| **Agent toolkits (HTTP, BYOK)** | An agent/MCP tool should do images using the **user's own** provider key (like the fal.ai toolkit) | The user's own key in their vault (\`user_api_keys\`) | provider-native JSON, optionally persisted to a served URL |

**As an MCP agent, your two main levers are workflow nodes and HTTP toolkits.** The aggregator API is for external apps that hold an \`fd_agg_\` key — do NOT use an \`fd_agg_\` key to wire a FlowDot-native toolkit back to FlowDot.

## General image use — how a user "ties images to the provider of their choice"

Users pick their image and vision providers in **Settings → Image & Vision**. This stores, under their settings:
- \`preferredModels.image_generation\` = \`{ provider, model, size, quality, style }\`
- \`preferredModels.vision\` = \`{ provider, model }\`

\`provider\` is either a **BYOK provider** (authenticated by the user's own vault key) or \`flowdot\` plus a prescribed aggregated \`model\`. Either way the model is explicit.

**Workflow nodes resolve against this with no fallback:**
- A node whose \`llm_provider\` is set to a concrete provider uses it directly.
- A node set to \`default\` resolves \`provider\` + \`model\` from \`preferredModels.image_generation\` / \`.vision\`. **If the user hasn't set a default, the node throws** ("No default image-generation/vision model configured. Set one in Settings → Image & Vision") — it does NOT fall back to the user's text model.

So if a user asks you to add image generation to a workflow: add an \`image_manipulation\` node (use \`list_available_nodes\` / \`get_node_schema\` to confirm the exact sockets and properties), and either leave it on \`default\` (and tell them to set their Image & Vision default) or set a concrete provider+model they've chosen.

### Vision (image input) in chat / workflows
Vision means passing an image *in* for analysis. In a workflow, that's the \`vision_analysis\` node (inputs: \`Image\` + \`Instructions\`). Through the aggregator API it's a normal \`/chat/completions\` call with a multimodal \`content\` array (\`[{type:'text'}, {type:'image_url'}]\`); FlowDot preserves the multimodal content and converts \`image_url\` to each provider's native shape. A model only accepts vision input if its metadata advertises the \`vision\` capability.

## Images in toolkits — the BYOK image toolkit pattern

This is the native "let an agent do image things with the user's own key" path. Reference implementation: the **Gemini Image (BYOK)** toolkit with \`generate-image\` and \`edit-image\` tools.

### Why HTTP, not a workflow tool
Workflow-type toolkit tools are **not wired** (the Hub would post to a Node \`/api/hub/internal/toolkit-workflow-execute\` route that does not exist). Every working toolkit is an **HTTP tool**. So an image toolkit is an HTTP tool that hits the provider's image endpoint directly, authenticated by the user's own vault credential.

### Building one
1. **\`create_agent_toolkit\`** — declare a credential requirement for the user's provider key (e.g. \`GOOGLE_API_KEY\`, type \`api_key\`, required). This is the user's OWN key, not an \`fd_agg_\` key.
2. **\`create_toolkit_tool\`** (\`tool_type: "http"\`) — point at the provider's image endpoint, pass the API key from the credential, and **make the model an input**:
\`\`\`json
{
  "name": "generate-image",
  "tool_type": "http",
  "input_schema": {
    "type": "object",
    "properties": {
      "model": { "type": "string", "description": "The image model to use" },
      "prompt": { "type": "string" }
    },
    "required": ["model", "prompt"]
  },
  "credential_keys": ["GOOGLE_API_KEY"],
  "endpoint_config": {
    "method": "POST",
    "url": "https://generativelanguage.googleapis.com/v1beta/models/{{input.model}}:generateContent",
    "headers": {
      "x-goog-api-key": "{{credential.GOOGLE_API_KEY}}",
      "Content-Type": "application/json"
    },
    "body_template": {
      "contents": [{ "role": "user", "parts": [{ "text": "{{input.prompt}}" }] }],
      "generationConfig": { "responseModalities": ["TEXT", "IMAGE"] }
    },
    "persist_images": true
  }
}
\`\`\`
Note \`{{input.model}}\` in the URL — the model is supplied per call, never baked in.

### \`persist_images\` — store to the user's bucket, serve a direct link
Most image APIs return the image as multi-MB inline base64, which is brutal for an agent's context. Set **\`endpoint_config.persist_images: true\`** and the executor will, on success:
- recursively find image bytes in the response **by encoding** (\`inline_data\` / \`inlineData\` / \`b64_json\` / \`data:image…base64\`) — no provider names involved,
- store each image in the **calling user's** image bucket (quota-enforced),
- return a compact \`{ images: [{ id, url, mime_type, size_bytes }], text? }\` **instead of the base64**.

The \`url\` is a **public direct link with an unguessable key** (\`{userId}/{uuid}.{ext}\`) — the URL itself is the access secret, fal-style. So a user can take the returned link and embed it directly.

**Quota:** persisted images count toward the user's per-tier storage (\`storage_mb\`), alongside knowledge documents. If a generation would exceed the limit, the tool returns \`{ success: false, code: "storage_quota_exceeded" }\` — no partial write, no silent drop. Free tier is intentionally small (a handful of images).

### Invoking it
Once installed (\`install_toolkit\`, mapping the credential to the user's stored key), call \`invoke_toolkit_tool\` with the model + prompt. Expect the compact \`{ images: [{ url }] }\` shape when \`persist_images\` is on. If you get raw base64 back, \`persist_images\` wasn't set on that tool.

## Uploading an existing image — \`upload_image\` / \`list_images\` / \`delete_image\`

When you already HAVE the bytes (e.g. you authored a precise SVG and rasterized it to PNG with the image tools, or you have a screenshot) and just need it hosted on FlowDot with a public URL, skip generation and upload directly:

- **\`upload_image\`** \`{ image_base64, mime_type, label? }\` → persists to your bucket and returns \`{ id, url, mime_type, size_bytes }\`. Same bucket, same unguessable public URL, same quota as \`persist_images\`.
- **\`list_images\`** \`{ per_page? }\` → your uploaded images, most recent first.
- **\`delete_image\`** \`{ id }\` → removes the stored object and frees quota. Only your own images.

Scopes: \`images:manage\` (upload/delete), \`images:read\` (list). **Raster only** — \`image/png\`, \`image/jpeg\`, \`image/webp\`. **SVG is rejected** (it can carry script and is served from our domain); rasterize vector art to PNG first. This is the right tool for accurate, label-perfect diagrams that image generation can't reliably render.

## Hard constraints (do not violate)

- **Google cannot be aggregated through FlowDot.** FlowDot has no permission to proxy Google/Gemini. Google image gen (including "nano banana" class models) is **BYOK only** (the user's own Google key, via a toolkit or a BYOK node) **or** via **Bedrock**-served models that FlowDot is allowed to aggregate. Never route Google through the FlowDot aggregator or an \`fd_agg_\` key.
- **Aggregatable image models** = only what FlowDot is permitted to serve (e.g. Bedrock image models), registered as image-gen + priced + available-for-aggregation. For everything else, the user brings their own key.
- **Never hardcode a model or provider name** in a tool, prompt, or UI. A toolkit may target one provider's *API* (that's its purpose), but the **model is always an input**.
- **No fallback.** Surface configuration errors; don't substitute.

## Debugging image work

| Symptom | Likely cause |
|---|---|
| Node throws "No default image-generation/vision model configured" | User hasn't set a default in **Settings → Image & Vision**, and the node is on \`default\`. Set a default or pin a concrete provider+model on the node. |
| Tool returns giant base64 instead of a URL | \`endpoint_config.persist_images\` is not \`true\` on that tool. |
| \`storage_quota_exceeded\` | The user's per-tier \`storage_mb\` is full. Persisted images count toward it; they must free space or upgrade. |
| "model required" / \`model_not_available\` from the aggregator | No model passed, or the model isn't registered as aggregatable+priced. The aggregator no longer defaults to any model. |
| Model you expect isn't selectable as image/vision in the picker | Its metadata doesn't advertise the \`image_generation\` / \`vision\` capability. Fix it at discovery (capabilities/modality), never with a name check. |
| Google model fails through the aggregator | Expected — Google is not aggregatable. Use a BYOK toolkit/node with the user's Google key. |

## Related Resources

- **Toolkits:** \`learn://toolkits\` — full toolkit/tool/credential mechanics (the image toolkit is a regular HTTP toolkit).
- **Workflows:** \`learn://workflows\` — adding and wiring the \`image_manipulation\` / \`vision_analysis\` nodes.
- **Overview:** \`learn://overview\` — where image/vision sits in the platform.
- **Deep dive (Hub repo):** \`Docs/DevGuides/IMAGES_VISION.md\` — the developer guide with file-level detail and the substrate.
`,
  },
};

/**
 * Register learning resources with the MCP server.
 */
export function registerResources(server: Server): void {
  // Handle list resources request
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: Object.entries(LEARN_RESOURCES).map(([uri, resource]) => ({
        uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      })),
    };
  });

  // Handle read resource request
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const resource = LEARN_RESOURCES[uri as keyof typeof LEARN_RESOURCES];

    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: resource.mimeType,
          text: resource.content,
        },
      ],
    };
  });

  console.error('Learning resources registered. Available resources:');
  Object.keys(LEARN_RESOURCES).forEach((uri) => {
    console.error(`  • ${uri}`);
  });
}
