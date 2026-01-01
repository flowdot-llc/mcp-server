/**
 * get_custom_node_template MCP Tool
 *
 * Generate a working script template for a custom node.
 * This is a local tool - no API call needed.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

interface InputDef {
  name: string;
  dataType: 'text' | 'number' | 'boolean' | 'json' | 'array' | 'any';
  description?: string;
}

interface OutputDef {
  name: string;
  dataType: 'text' | 'number' | 'boolean' | 'json' | 'array' | 'any';
  description?: string;
}

interface PropertyDef {
  key: string;
  dataType: string;
  description?: string;
}

export const getCustomNodeTemplateTool: Tool = {
  name: 'get_custom_node_template',
  description: `Generate a working script template for a custom node based on inputs and outputs.

Use this tool to get a correctly formatted script before creating a custom node.
The generated template includes:
- The required processData(inputs, properties, llm) function
- Input variable declarations with proper defaults
- Property access (if properties defined)
- LLM call examples (if llm_enabled is true)
- Return statement with all output names

VALID DATA TYPES: text, number, boolean, json, array, any

LLM CAPABILITY:
Set llm_enabled: true to generate a template that includes llm.call() examples.
When LLM is enabled, users will see Quick Select buttons to choose their AI model.`,
  inputSchema: {
    type: 'object',
    properties: {
      inputs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Input name' },
            dataType: {
              type: 'string',
              enum: ['text', 'number', 'boolean', 'json', 'array', 'any'],
              description: 'Data type',
            },
            description: { type: 'string', description: 'Optional description' },
          },
          required: ['name', 'dataType'],
        },
        description: 'Array of input definitions',
      },
      outputs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Output name' },
            dataType: {
              type: 'string',
              enum: ['text', 'number', 'boolean', 'json', 'array', 'any'],
              description: 'Data type',
            },
            description: { type: 'string', description: 'Optional description' },
          },
          required: ['name', 'dataType'],
        },
        description: 'Array of output definitions',
      },
      properties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Property key' },
            dataType: { type: 'string', description: 'Property data type' },
            description: { type: 'string', description: 'Optional description' },
          },
          required: ['key', 'dataType'],
        },
        description: 'Optional array of property definitions',
      },
      llm_enabled: {
        type: 'boolean',
        description: 'If true, generate template with llm.call() examples',
      },
    },
    required: ['inputs', 'outputs'],
  },
};

function getDefaultValue(dataType: string): string {
  switch (dataType) {
    case 'text':
      return "''";
    case 'number':
      return '0';
    case 'boolean':
      return 'false';
    case 'json':
      return '{}';
    case 'array':
      return '[]';
    case 'any':
    default:
      return 'null';
  }
}

export async function handleGetCustomNodeTemplate(args: {
  inputs: InputDef[];
  outputs: OutputDef[];
  properties?: PropertyDef[];
  llm_enabled?: boolean;
}): Promise<CallToolResult> {
  const lines: string[] = [];

  lines.push('function processData(inputs, properties, llm) {');

  // Add input declarations
  if (args.inputs.length > 0) {
    lines.push('  // Get inputs');
    for (const input of args.inputs) {
      const defaultVal = getDefaultValue(input.dataType);
      const comment = input.description ? ` // ${input.description}` : '';
      lines.push(`  const ${input.name} = inputs.${input.name} || ${defaultVal};${comment}`);
    }
    lines.push('');
  }

  // Add property declarations
  if (args.properties && args.properties.length > 0) {
    lines.push('  // Get properties');
    for (const prop of args.properties) {
      const defaultVal = getDefaultValue(prop.dataType);
      const comment = prop.description ? ` // ${prop.description}` : '';
      lines.push(`  const ${prop.key} = properties.${prop.key} || ${defaultVal};${comment}`);
    }
    lines.push('');
  }

  // Add LLM example if enabled
  if (args.llm_enabled) {
    lines.push('  // LLM call example (llm_enabled is true)');
    lines.push('  // Users will see Quick Select buttons to choose their AI model');
    lines.push('  const llmResult = llm.call({');
    lines.push('    prompt: `Your prompt here using ${' + (args.inputs[0]?.name || 'inputs.YourInput') + '}`,');
    lines.push('    systemPrompt: "Optional system instructions",  // Optional');
    lines.push('    temperature: 0.7,  // Optional (0-2)');
    lines.push('    maxTokens: 1000    // Optional');
    lines.push('  });');
    lines.push('');
    lines.push('  // Handle LLM response');
    lines.push('  if (!llmResult.success) {');
    lines.push('    console.error("LLM error:", llmResult.error);');
    lines.push('  }');
    lines.push('');
  } else {
    lines.push('  // TODO: Add your logic here');
    lines.push('');
  }

  // Add return statement
  lines.push('  return {');
  for (let i = 0; i < args.outputs.length; i++) {
    const output = args.outputs[i];
    const comment = output.description ? ` // ${output.description}` : ` // ${output.dataType}`;
    const comma = i < args.outputs.length - 1 ? ',' : '';
    // Default return value based on first input or sensible default
    const returnVal =
      args.inputs.length > 0 ? args.inputs[0].name : getDefaultValue(output.dataType);
    lines.push(`    ${output.name}: ${returnVal}${comma}${comment}`);
  }
  lines.push('  };');
  lines.push('}');

  const template = lines.join('\n');

  // Build response with explanation
  const response = `## Custom Node Script Template

\`\`\`javascript
${template}
\`\`\`

### Inputs Available:
${args.inputs.map((i) => `- \`inputs.${i.name}\` (${i.dataType})${i.description ? ` - ${i.description}` : ''}`).join('\n')}

### Outputs Expected:
${args.outputs.map((o) => `- \`${o.name}\` (${o.dataType})${o.description ? ` - ${o.description}` : ''}`).join('\n')}
${
  args.properties && args.properties.length > 0
    ? `
### Properties Available:
${args.properties.map((p) => `- \`properties.${p.key}\` (${p.dataType})${p.description ? ` - ${p.description}` : ''}`).join('\n')}`
    : ''
}

### Usage Notes:
- The \`processData\` function is auto-invoked by the runtime
- Return keys MUST match output names exactly (case-sensitive)
- Available globals: console, JSON, Math, String.prototype.trim, Array.isArray
- No require/import, eval, process, global, or file system access${
  args.llm_enabled
    ? `

### LLM Capability (Enabled):
When you create this node with \`llm_enabled: true\`:
- Users see Quick Select buttons (FlowDot, Simple, Capable, Complex)
- Your script can call \`llm.call()\` to make AI requests

**llm.call() syntax:**
\`\`\`javascript
const result = llm.call({
  prompt: "Your prompt",        // Required
  systemPrompt: "Instructions", // Optional
  temperature: 0.7,             // Optional (0-2)
  maxTokens: 1000               // Optional
});
\`\`\`

**Response structure:**
\`\`\`javascript
{
  success: boolean,
  response: string,      // LLM's response
  error: string | null,  // Error if failed
  provider: string,
  model: string,
  tokens: { prompt, response, total }
}
\`\`\``
    : ''
}`;

  return {
    content: [{ type: 'text', text: response }],
  };
}
