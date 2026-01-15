/**
 * append_app_code Tool
 *
 * Appends content to the end of app code.
 * Use this to add new functions, components, or closing code.
 * Required scope: apps:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const appendAppCodeTool: Tool = {
  name: 'append_app_code',
  description: `Appends content to the end of app code.

CRITICAL: Remember export rules:
- App entry file MUST end with: export default MyAppName;
- When appending, content goes AFTER the closing brace but BEFORE the export
- Use insert_app_code if you need to place code before the export statement

Use this tool when you need to:
- Add helper functions after the main component
- Add additional components at the end
- Build app code incrementally by adding sections

WORKFLOW FOR BUILDING LARGE APPS:
1. Create app: create_app(name: "MyApp")
2. Set main component skeleton: update_app(code: "function MyApp() { ... } export default MyApp;")
3. Use insert_app_code to add helper functions BEFORE the export

Example usage:
- If file ends with "export default MyApp;", use insert_app_code instead
- Or use edit_app_code to replace content before the export

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
        description: 'The content to append to the end of the code',
      },
      field: {
        type: 'string',
        enum: ['code', 'mobile_code'],
        description: 'Which code field to append to (default: "code")',
      },
    },
    required: ['app_id', 'content'],
  },
};

export async function handleAppendAppCode(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const content = String(args.content);
    const field = (args.field as 'code' | 'mobile_code') || 'code';

    const result = await client.appendAppCode(appId, {
      content,
      field,
    });

    const sizeDiff = result.new_length - result.previous_length;

    return {
      content: [{
        type: 'text',
        text: `Content appended to app code successfully!

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
      content: [{ type: 'text', text: `Error appending to app code: ${message}` }],
      isError: true,
    };
  }
}
