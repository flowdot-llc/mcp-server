/**
 * get_app Tool
 *
 * Get detailed information about a specific app including its code.
 * Required scope: apps:read
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const getAppTool: Tool = {
  name: 'get_app',
  description: `Get detailed information about a FlowDot app, including its React code and linked workflows.

Apps are React frontend applications that can optionally call workflows as backends.

Returns the full app details including:
- Name, description, category, tags
- React code (JSX/TSX)
- Mobile code (if available)
- Configuration
- Linked workflows
- Usage statistics`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash) to retrieve',
      },
    },
    required: ['app_id'],
  },
};

export async function handleGetApp(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);

    const app = await client.getApp(appId);

  // Format linked workflows
  let workflowsSection = '';
  if (app.workflows && app.workflows.length > 0) {
    const workflowList = app.workflows.map((w) => {
      const alias = w.alias ? ` (alias: ${w.alias})` : '';
      return `  - ${w.name} (${w.hash})${alias}`;
    });
    workflowsSection = `
## Linked Workflows
${workflowList.join('\n')}

To invoke workflows from your app code, use:
\`\`\`javascript
const result = await invokeWorkflow('${app.workflows[0].hash}', { input: 'value' });
\`\`\`
`;
  }

  // Format tags
  const tags = app.tags?.length ? app.tags.join(', ') : 'None';

  // Format code section
  let codeSection = '';
  if (app.code) {
    codeSection = `
## App Code
\`\`\`jsx
${app.code}
\`\`\`
`;
  }

  // Format mobile code if exists
  let mobileCodeSection = '';
  if (app.mobile_code) {
    mobileCodeSection = `
## Mobile Code
\`\`\`jsx
${app.mobile_code}
\`\`\`
`;
  }

  // Format config if exists
  let configSection = '';
  if (app.config && Object.keys(app.config).length > 0) {
    configSection = `
## Configuration
\`\`\`json
${JSON.stringify(app.config, null, 2)}
\`\`\`
`;
  }

  const badges = [];
  if (app.is_verified) badges.push('Verified');
  if (app.is_featured) badges.push('Featured');
  const badgeStr = badges.length ? ` [${badges.join(', ')}]` : '';

    const text = `# ${app.name}${badgeStr}

**ID:** ${app.id}
**Status:** ${app.is_public ? 'Public' : 'Private'}
**Category:** ${app.category || 'Uncategorized'}
**Tags:** ${tags}
**Mobile Compatible:** ${app.mobile_compatible ? 'Yes' : 'No'}
**Can Edit:** ${app.can_edit ? 'Yes' : 'No'}

## Description
${app.description || 'No description provided.'}

## Statistics
- Upvotes: ${app.upvotes} | Downvotes: ${app.downvotes}
- Executions: ${app.execution_count}
- Clones: ${app.clone_count}
- Views: ${app.view_count || 0}

**Created:** ${app.created_at}
**Updated:** ${app.updated_at}
${app.published_at ? `**Published:** ${app.published_at}` : ''}
${workflowsSection}${codeSection}${mobileCodeSection}${configSection}`;

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting app: ${message}` }],
      isError: true,
    };
  }
}
