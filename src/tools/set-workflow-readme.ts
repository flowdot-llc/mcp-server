/**
 * set_workflow_readme MCP Tool
 *
 * Sets/updates the GitHub-style README (and author social-share images) shown on
 * a workflow's public page. The README renders behind the public page's
 * "User Guide" toggle above the inputs. Owner-only.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const setWorkflowReadmeTool: Tool = {
  name: 'set_workflow_readme',
  description: `Set or update the README + social-share images on a workflow's public page.

The README is markdown and renders behind the public workflow page's "User Guide" toggle
(above the inputs). Owner-only. Pass an empty string for \`readme\` to clear it.

**Example:**
\`\`\`
set_workflow_readme({ workflow_id: "abc", readme: "# How to use\\n1. …", og_image_urls: ["https://…/cover.png"] })
\`\`\``,
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
      readme: {
        type: 'string',
        description:
          'GitHub-style markdown README shown on the public /workflow/{hash} page. Pass an empty string to clear it. Max 100,000 chars.',
      },
      og_image_urls: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Author-defined social-share (OG) image URLs (absolute http(s), max 4). The first is the primary social card image.',
      },
    },
    required: ['workflow_id'],
  },
};

export async function handleSetWorkflowReadme(
  api: FlowDotApiClient,
  args: { workflow_id: string; readme?: string; og_image_urls?: string[] }
): Promise<CallToolResult> {
  try {
    const input: { readme?: string; og_image_urls?: string[] } = {};
    if (args.readme !== undefined) input.readme = args.readme;
    if (args.og_image_urls !== undefined) input.og_image_urls = args.og_image_urls;

    const result = await api.setWorkflowReadme(args.workflow_id, input);

    const readmeLen = result?.readme ? result.readme.length : 0;
    const ogCount = Array.isArray(result?.og_image_urls) ? result.og_image_urls.length : 0;

    return {
      content: [
        {
          type: 'text',
          text: `Workflow README updated.

**Workflow:** ${result?.workflow_id ?? args.workflow_id}
**README:** ${readmeLen > 0 ? `${readmeLen} chars` : 'cleared'}
**Social images:** ${ogCount}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error setting workflow README: ${message}` }],
      isError: true,
    };
  }
}
