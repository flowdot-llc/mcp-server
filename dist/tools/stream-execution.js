/**
 * stream_execution MCP Tool
 *
 * Provides SSE stream URL for real-time execution progress.
 * Note: MCP doesn't support true streaming, so this returns connection info.
 */
export const streamExecutionTool = {
    name: 'stream_execution',
    description: 'Get real-time streaming information for a workflow execution. Returns the SSE endpoint URL and authentication details for connecting to the execution stream.',
    inputSchema: {
        type: 'object',
        properties: {
            execution_id: {
                type: 'string',
                description: 'The execution ID to stream',
            },
        },
        required: ['execution_id'],
    },
};
export async function handleStreamExecution(api, args) {
    try {
        // Get the stream URL and auth token
        const streamUrl = api.getExecutionStreamUrl(args.execution_id);
        const authToken = api.getAuthToken();
        const lines = [
            '## Execution Stream Information',
            '',
            '**SSE Endpoint:**',
            '```',
            streamUrl,
            '```',
            '',
            '**Authorization Header:**',
            '```',
            `Bearer ${authToken.substring(0, 20)}...`,
            '```',
            '',
            '### Event Types',
            '- `node_started` - A node has started processing',
            '- `node_completed` - A node has finished processing',
            '- `node_error` - A node encountered an error',
            '- `execution_completed` - The workflow has completed successfully',
            '- `execution_failed` - The workflow has failed',
            '',
            '### Connection Example',
            '```javascript',
            `const eventSource = new EventSource('${streamUrl}', {`,
            `  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }`,
            '});',
            '',
            'eventSource.onmessage = (event) => {',
            '  const data = JSON.parse(event.data);',
            '  console.log(data.event, data.data);',
            '};',
            '```',
        ];
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error getting stream information: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=stream-execution.js.map