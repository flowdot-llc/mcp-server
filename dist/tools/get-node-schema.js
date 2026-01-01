/**
 * get_node_schema MCP Tool
 *
 * Gets the full schema for a specific node type.
 */
export const getNodeSchemaTool = {
    name: 'get_node_schema',
    description: 'Get the full schema for a specific node type including inputs, outputs, and properties.',
    inputSchema: {
        type: 'object',
        properties: {
            node_type: {
                type: 'string',
                description: 'The node type identifier (e.g., "LLMNode", "HTTPRequestNode")',
            },
        },
        required: ['node_type'],
    },
};
export async function handleGetNodeSchema(api, args) {
    try {
        const schema = await api.getNodeSchema(args.node_type);
        const lines = [
            `## ${schema.title} (\`${schema.type}\`)`,
            '',
            schema.description,
            '',
            `**Category:** ${schema.category}`,
            `**Version:** ${schema.version}`,
        ];
        if (schema.experimental) {
            lines.push('**Status:** Experimental');
        }
        // Inputs
        if (schema.inputs && schema.inputs.length > 0) {
            lines.push('', '### Inputs');
            for (const input of schema.inputs) {
                lines.push(`- **${input.name}** (${input.dataType})`);
            }
        }
        // Outputs
        if (schema.outputs && schema.outputs.length > 0) {
            lines.push('', '### Outputs');
            for (const output of schema.outputs) {
                lines.push(`- **${output.name}** (${output.dataType})`);
            }
        }
        // Properties
        if (schema.properties && schema.properties.length > 0) {
            lines.push('', '### Properties');
            for (const prop of schema.properties) {
                const desc = prop.description ? ` - ${prop.description}` : '';
                const defaultVal = prop.value !== undefined ? ` (default: ${JSON.stringify(prop.value)})` : '';
                lines.push(`- **${prop.key}** (${prop.dataType})${defaultVal}${desc}`);
                if (prop.options && prop.options.length > 0) {
                    lines.push(`  Options: ${prop.options.map(o => JSON.stringify(o)).join(', ')}`);
                }
            }
        }
        // Add script interface for custom nodes
        const isCustomNode = args.node_type.startsWith('custom_node_') ||
            schema.category === 'custom' ||
            schema.type?.startsWith('custom_node_');
        if (isCustomNode) {
            lines.push('', '### Script Interface');
            lines.push('```javascript');
            lines.push('function processData(inputs, properties) {');
            // List available inputs
            if (schema.inputs && schema.inputs.length > 0) {
                lines.push('  // Available inputs:');
                for (const inp of schema.inputs) {
                    lines.push(`  // - inputs.${inp.name} (${inp.dataType})`);
                }
            }
            // List available properties
            if (schema.properties && schema.properties.length > 0) {
                lines.push('  // Available properties:');
                for (const prop of schema.properties) {
                    lines.push(`  // - properties.${prop.key} (${prop.dataType})`);
                }
            }
            lines.push('');
            lines.push('  // Your logic here');
            lines.push('');
            lines.push('  return {');
            // List expected returns
            if (schema.outputs && schema.outputs.length > 0) {
                for (let i = 0; i < schema.outputs.length; i++) {
                    const out = schema.outputs[i];
                    const comma = i < schema.outputs.length - 1 ? ',' : '';
                    lines.push(`    ${out.name}: value${comma} // ${out.dataType}`);
                }
            }
            lines.push('  };');
            lines.push('}');
            lines.push('```');
            lines.push('');
            lines.push('**Available globals:** console, JSON, Math, String.prototype.trim, Array.isArray');
            lines.push('**Restrictions:** No require/import, eval, process, global, or file system access');
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error getting node schema: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=get-node-schema.js.map