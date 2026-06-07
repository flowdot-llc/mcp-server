/**
 * unlink_app_toolkit Tool
 *
 * Unlink a toolkit from an app.
 * Required scope: apps:manage
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const unlinkAppToolkitTool: Tool = {
  name: 'unlink_app_toolkit',
  description: `Unlink a toolkit from an app. After unlinking, the app will no longer be able to invoke that toolkit's tools.

Make sure to update your app code to remove any invokeTool() calls that reference the unlinked toolkit.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash)',
      },
      toolkit_hash: {
        type: 'string',
        description: 'The toolkit hash to unlink',
      },
    },
    required: ['app_id', 'toolkit_hash'],
  },
};

export async function handleUnlinkAppToolkit(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const toolkitHash = String(args.toolkit_hash);

    await client.unlinkAppToolkit(appId, toolkitHash);

    return {
      content: [{ type: 'text', text: `Toolkit ${toolkitHash} unlinked from app ${appId} successfully.` }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error unlinking toolkit: ${message}` }],
      isError: true,
    };
  }
}
