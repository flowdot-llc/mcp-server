/**
 * link_app_toolkit Tool
 *
 * Link a toolkit to an app so the app can invoke its tools.
 * Required scope: apps:manage
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const linkAppToolkitTool: Tool = {
  name: 'link_app_toolkit',
  description: `Link a toolkit to an app. Once linked, the app can call the toolkit's tools using invokeTool().

The toolkit may be one you own OR any public toolkit. Tool calls run against the VIEWING user's own installation of the toolkit, so each user uses their own credentials — if a viewer hasn't installed/connected the toolkit, the app shows an inline "Connect" prompt.

After linking, call a tool from your app code (use the toolkit hash or the alias as the first arg):

\`\`\`javascript
const result = await invokeTool('TOOLKIT_HASH_OR_ALIAS', 'tool-name', { query: 'value' });
\`\`\``,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash) to link the toolkit to',
      },
      toolkit_hash: {
        type: 'string',
        description: 'The toolkit hash to link',
      },
      alias: {
        type: 'string',
        description: 'Optional friendly alias for the toolkit (e.g., "spotify", "trading")',
      },
    },
    required: ['app_id', 'toolkit_hash'],
  },
};

export async function handleLinkAppToolkit(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const toolkitHash = String(args.toolkit_hash);
    const alias = args.alias ? String(args.alias) : undefined;

    const result = await client.linkAppToolkit(appId, toolkitHash, alias);

    const ref = result.alias || result.hash;
    const text = `Toolkit linked successfully!

**Toolkit:** ${result.title || result.name} (${result.hash})
${result.alias ? `**Alias:** ${result.alias}` : ''}
${result.description ? `**Description:** ${result.description}` : ''}

## Usage in App Code

\`\`\`javascript
// Call a tool from this toolkit (runs against the viewer's own installation)
const result = await invokeTool('${ref}', 'tool-name', {
  // your inputs here
});
\`\`\``;

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error linking toolkit: ${message}` }],
      isError: true,
    };
  }
}
