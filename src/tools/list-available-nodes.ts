/**
 * list_available_nodes MCP Tool
 *
 * Lists all available node types that can be added to workflows.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import type { NodeType } from '../types.js';

export const listAvailableNodesTool: Tool = {
  name: 'list_available_nodes',
  description: 'List all available node types organized by category: built-in nodes, custom nodes, and the tools of every installed toolkit (each usable as a `toolkit_{toolkitId}_{toolName}` node). Shows node types, descriptions, and capabilities.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handleListAvailableNodes(
  api: FlowDotApiClient,
  _args: Record<string, never>
): Promise<CallToolResult> {
  try {
    const response = await api.listAvailableNodes();

    // Handle null/undefined explicitly (typeof null === 'object' in JS)
    if (response === null || response === undefined) {
      return {
        content: [{ type: 'text', text: 'No node types available.' }],
      };
    }

    // Handle both array and object formats from the API
    let nodeList: NodeType[];

    if (Array.isArray(response)) {
      // Response is already an array of node types
      nodeList = response;
    } else if (typeof response === 'object' && response !== null) {
      // Response is an object keyed by node type name - extract values
      nodeList = Object.values(response);
    } else {
      return {
        content: [{ type: 'text', text: `Unexpected response format: ${typeof response}` }],
        isError: true,
      };
    }

    // Filter out any invalid entries (non-objects or objects without type)
    nodeList = nodeList.filter((node): node is NodeType =>
      node !== null &&
      typeof node === 'object' &&
      typeof (node as NodeType).type === 'string'
    );

    if (nodeList.length === 0) {
      return {
        content: [{ type: 'text', text: 'No node types available.' }],
      };
    }

    // Group by category
    const byCategory: Record<string, NodeType[]> = {};
    for (const node of nodeList) {
      const category = node.category || 'other';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(node);
    }

    const lines = ['## Available Node Types', ''];

    for (const [category, categoryNodes] of Object.entries(byCategory)) {
      lines.push(`### ${category}`);
      for (const node of categoryNodes) {
        const experimental = node.experimental ? ' [EXPERIMENTAL]' : '';
        const pinned = node.pinned ? ' [PINNED]' : '';
        lines.push(`- **${node.title}** (\`${node.type}\`)${experimental}${pinned}`);
        lines.push(`  ${node.description}`);
        if (node.use_case) {
          lines.push(`  Use case: ${node.use_case}`);
        }
      }
      lines.push('');
    }

    // Add custom node documentation section
    lines.push('---');
    lines.push('');
    lines.push('### custom');
    lines.push('- **Custom Nodes** - User-defined nodes with JavaScript logic');
    lines.push('  - Script must define: `function processData(inputs, properties) { return { OutputName: value }; }`');
    lines.push('  - Valid dataTypes: text, number, boolean, json, array, any');
    lines.push('  - Use `list_custom_nodes` to see your custom nodes');
    lines.push('  - Use `create_custom_node` to create new ones');
    lines.push('  - Use `get_custom_node_template` to generate script boilerplate');
    lines.push('');

    // Toolkit tool nodes: every tool of an INSTALLED toolkit is usable as a workflow node
    // typed `toolkit_{toolkitId}_{toolName}`. This is how a workflow calls signed third-party
    // APIs (Kalshi, Schwab, etc.) deterministically, with no agent/LLM in the loop.
    try {
      const installs = (await api.listInstalledToolkits()) as unknown as Array<Record<string, unknown>>;
      const active = (installs || []).filter((i) => i && i.is_active);
      if (active.length > 0) {
        lines.push('---');
        lines.push('');
        lines.push('### toolkit (installed)');
        lines.push('Every tool of an installed toolkit can be added as a workflow node. Add it with');
        lines.push('`add_node({ node_type: "toolkit_{toolkitId}_{toolName}" })`. The tool\'s inputs become');
        lines.push('input sockets; each required credential becomes a `_cred_<KEY>` input (resolved from your');
        lines.push('installation at run time); the node outputs `result` (json). No agent/LLM is involved — a');
        lines.push('workflow can fetch + write real APIs deterministically. Get exact tool names with');
        lines.push('`list_toolkit_tools("<toolkitId>")`.');
        for (const inst of active) {
          const tid = String(inst.toolkit_id ?? '');
          const title = String(inst.toolkit_title ?? inst.toolkit_name ?? tid);
          const nested = inst.toolkit as Record<string, unknown> | undefined;
          const count = (nested && nested.tools_count) ?? inst.tools_count ?? '?';
          lines.push(`- **${title}** — node type: \`toolkit_${tid}_{toolName}\` (${count} tools; \`list_toolkit_tools("${tid}")\`)`);
        }
        lines.push('');
      }
    } catch {
      // Non-fatal: toolkit enumeration is supplementary to the built-in catalog.
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing available nodes: ${message}` }],
      isError: true,
    };
  }
}
