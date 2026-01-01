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
export declare const getCustomNodeTemplateTool: Tool;
export declare function handleGetCustomNodeTemplate(args: {
    inputs: InputDef[];
    outputs: OutputDef[];
    properties?: PropertyDef[];
    llm_enabled?: boolean;
}): Promise<CallToolResult>;
export {};
//# sourceMappingURL=get-custom-node-template.d.ts.map