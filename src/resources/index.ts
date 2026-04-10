/**
 * MCP Resources Registry
 *
 * Provides learning resources that agents can read to understand FlowDot concepts.
 * These are designed to be the FIRST thing agents check when asked about FlowDot features.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Learning resources for FlowDot system components.
 * Use URI format: learn://component-name
 */
const LEARN_RESOURCES = {
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

## Where to Start

- **New to FlowDot?** Read \`learn://workflows\` first
- **Building agents?** Read \`learn://recipes\` first
- **Extending functionality?** Read \`learn://custom-nodes\` or \`learn://toolkits\`
- **Building UIs?** Read \`learn://apps\` first

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

### Pattern 1: Linear Processing
Input → Process 1 → Process 2 → Output

### Pattern 2: Branching
Input → Condition → Path A or Path B → Output

### Pattern 3: Parallel Processing
Input → [Process A, Process B, Process C] → Merge → Output

### Pattern 4: Loop Processing
Input → Loop Over Items → Process Each → Collect Results → Output

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

## Key Concepts

### Steps
The building blocks of a recipe:
- **agent:** AI agent with tools (read, search, edit, etc.)
- **loop:** Iterate over arrays (sequential or parallel)
- **parallel:** Run multiple steps concurrently
- **gate:** Require approval or user input
- **branch:** Conditional routing based on data
- **invoke:** Call another recipe (subroutines)

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

**Available tools:**
- \`read\` - Read files
- \`search\` - Search codebase
- \`analyze\` - Analyze code
- \`find-definition\` - Find function/class definitions
- \`web-search\` - Search the web
- \`edit\` - Edit files
- \`execute-command\` - Run shell commands
- \`create-file\` - Create new files

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

### Multi-File Structure
All apps are multi-file by default:
- **Entry file:** Main component (App.jsx)
- **Components:** Reusable UI components
- **Utilities:** Helper functions
- **Hooks:** Custom React hooks
- **Styles:** CSS files

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
      description: "OAuth access token (auto-refreshed via Reconnect)",
      oauth_config: {
        authorization_url: "https://api.schwabapi.com/v1/oauth/authorize",
        token_endpoint: "https://api.schwabapi.com/v1/oauth/token",
        scopes: ["api"],
        client_id_credential_key: "SCHWAB_APP_KEY",
        client_secret_credential_key: "SCHWAB_APP_SECRET",
        pkce_enabled: true,
        auth_error_codes: [401, 403],
        auth_error_patterns: ["invalid_token", "expired_token"]
      }
    }
  ]
})
\`\`\`

**OAuth Config Fields:**
- **authorization_url:** OAuth authorization endpoint
- **token_endpoint:** Token exchange endpoint
- **scopes:** Array of OAuth scopes
- **client_id_credential_key:** Key name of credential with client ID
- **client_secret_credential_key:** Key name of credential with client secret
- **pkce_enabled:** Enable PKCE (recommended)
- **auth_error_codes:** HTTP codes indicating auth failure
- **auth_error_patterns:** Error message patterns for auth failure

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
