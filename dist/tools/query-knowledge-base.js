/**
 * Query Knowledge Base Tool
 *
 * Performs RAG queries against the knowledge base to retrieve relevant document chunks.
 */
export const queryKnowledgeBaseToolDef = {
    name: 'query_knowledge_base',
    description: 'Search your knowledge base using semantic and keyword search. Returns relevant document chunks with source attribution. Use this to find information from your uploaded documents.',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'The search query - what information are you looking for?',
            },
            category_id: {
                type: 'number',
                description: 'Optional: Limit search to a specific category by ID',
            },
            top_k: {
                type: 'number',
                description: 'Number of results to return (1-50, default: 5)',
                minimum: 1,
                maximum: 50,
            },
        },
        required: ['query'],
    },
};
export async function handleQueryKnowledgeBase(api, args) {
    try {
        const response = await api.queryKnowledgeBase({
            query: args.query,
            category_id: args.category_id,
            top_k: args.top_k || 5,
        });
        if (response.result_count === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `No results found for query: "${args.query}"\n\nTry:\n- Using different keywords\n- Checking if documents are fully processed (status: ready)\n- Removing category filters`,
                    },
                ],
            };
        }
        const lines = [
            `## Knowledge Base Results (${response.result_count} matches)`,
            '',
            `**Query:** "${response.query}"`,
            '',
        ];
        // Track unique sources for citation
        const sources = new Set();
        for (let i = 0; i < response.results.length; i++) {
            const result = response.results[i];
            sources.add(result.document_title);
            // Calculate relevance indicator
            let relevanceStr = '';
            if (result.similarity !== null) {
                const similarity = (result.similarity * 100).toFixed(0);
                relevanceStr = ` (${similarity}% match)`;
            }
            else if (result.relevance !== null) {
                relevanceStr = ` (relevance: ${result.relevance.toFixed(2)})`;
            }
            lines.push(`### Result ${i + 1} from "${result.document_title}"${relevanceStr}`);
            lines.push('');
            // Show the content (truncate if very long)
            const content = result.content.length > 2000
                ? result.content.substring(0, 2000) + '... (truncated)'
                : result.content;
            lines.push(content);
            lines.push('');
        }
        // Add sources footer
        lines.push('---');
        lines.push(`**Sources:** ${Array.from(sources).join(', ')}`);
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error querying knowledge base: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=query-knowledge-base.js.map