/**
 * link_app_workflow Tool
 *
 * Link a workflow to an app so the app can invoke it.
 * Required scope: apps:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const linkAppWorkflowTool: Tool = {
  name: 'link_app_workflow',
  description: `Link a workflow to an app. Once linked, the app can invoke the workflow using invokeWorkflow().

The workflow must be owned by you. After linking, use the workflow hash in your app code:

\`\`\`javascript
const result = await invokeWorkflow('WORKFLOW_HASH', { input: 'value' });
\`\`\`

You can optionally provide an alias to reference the workflow by a friendly name.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash) to link the workflow to',
      },
      workflow_hash: {
        type: 'string',
        description: 'The workflow hash to link',
      },
      alias: {
        type: 'string',
        description: 'Optional friendly alias for the workflow (e.g., "summarizer", "analyzer")',
      },
    },
    required: ['app_id', 'workflow_hash'],
  },
};

export async function handleLinkAppWorkflow(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const workflowHash = String(args.workflow_hash);
    const alias = args.alias ? String(args.alias) : undefined;

    const result = await client.linkAppWorkflow(appId, workflowHash, alias);

    const text = `Workflow linked successfully!

**Workflow:** ${result.name} (${result.hash})
${result.alias ? `**Alias:** ${result.alias}` : ''}
${result.description ? `**Description:** ${result.description}` : ''}

## Usage in App Code

\`\`\`javascript
// Invoke the workflow
const result = await invokeWorkflow('${result.hash}', {
  // your inputs here
});
\`\`\``;

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error linking workflow: ${message}` }],
      isError: true,
    };
  }
}
