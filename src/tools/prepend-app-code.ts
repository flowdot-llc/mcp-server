/**
 * prepend_app_code Tool
 *
 * Prepends content to the beginning of app code.
 * Use this to add constants, configuration, or setup code at the start.
 * Required scope: apps:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const prependAppCodeTool: Tool = {
  name: 'prepend_app_code',
  description: `Prepends content to the beginning of app code.

CRITICAL: Remember export rules:
- NO IMPORTS - React is global
- App entry file MUST end with: export default MyAppName;

Use this tool when you need to:
- Add constants or configuration at the start of the code
- Add comments or documentation at the beginning
- Insert setup code before the main component

NOTE: Since FlowDot apps don't use imports, this is less commonly needed.
For most cases, use edit_app_code or insert_app_code instead.

Example usage:
- content: "// App Configuration\\nconst API_URL = 'https://api.example.com';\\n\\n"

Max code size: 102KB`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash)',
      },
      content: {
        type: 'string',
        description: 'The content to prepend to the beginning of the code',
      },
      field: {
        type: 'string',
        enum: ['code', 'mobile_code'],
        description: 'Which code field to prepend to (default: "code")',
      },
    },
    required: ['app_id', 'content'],
  },
};

export async function handlePrependAppCode(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const content = String(args.content);
    const field = (args.field as 'code' | 'mobile_code') || 'code';

    const result = await client.prependAppCode(appId, {
      content,
      field,
    });

    const sizeDiff = result.new_length - result.previous_length;

    return {
      content: [{
        type: 'text',
        text: `Content prepended to app code successfully!

App ID: ${result.id}
Field: ${result.field}
Previous size: ${result.previous_length} bytes
New size: ${result.new_length} bytes (+${sizeDiff} bytes)
Updated at: ${result.updated_at}`,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error prepending to app code: ${message}` }],
      isError: true,
    };
  }
}
