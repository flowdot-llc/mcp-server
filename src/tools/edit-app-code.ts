/**
 * edit_app_code Tool
 *
 * Performs exact string replacement in app code.
 * Similar to find-and-replace - replaces old_string with new_string.
 * Required scope: apps:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const editAppCodeTool: Tool = {
  name: 'edit_app_code',
  description: `Performs exact string replacement in app code. Similar to find-and-replace.

Use this tool when you need to:
- Modify specific sections of existing app code
- Replace a function, component, or code block
- Fix bugs or update logic in the code

IMPORTANT RULES:
- old_string must exist EXACTLY in the code (including whitespace/indentation)
- If old_string appears multiple times, the operation fails unless replace_all=true
- Provide enough context in old_string to make it unique

WORKFLOW FOR BUILDING LARGE APPS:
1. Create app with minimal code: create_app(name: "MyApp")
2. Set initial skeleton: update_app(code: "function MyApp() { return <div>Loading...</div>; }")
3. Use edit_app_code to incrementally replace/expand sections
4. Use append_app_code to add helper functions at the end

Example:
- old_string: "return <div>Loading...</div>;"
- new_string: "return <div className=\"p-4\"><h1>Hello World</h1></div>;"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash) to edit',
      },
      old_string: {
        type: 'string',
        description: 'The exact string to find and replace (must exist in code)',
      },
      new_string: {
        type: 'string',
        description: 'The replacement string',
      },
      field: {
        type: 'string',
        enum: ['code', 'mobile_code'],
        description: 'Which code field to edit (default: "code")',
      },
      replace_all: {
        type: 'boolean',
        description: 'If true, replace all occurrences. If false (default), fails when multiple matches found.',
      },
    },
    required: ['app_id', 'old_string', 'new_string'],
  },
};

export async function handleEditAppCode(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const oldString = String(args.old_string);
    const newString = String(args.new_string);
    const field = (args.field as 'code' | 'mobile_code') || 'code';
    const replaceAll = Boolean(args.replace_all);

    const result = await client.editAppCode(appId, {
      old_string: oldString,
      new_string: newString,
      field,
      replace_all: replaceAll,
    });

    const sizeDiff = result.new_length - result.previous_length;
    const sizeChange = sizeDiff >= 0 ? `+${sizeDiff}` : String(sizeDiff);

    return {
      content: [{
        type: 'text',
        text: `App code edited successfully!

App ID: ${result.id}
Field: ${result.field}
Previous size: ${result.previous_length} bytes
New size: ${result.new_length} bytes (${sizeChange} bytes)
Updated at: ${result.updated_at}`,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Try to extract debug info from error message if it's a JSON parse failure issue
    let debugInfo = '';
    if (message.includes('not found')) {
      debugInfo = '\n\nTroubleshooting tips:\n' +
        '- Ensure old_string matches EXACTLY (including whitespace and line endings)\n' +
        '- Check for CRLF vs LF newline differences\n' +
        '- Use get_app to view the current code and copy the exact string';
    }

    return {
      content: [{ type: 'text', text: `Error editing app code: ${message}${debugInfo}` }],
      isError: true,
    };
  }
}
