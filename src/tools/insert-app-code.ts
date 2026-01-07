/**
 * insert_app_code Tool
 *
 * Inserts content after a specific pattern in app code.
 * Use this to add code at specific locations without replacing existing code.
 * Required scope: apps:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const insertAppCodeTool: Tool = {
  name: 'insert_app_code',
  description: `Inserts content after a specific pattern in app code.

Use this tool when you need to:
- Add new state declarations after existing ones
- Insert event handlers inside a component
- Add JSX elements at specific locations
- Insert code without replacing what's already there

IMPORTANT:
- after_pattern must exist EXACTLY in the code (including whitespace)
- Content is inserted immediately after the pattern (first occurrence)
- For multiple insertions at different locations, call this tool multiple times

WORKFLOW FOR BUILDING LARGE APPS:
1. Create app with skeleton: create_app + update_app with basic structure
2. Use insert_app_code to add state: after_pattern: "function MyApp() {"
   content: "\\n  const [data, setData] = React.useState(null);"
3. Use insert_app_code to add handlers, JSX, etc.

Example:
- after_pattern: "const [loading, setLoading] = React.useState(false);"
- content: "\\n  const [error, setError] = React.useState(null);"

Max code size: 102KB`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash)',
      },
      after_pattern: {
        type: 'string',
        description: 'The pattern to find (content will be inserted after this)',
      },
      content: {
        type: 'string',
        description: 'The content to insert after the pattern',
      },
      field: {
        type: 'string',
        enum: ['code', 'mobile_code'],
        description: 'Which code field to insert into (default: "code")',
      },
    },
    required: ['app_id', 'after_pattern', 'content'],
  },
};

export async function handleInsertAppCode(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const afterPattern = String(args.after_pattern);
    const content = String(args.content);
    const field = (args.field as 'code' | 'mobile_code') || 'code';

    const result = await client.insertAppCode(appId, {
      after_pattern: afterPattern,
      content,
      field,
    });

    const sizeDiff = result.new_length - result.previous_length;

    return {
      content: [{
        type: 'text',
        text: `Content inserted into app code successfully!

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
      content: [{ type: 'text', text: `Error inserting into app code: ${message}` }],
      isError: true,
    };
  }
}
