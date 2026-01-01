/**
 * update_custom_node MCP Tool
 *
 * Update an existing custom node.
 * Scope: custom_nodes:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { CustomNodeSocket, CustomNodeProperty } from '../types.js';
import { validateCustomNodeScript, formatWarnings } from '../utils/script-validator.js';

export const updateCustomNodeTool: Tool = {
  name: 'update_custom_node',
  description: `Update an existing custom node. Only provide fields you want to change.

When updating script_code, remember:
- Must define: function processData(inputs, properties, llm) { return { OutputName: value }; }
- Valid dataTypes: text, number, boolean, json, array, any
- Return keys must match output names exactly (case-sensitive)

LLM CAPABILITY:
Set llm_enabled: true to enable AI/LLM calls in your custom node.
- Users will see Quick Select buttons (FlowDot, Simple, Capable, Complex)
- Your script can call llm.call({ prompt, systemPrompt, temperature, maxTokens })
- Response: { success, response, error, provider, model, tokens }`,
  inputSchema: {
    type: 'object',
    properties: {
      node_id: {
        type: 'string',
        description: 'The custom node ID (hash) to update',
      },
      name: {
        type: 'string',
        description: 'New name for the custom node',
      },
      title: {
        type: 'string',
        description: 'New display title',
      },
      description: {
        type: 'string',
        description: 'New description',
      },
      category: {
        type: 'string',
        description: 'New category',
      },
      version: {
        type: 'string',
        description: 'New version string',
      },
      icon: {
        type: 'string',
        description: 'New icon name',
      },
      inputs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            dataType: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['name', 'dataType'],
        },
        description: 'New array of input sockets',
      },
      outputs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            dataType: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['name', 'dataType'],
        },
        description: 'New array of output sockets',
      },
      properties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            value: {},
            dataType: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['key', 'dataType'],
        },
        description: 'New array of configurable properties',
      },
      script_code: {
        type: 'string',
        description: 'New JavaScript code for the node logic',
      },
      execution_timeout: {
        type: 'number',
        description: 'New execution timeout in ms (1000-30000)',
      },
      memory_limit: {
        type: 'number',
        description: 'New memory limit in MB (32-256)',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'New tags for categorization',
      },
      llm_enabled: {
        type: 'boolean',
        description: 'Enable/disable LLM capability. When true, users see Quick Select and script can use llm.call()',
      },
    },
    required: ['node_id'],
  },
};

export async function handleUpdateCustomNode(
  api: FlowDotApiClient,
  args: {
    node_id: string;
    name?: string;
    title?: string;
    description?: string;
    category?: string;
    version?: string;
    icon?: string;
    inputs?: CustomNodeSocket[];
    outputs?: CustomNodeSocket[];
    properties?: CustomNodeProperty[];
    script_code?: string;
    execution_timeout?: number;
    memory_limit?: number;
    tags?: string[];
    llm_enabled?: boolean;
  }
): Promise<CallToolResult> {
  try {
    const { node_id, llm_enabled, ...updates } = args;

    // Convert llm_enabled to llm_config format
    const finalUpdates: Record<string, unknown> = { ...updates };
    if (llm_enabled !== undefined) {
      finalUpdates.llm_config = llm_enabled ? { enabled: true } : null;
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(finalUpdates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(filteredUpdates).length === 0) {
      return {
        content: [{ type: 'text', text: 'No updates provided. Please specify at least one field to update.' }],
        isError: true,
      };
    }

    // Validate script if script_code is being updated
    let warningsText = '';
    if (args.script_code) {
      if (args.outputs) {
        // Full validation possible
        const warnings = validateCustomNodeScript(args.script_code, args.outputs, args.inputs);
        warningsText = formatWarnings(warnings);
      } else {
        // Partial validation - can only check syntax and security patterns
        const warnings = validateCustomNodeScript(args.script_code, []);
        warningsText = formatWarnings(warnings);
        if (!warningsText && warnings.length === 0) {
          // Add note that full validation wasn't possible
          warningsText = '\n\n**Note:** Output name validation skipped (outputs not provided in update).';
        }
      }
    }

    await api.updateCustomNode(node_id, filteredUpdates);

    const lines = [
      `## Custom Node Updated Successfully`,
      ``,
      `**Node ID:** ${node_id}`,
      `**Fields Updated:** ${Object.keys(filteredUpdates).join(', ')}`,
    ];

    if (warningsText) {
      lines.push(warningsText);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error updating custom node: ${message}` }],
      isError: true,
    };
  }
}
