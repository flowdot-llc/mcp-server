/**
 * agent_chat MCP Tool
 *
 * Chat with the FlowDot agent to discover and run workflows.
 */
export const agentChatTool = {
    name: 'agent_chat',
    description: 'Chat with the FlowDot AI agent. The agent can help discover workflows, suggest which workflow to run, and explain workflow capabilities.',
    inputSchema: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'Message to send to the FlowDot agent',
            },
            conversation_id: {
                type: 'string',
                description: 'Optional conversation ID to continue a previous conversation',
            },
            mode: {
                type: 'string',
                enum: ['flowdot', 'simple', 'capable', 'complex'],
                description: 'LLM mode to use: flowdot (default, cost-effective), simple (fast), capable (balanced), complex (powerful)',
                default: 'flowdot',
            },
        },
        required: ['message'],
    },
};
export async function handleAgentChat(api, args) {
    try {
        // API returns { response, conversation_id, suggested_workflows }
        const mode = args.mode || 'flowdot';
        const result = await api.agentChat(args.message, args.conversation_id, mode);
        // Handle case where result is undefined or missing response
        const response = result?.response;
        if (!response) {
            return {
                content: [{ type: 'text', text: 'Agent returned an empty response.' }],
            };
        }
        let text = response;
        // Add suggested workflows if any
        const suggestedWorkflows = Array.isArray(result?.suggested_workflows) ? result.suggested_workflows : [];
        if (suggestedWorkflows.length > 0) {
            text += '\n\nSuggested workflows:\n';
            text += suggestedWorkflows
                .map((w) => {
                const desc = w.description ? ` - ${w.description}` : '';
                return `- **${w.name}** (${w.id})${desc}`;
            })
                .join('\n');
        }
        // Add conversation ID if available (for continuing the conversation)
        if (result?.conversation_id) {
            text += `\n\n_Conversation ID: ${result.conversation_id}_`;
        }
        return {
            content: [
                {
                    type: 'text',
                    text,
                },
            ],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [
                {
                    type: 'text',
                    text: `Error chatting with agent: ${message}`,
                },
            ],
            isError: true,
        };
    }
}
//# sourceMappingURL=agent-chat.js.map