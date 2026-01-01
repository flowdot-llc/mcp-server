/**
 * create_custom_node MCP Tool
 *
 * Create a new custom node with script code.
 * Scope: custom_nodes:manage
 */
import { validateCustomNodeScript, formatWarnings } from '../utils/script-validator.js';
export const createCustomNodeTool = {
    name: 'create_custom_node',
    description: `Create a new custom node with inputs, outputs, and script code.

SCRIPT FORMAT (REQUIRED):
\`\`\`javascript
function processData(inputs, properties, llm) {
  // Access inputs by their exact names
  const myInput = inputs.InputName || '';
  const myProp = properties.propertyKey;

  // Your logic here

  // Return object with keys matching output names EXACTLY
  return {
    OutputName: result
  };
}
\`\`\`

VALID DATA TYPES: text, number, boolean, json, array, any

IMPORTANT RULES:
- The processData function is REQUIRED and auto-invoked by the runtime
- Input/output names are case-sensitive
- Return object keys must match defined output names exactly
- Top-level return statements are NOT allowed (must be inside processData)
- No require/import, eval, process, global, or file system access
- Available globals: console, JSON, Math, String.prototype.trim, Array.isArray

LLM CAPABILITY:
Set llm_enabled: true to allow the node to make AI/LLM calls. When enabled:
- Users will see Quick Select buttons (FlowDot, Simple, Capable, Complex) to choose their AI model
- Your script can call llm.call() to make LLM requests

LLM CALL SYNTAX:
\`\`\`javascript
const result = llm.call({
  prompt: "Your prompt here",           // Required
  systemPrompt: "System instructions",  // Optional
  temperature: 0.7,                      // Optional (0-2, default: 0.7)
  maxTokens: 1000                        // Optional (default: 1000)
});
\`\`\`

LLM RESPONSE STRUCTURE:
\`\`\`javascript
{
  success: boolean,      // true if call succeeded
  response: string,      // The LLM's response text
  error: string | null,  // Error message if failed
  provider: string,      // Provider used (e.g., "openai")
  model: string,         // Model used (e.g., "gpt-4")
  tokens: { prompt, response, total }
}
\`\`\`

EXAMPLE WITH LLM:
\`\`\`javascript
function processData(inputs, properties, llm) {
  const result = llm.call({
    prompt: \`Summarize: \${inputs.Text}\`,
    temperature: 0.5
  });
  return {
    Summary: result.success ? result.response : result.error
  };
}
\`\`\``,
    inputSchema: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Unique name for the custom node (e.g., "my-data-processor")',
            },
            title: {
                type: 'string',
                description: 'Display title for the node (e.g., "My Data Processor")',
            },
            description: {
                type: 'string',
                description: 'Description of what the node does',
            },
            category: {
                type: 'string',
                description: 'Category for the node (default: "custom")',
            },
            version: {
                type: 'string',
                description: 'Version string (default: "1.0.0")',
            },
            icon: {
                type: 'string',
                description: 'Icon name for the node',
            },
            inputs: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Input name (case-sensitive, used as inputs.Name in script)' },
                        dataType: { type: 'string', enum: ['text', 'number', 'boolean', 'json', 'array', 'any'], description: 'Data type: text, number, boolean, json, array, or any' },
                        description: { type: 'string' },
                    },
                    required: ['name', 'dataType'],
                },
                description: 'Array of input sockets. Names are accessed via inputs.Name in processData()',
            },
            outputs: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Output name (must match return key in processData exactly)' },
                        dataType: { type: 'string', enum: ['text', 'number', 'boolean', 'json', 'array', 'any'], description: 'Data type: text, number, boolean, json, array, or any' },
                        description: { type: 'string' },
                    },
                    required: ['name', 'dataType'],
                },
                description: 'Array of output sockets. Return { OutputName: value } from processData()',
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
                description: 'Array of configurable properties',
            },
            script_code: {
                type: 'string',
                description: 'JavaScript code for the node logic (max 50KB)',
            },
            execution_timeout: {
                type: 'number',
                description: 'Execution timeout in ms (1000-30000, default: 5000)',
            },
            memory_limit: {
                type: 'number',
                description: 'Memory limit in MB (32-256, default: 128)',
            },
            visibility: {
                type: 'string',
                enum: ['private', 'public', 'unlisted'],
                description: 'Node visibility (default: "private")',
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags for categorization (max 10)',
            },
            llm_enabled: {
                type: 'boolean',
                description: 'Enable LLM capability. When true, users see Quick Select buttons and script can use llm.call()',
            },
        },
        required: ['name', 'title', 'description', 'inputs', 'outputs', 'script_code'],
    },
};
export async function handleCreateCustomNode(api, args) {
    try {
        // Validate script before creation
        const warnings = validateCustomNodeScript(args.script_code, args.outputs, args.inputs);
        const warningsText = formatWarnings(warnings);
        const result = await api.createCustomNode({
            name: args.name,
            title: args.title,
            description: args.description,
            category: args.category,
            version: args.version,
            icon: args.icon,
            inputs: args.inputs,
            outputs: args.outputs,
            properties: args.properties,
            script_code: args.script_code,
            execution_timeout: args.execution_timeout,
            memory_limit: args.memory_limit,
            visibility: args.visibility,
            tags: args.tags,
            llm_config: args.llm_enabled ? { enabled: true } : undefined,
        });
        const lines = [
            `## Custom Node Created Successfully`,
            ``,
            `**ID:** ${result.id}`,
            `**Name:** ${result.name}`,
            `**Created:** ${result.created_at}`,
            ``,
            `You can now use this custom node in your workflows.`,
        ];
        // Append warnings if any
        if (warningsText) {
            lines.push(warningsText);
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error creating custom node: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=create-custom-node.js.map