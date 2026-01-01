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

## EXECUTION ENVIRONMENT
Apps run in a sandboxed browser iframe with:
- React 18 (global - use React.useState, React.useEffect, etc.)
- Tailwind CSS (full utility classes available)
- FlowDot color tokens: primary-50 to primary-900 (sage green), secondary-50 to secondary-900 (warm orange)

## CRITICAL CODE RULES
1. NO IMPORTS - React is global, just use React.useState(), React.useEffect(), etc.
2. NO EXPORTS - Just define your function, the system handles the rest
3. Function must be named: function MyAppName() { ... }
4. Use Tailwind CSS for ALL styling (no inline style objects, no CSS-in-JS)

## DISPLAY MODES
Apps can be configured to display in three modes via config.displayMode:
- "windowed": Standard view with FlowDot header (default)
- "fullscreen": Full viewport, minimal floating control bar
- "embedded": No FlowDot UI, for iframe embedding

## WORKFLOW INTEGRATION
Apps can invoke linked workflows using: await invokeWorkflow('workflow-hash', { inputName: value })

The function returns workflow results in this format:
{
  "data": {
    "[nodeId]": {
      "nodeId": "uuid",
      "nodeTitle": "My Output Node",
      "nodeType": "text_output",
      "outputs": {
        "Consolidated Text": { "value": "the actual data", "metadata": {...} }
      }
    }
  }
}

IMPORTANT: Use this helper function to extract outputs by node title:
const getNodeOutput = (result, nodeTitle, socketName = 'Consolidated Text') => {
  const node = Object.values(result?.data || {}).find(n => n.nodeTitle === nodeTitle);
  return node?.outputs?.[socketName]?.value;
};

Example: const weatherData = getNodeOutput(result, 'Weather Results', 'Consolidated Text');

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
        description: 'React code for the app (JSX/TSX)',
      },
      mobile_code: {
        type: 'string',
        description: 'Mobile-specific React code (optional)',
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
    if (args.mobile_code) input.mobile_code = String(args.mobile_code);
    if (args.config) input.config = args.config as Record<string, unknown>;
    if (args.category) input.category = String(args.category);
    if (args.tags) input.tags = args.tags as string[];
    if (typeof args.mobile_compatible === 'boolean') input.mobile_compatible = args.mobile_compatible;

    const result = await client.createApp(input);

    const text = `App created successfully!

**Name:** ${result.name}
**ID:** ${result.id}
**Created:** ${result.created_at}

## Next Steps

1. **Add code** (if not provided):
   Use update_app to add or modify the React code.

2. **Link workflows**:
   Use link_app_workflow to connect workflows that the app can invoke:
   \`link_app_workflow(app_id: "${result.id}", workflow_hash: "YOUR_WORKFLOW_HASH")\`

3. **Test locally**:
   Preview your app in the FlowDot UI at https://flowdot.ai/apps/${result.id}

4. **Publish**:
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
