/**
 * agent_chat MCP Tool
 *
 * Chat with the FlowDot agent to discover and run workflows.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const agentChatTool: Tool;
export declare function handleAgentChat(api: FlowDotApiClient, args: {
    message: string;
    conversation_id?: string;
    mode?: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=agent-chat.d.ts.map