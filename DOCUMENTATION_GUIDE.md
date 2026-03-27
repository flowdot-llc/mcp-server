# FlowDot MCP Server - Tool Documentation Enhancement Guide

## Overview

This guide outlines how to enhance MCP tool descriptions so that AI agents can easily learn and use the FlowDot system through examples and clear explanations.

## Philosophy

**The tool description is the primary teaching mechanism for AI agents.** When an agent (like Claude) is asked to do something with FlowDot (e.g., "create a recipe for me"), it should be able to:

1. **Discover** the relevant tools by reading descriptions
2. **Learn** how each part works through examples
3. **Execute** confidently with proper parameter structures
4. **Debug** when things go wrong with helpful error context

## Excellent Examples in the Codebase

### Best-in-Class: `list-recipes.ts`
```typescript
description: `List agent recipes available to the user. Returns recipe IDs, names, descriptions, and step counts.

**What are Recipes?**
Recipes are reusable agent orchestration workflows. Design them with MCP tools, execute them via the FlowDot CLI.

**CRITICAL**: MCP tools can only DESIGN recipes. To RUN a recipe, use the CLI:
\`npx flowdot recipes run <aliasOrHash> --input '{"key":"value"}'\`

**Building a Recipe (workflow):**
1. create_recipe → Creates recipe, returns hash
2. add_recipe_store → Define inputs (is_input: true) and outputs (is_output: true)
   - **Name primary input store \`request\`** - CLI passes task as \`inputs.request\`
3. add_recipe_step → Add steps (agent, parallel, loop, gate, branch, invoke)
   - For agent steps, use \`user_prompt\` (NOT \`prompt\`) in config
4. update_recipe_step → Connect steps via "next" and "on_error"
5. update_recipe → Set entry_step_id to the first step
6. link_recipe → Create CLI alias for easy execution

**Step Types:** agent (LLM with tools), parallel (concurrent), loop (iterate array), gate (approval), branch (conditional), invoke (subroutine)

**Interpolation Syntax:**
- \`{{inputs.request}}\` - Access CLI task argument
- \`{{store_key}}\` - Reference store values`
```

**Why this works:**
- ✅ Explains the concept (What are Recipes?)
- ✅ Highlights critical constraints (MCP can only DESIGN)
- ✅ Provides step-by-step workflow
- ✅ Includes examples with inline code
- ✅ Lists available options and their purposes

### Best-in-Class: `add-recipe-step.ts`
Shows detailed configuration examples for each step type with JSON code blocks.

## Documentation Template

Use this template when enhancing tool descriptions:

```typescript
export const yourTool: Tool = {
  name: 'tool_name',
  description: `[One-line summary of what the tool does and what it returns.]

**[Concept Explanation Section - Optional]**
[If this is a complex concept, explain WHAT it is first]
- What is this thing?
- Why would you use it?
- How does it fit into the FlowDot system?

**[Critical Constraints/Warnings]**
[Use **CRITICAL** or **IMPORTANT** for must-know information]
- Things that MUST be done a certain way
- Common pitfalls to avoid
- Required prerequisites

**[Step-by-Step Workflow - For Complex Operations]**
1. First step → What it does
2. Second step → What it does
   - Sub-detail with inline code: \`example_value\`
3. Third step → What it does

**[Configuration Examples - For Tools with Complex Inputs]**
Show JSON examples with inline annotations:
\`\`\`json
{
  "field1": "value1",
  "field2": { "nested": "structure" },
  "field3": ["array", "of", "values"]
}
\`\`\`

**[Available Options/Types]**
List all valid values for enums or complex types:
- **option1** - What it does, when to use it
- **option2** - What it does, when to use it

**[Special Syntax/Patterns]**
For interpolation, templates, or special formatting:
- \`{{pattern}}\` - What it means, example usage
- \`{{other_pattern}}\` - What it means, example usage

**[Related Tools]**
If workflow involves multiple tools:
Use \`tool_name\` to do X, then \`other_tool\` to do Y.`,
  inputSchema: {
    // ... schema definition
  },
};
```

## Enhancement Strategy by Tool Category

### Category 1: Workflows (Core Execution & Management)

**Priority:** HIGH - These are the most commonly used tools

**Tools to enhance:**
- `execute-workflow.ts` - Add examples of common input patterns
- `get-workflow-details.ts` - Explain the structure of what's returned
- `create-workflow.ts` - Add next steps after creation
- `add-node.ts` - List common node types with examples
- `add-connection.ts` - Show socket connection patterns

**Template additions:**
- Common node types and their purposes
- Socket naming conventions
- Example workflow patterns (linear, branching, parallel)

### Category 2: Custom Nodes

**Priority:** HIGH - Complex but powerful feature

**Tools to enhance:**
- `create-custom-node.ts` - Needs the MOST help (complex scripting format)
- `get-custom-node-template.ts` - Show example outputs
- `update-custom-node.ts` - Clarify what can be updated

**Key documentation needs:**
```
**Script Format (REQUIRED):**
\`\`\`javascript
function processData(inputs, properties, llm) {
  // Access inputs by exact names
  const myInput = inputs.InputName || '';

  // Your logic here

  // Return object with keys matching output names EXACTLY
  return {
    OutputName: result
  };
}
\`\`\`

**Valid Data Types:** text, number, boolean, json, array, any

**Important Rules:**
- processData function is REQUIRED
- Input/output names are case-sensitive
- Return keys must match output names exactly
- No top-level return statements
```

### Category 3: Apps (React Applications)

**Priority:** MEDIUM - Advanced feature with specific constraints

**Tools to enhance:**
- `create-app.ts` - Critical React/sandbox constraints
- `edit-app-code.ts` - Show find/replace patterns
- `get-app-template.ts` - List all template types with previews

**Key documentation needs:**
```
**CRITICAL CODE RULES:**
1. NO IMPORTS - React is global (use React.useState, React.useEffect, etc.)
2. MUST include: export default MyAppName;
3. Function must be named: function MyAppName() { ... }
4. Use Tailwind CSS for ALL styling
5. NO FORM ELEMENTS - Never use <form> tags (sandbox blocks form submissions)
6. ALL BUTTONS need type="button"

**Workflow Response Structure:**
\`\`\`javascript
const result = await invokeWorkflow('hash', { input });
const data = getNodeOutput(result, 'Output Node');
if (data) { /* use data */ }
\`\`\`
```

### Category 4: Agent Toolkits (MCP Toolkits)

**Priority:** MEDIUM - Meta feature (MCP within MCP)

**Tools to enhance:**
- `create-agent-toolkit.ts` - OAuth configuration examples
- `invoke-toolkit-tool.ts` - Show credential override patterns

**Key documentation needs:**
- OAuth configuration structure with Schwab example
- Credential requirement types
- Tool input/output schema patterns

### Category 5: Knowledge Base

**Priority:** MEDIUM - RAG feature

**Tools to enhance:**
- `upload-text-document.ts` - Supported formats
- `query-knowledge-base.ts` - Search patterns
- `create-knowledge-category.ts` - Organization best practices

### Category 6: Sharing & Social

**Priority:** LOW - Nice to have

**Tools to enhance:**
- `create-shared-result.ts` - Use cases
- `create-input-preset.ts` - Preset patterns

## Implementation Checklist

For each tool you enhance:

- [ ] Read existing description - does it need enhancement?
- [ ] Identify the tool category (workflow, node, app, etc.)
- [ ] Apply the appropriate template sections
- [ ] Add JSON examples with inline comments where helpful
- [ ] List all enum values with descriptions
- [ ] Include **CRITICAL** or **IMPORTANT** warnings
- [ ] Show workflow (if multi-step)
- [ ] Reference related tools when applicable
- [ ] Test that code blocks render correctly (use \`\`\` for blocks, \` for inline)
- [ ] Keep it concise - aim for scannable bullet points

## Markdown Formatting Best Practices

1. **Headers:** Use `**Header:**` for section headers
2. **Code blocks:** Use triple backticks with language: \`\`\`json
3. **Inline code:** Use backticks: \`example_value\`
4. **Bold:** Use `**text**` for emphasis
5. **Lists:** Use `-` or numbered lists `1.`
6. **Nested lists:** Indent with 2-3 spaces
7. **Escape special chars:** Use backslash: \`{{variable}}\` not {{variable}}

## Examples of Good vs Bad Descriptions

### ❌ BAD (too minimal):
```typescript
description: 'Create a new app. Returns app ID.'
```

### ✅ GOOD (informative):
```typescript
description: `Create a new FlowDot app. Apps are React frontend applications that can optionally use workflows as backends.

**CRITICAL CODE RULES:**
1. NO IMPORTS - React is global (use React.useState, etc.)
2. MUST include: export default MyAppName;
3. NO FORM ELEMENTS - Sandbox blocks <form> tags

**After Creating:**
Use link_app_workflow to connect workflows that the app can invoke.
Use get_app_template to see example code and patterns.`
```

## Priority Order for Enhancement

1. **Recipes** - ✅ Already excellent (list-recipes, add-recipe-step)
2. **Workflows** - Basic descriptions exist, need examples
3. **Custom Nodes** - Critical need, complex scripting format
4. **Apps** - Critical need, sandbox constraints
5. **Agent Toolkits** - Medium priority, OAuth complexity
6. **Knowledge Base** - Medium priority, straightforward
7. **Social/Sharing** - Low priority, simple operations

## Testing Your Documentation

After enhancing a tool description, test by asking:

1. **Discovery:** "Can I find this tool by reading the description?"
2. **Learning:** "Do I understand what this thing IS and WHY I'd use it?"
3. **Execution:** "Do I know exactly what parameters to pass?"
4. **Examples:** "Can I see a concrete example of proper usage?"
5. **Errors:** "Do I know what common mistakes to avoid?"

If you answer "yes" to all 5, your documentation is excellent.

## Maintenance

- Update descriptions when:
  - New features are added to a tool
  - API changes affect parameter structures
  - Common user errors are identified
  - Better examples are discovered

- Keep the DOCUMENTATION_GUIDE.md updated with new patterns and examples

## Next Steps

1. Review all tools in `src/tools/` directory
2. Identify tools with minimal descriptions
3. Enhance in priority order (see above)
4. Test with real agent queries
5. Iterate based on agent confusion points

---

**Remember:** The goal is to make the MCP server self-documenting. An AI agent should be able to learn the entire FlowDot system just by reading tool descriptions.
