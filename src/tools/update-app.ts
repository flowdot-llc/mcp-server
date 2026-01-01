/**
 * update_app Tool
 *
 * Update an existing FlowDot app.
 * Required scope: apps:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { UpdateAppInput } from '../types.js';

export const updateAppTool: Tool = {
  name: 'update_app',
  description: `Update an existing FlowDot app. You can update any combination of fields.

Use this to:
- Update the React code (remember: NO imports, NO exports, use React.useState, etc.)
- Change the name or description
- Add/update mobile-specific code
- Set display mode via config: { displayMode: "windowed" | "fullscreen" | "embedded" }
- Update category and tags`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash) to update',
      },
      name: {
        type: 'string',
        description: 'New name for the app',
      },
      description: {
        type: 'string',
        description: 'New description',
      },
      code: {
        type: 'string',
        description: 'Updated React code (JSX/TSX)',
      },
      mobile_code: {
        type: 'string',
        description: 'Updated mobile-specific React code',
      },
      config: {
        type: 'object',
        description: 'Updated configuration object',
      },
      category: {
        type: 'string',
        description: 'New category',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'New tags (replaces existing tags)',
      },
      mobile_compatible: {
        type: 'boolean',
        description: 'Whether the app is mobile-compatible',
      },
    },
    required: ['app_id'],
  },
};

export async function handleUpdateApp(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const updates: UpdateAppInput = {};

    if (args.name) updates.name = String(args.name);
    if (args.description !== undefined) updates.description = String(args.description);
    if (args.code !== undefined) updates.code = String(args.code);
    if (args.mobile_code !== undefined) updates.mobile_code = String(args.mobile_code);
    if (args.config) updates.config = args.config as Record<string, unknown>;
    if (args.category !== undefined) updates.category = String(args.category);
    if (args.tags) updates.tags = args.tags as string[];
    if (typeof args.mobile_compatible === 'boolean') updates.mobile_compatible = args.mobile_compatible;

    if (Object.keys(updates).length === 0) {
      return {
        content: [{ type: 'text', text: 'No updates provided. Specify at least one field to update.' }],
        isError: true,
      };
    }

    await client.updateApp(appId, updates);

    const updatedFields = Object.keys(updates).join(', ');

    return {
      content: [{ type: 'text', text: `App ${appId} updated successfully!\n\nUpdated fields: ${updatedFields}` }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error updating app: ${message}` }],
      isError: true,
    };
  }
}
