/**
 * Query Knowledge Base Tool
 *
 * Performs RAG queries against the knowledge base to retrieve relevant document chunks.
 * Supports filtering by team and controlling which document sources to include.
 */
export const queryKnowledgeBaseToolDef = {
    name: 'query_knowledge_base',
    description: 'Search your knowledge base using semantic and keyword search. Returns relevant document chunks with source attribution. Use this to find information from your uploaded documents. By default searches both personal and team documents.',
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
            team_id: {
                type: 'number',
                description: 'Optional: Limit search to a specific team\'s documents only. Use list_user_teams to see available teams.',
            },
            include_personal: {
                type: 'boolean',
                description: 'Optional: Include personal documents in the search. Default: true',
            },
            include_team: {
                type: 'boolean',
                description: 'Optional: Include team documents in the search. Default: true',
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
            team_id: args.team_id,
            include_personal: args.include_personal,
            include_team: args.include_team,
            top_k: args.top_k || 5,
        });
        if (response.result_count === 0) {
            let tips = [
                'Using different keywords',
                'Checking if documents are fully processed (status: ready)',
                'Removing category filters',
            ];
            if (args.include_personal === false || args.include_team === false) {
                tips.push('Including both personal and team documents');
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `No results found for query: "${args.query}"\n\nTry:\n${tips.map(t => `- ${t}`).join('\n')}`,
                    },
                ],
            };
        }
        const lines = [
            `## Knowledge Base Results (${response.result_count} matches)`,
            '',
            `**Query:** "${args.query}"`,
        ];
        // Add filter info if any filters applied
        const filters = [];
        if (args.team_id)
            filters.push(`Team ID: ${args.team_id}`);
        if (args.category_id)
            filters.push(`Category ID: ${args.category_id}`);
        if (args.include_personal === false)
            filters.push('Personal: excluded');
        if (args.include_team === false)
            filters.push('Team: excluded');
        if (filters.length > 0) {
            lines.push(`**Filters:** ${filters.join(', ')}`);
        }
        lines.push('');
        // Track unique sources for citation
        const sources = new Map();
        for (let i = 0; i < response.results.length; i++) {
            const result = response.results[i];
            // Track source
            sources.set(result.document_hash || result.document_title, {
                title: result.document_title,
                isTeam: result.is_team_document,
                teamId: result.team_id ?? undefined,
            });
            // Calculate relevance indicator
            let relevanceStr = '';
            if (result.similarity !== null) {
                const similarity = (result.similarity * 100).toFixed(0);
                relevanceStr = ` (${similarity}% match)`;
            }
            else if (result.relevance !== null) {
                relevanceStr = ` (relevance: ${result.relevance.toFixed(2)})`;
            }
            // Add team indicator if from team
            const sourceLabel = result.is_team_document
                ? `"${result.document_title}" [Team]`
                : `"${result.document_title}"`;
            lines.push(`### Result ${i + 1} from ${sourceLabel}${relevanceStr}`);
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
        const personalSources = Array.from(sources.values()).filter(s => !s.isTeam);
        const teamSources = Array.from(sources.values()).filter(s => s.isTeam);
        if (personalSources.length > 0) {
            lines.push(`**Personal Sources:** ${personalSources.map(s => s.title).join(', ')}`);
        }
        if (teamSources.length > 0) {
            lines.push(`**Team Sources:** ${teamSources.map(s => s.title).join(', ')}`);
        }
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