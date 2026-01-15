/**
 * create_app Tool
 *
 * Create a new FlowDot app.
 * Required scope: apps:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { CreateAppInput } from '../types.js';

export const createAppTool: Tool = {
  name: 'create_app',
  description: `Create a new FlowDot app. Apps are React frontend applications that can optionally use workflows as backends.

All apps are multi-file by default. When created, an initial App.jsx entry file is automatically generated.
Use create_app_file, update_app_file, and other file tools to manage additional files.

## EXECUTION ENVIRONMENT
Apps run in a sandboxed browser iframe with:
- React 18 (global - use React.useState, React.useEffect, etc.)
- Tailwind CSS (full utility classes available)
- FlowDot color tokens: primary-50 to primary-900 (sage green), secondary-50 to secondary-900 (warm orange)

## CRITICAL CODE RULES
1. NO IMPORTS - React is global, just use React.useState(), React.useEffect(), etc.
2. MUST include export default at the end: export default MyAppName;
3. Function must be named: function MyAppName() { ... }
4. Use Tailwind CSS for ALL styling (no inline style objects, no CSS-in-JS)
5. NO FORM ELEMENTS - Never use <form> tags (sandbox blocks form submissions)
6. ALL BUTTONS need type="button" to prevent unwanted form submission behavior

## IMPORTANT: NO FORM ELEMENTS
The sandbox does not allow form submissions. NEVER use <form> tags.

❌ WRONG:
<form onSubmit={handleSubmit}>
  <button type="submit">Submit</button>
</form>

✅ CORRECT:
<div>
  <input onKeyDown={(e) => e.key === 'Enter' && handleClick()} />
  <button type="button" onClick={handleClick}>Submit</button>
</div>

## BUTTON BEST PRACTICES
Always add type="button" to prevent default form behavior:
<button type="button" onClick={handleClick}>Click Me</button>

## DISPLAY MODES
Apps can be configured to display in three modes via config.displayMode:
- "windowed": Standard view with FlowDot header (default)
- "fullscreen": Full viewport, minimal floating control bar
- "embedded": No FlowDot UI, for iframe embedding

## WORKFLOW INTEGRATION
Apps can invoke linked workflows using: await invokeWorkflow('workflow-hash', { inputName: value })

## WORKFLOW RESPONSE STRUCTURE
invokeWorkflow returns: { success: boolean, data: { [nodeId]: NodeOutput } }

Each NodeOutput has:
- nodeId, nodeTitle, nodeType
- outputs: { [socketName]: { value, metadata } }

IMPORTANT: Use this helper to extract outputs safely:
const getNodeOutput = (result, nodeTitle, socketName = 'Consolidated Text') => {
  if (!result?.data) return null;
  const node = Object.values(result.data).find(n => n.nodeTitle === nodeTitle);
  return node?.outputs?.[socketName]?.value;
};

Example:
const result = await invokeWorkflow('hash', { input });
const data = getNodeOutput(result, 'Output Node');
if (data) { /* use data */ }

After creating an app, use link_app_workflow to connect workflows that the app can invoke.
Use get_app_template to see example code and patterns.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: 'Name of the app',
      },
      description: {
        type: 'string',
        description: 'Description of what the app does',
      },
      code: {
        type: 'string',
        description: 'Initial React code for App.jsx entry file (optional - defaults to Hello World)',
      },
      config: {
        type: 'object',
        description: 'Configuration object for the app (optional)',
      },
      category: {
        type: 'string',
        description: 'Category for the app (e.g., "productivity", "ai-tools", "utilities")',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for discoverability (max 10)',
      },
      mobile_compatible: {
        type: 'boolean',
        description: 'Whether the app is mobile-compatible (default: false)',
      },
    },
    required: ['name'],
  },
};

export async function handleCreateApp(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const input: CreateAppInput = {
      name: String(args.name),
    };

    if (args.description) input.description = String(args.description);
    if (args.code) input.code = String(args.code);
    if (args.config) input.config = args.config as Record<string, unknown>;
    if (args.category) input.category = String(args.category);
    if (args.tags) input.tags = args.tags as string[];
    if (typeof args.mobile_compatible === 'boolean') input.mobile_compatible = args.mobile_compatible;

    const result = await client.createApp(input);

    const text = `App created successfully!

**Name:** ${result.name}
**ID:** ${result.id}
**Created:** ${result.created_at}
**Entry File:** App.jsx (automatically created)

## Next Steps

1. **Edit entry file**:
   Use update_app_file or update_app to modify the App.jsx code.

2. **Add more files**:
   Use create_app_file to add components, utilities, or other files.

3. **Link workflows**:
   Use link_app_workflow to connect workflows that the app can invoke:
   \`link_app_workflow(app_id: "${result.id}", workflow_hash: "YOUR_WORKFLOW_HASH")\`

4. **Test locally**:
   Preview your app in the FlowDot UI at https://flowdot.ai/apps/${result.id}

5. **Publish**:
   When ready, use publish_app to make it public:
   \`publish_app(app_id: "${result.id}")\`

## Example Code Structure

\`\`\`jsx
function MyApp() {
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleSubmit = async (input) => {
    setLoading(true);
    setError(null);
    try {
      const output = await invokeWorkflow('YOUR_WORKFLOW_HASH', { input });
      setResult(output);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">${result.name}</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {/* Your UI here using Tailwind classes */}
    </div>
  );
}
\`\`\`

Use get_app_template for more complete examples.`;

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error creating app: ${message}` }],
      isError: true,
    };
  }
}
