/**
 * Get Knowledge Storage Tool
 *
 * Gets storage usage information for the knowledge base.
 */
export const getKnowledgeStorageToolDef = {
    name: 'get_knowledge_storage',
    description: 'Get storage usage information for your knowledge base, including total space used, limits, and document counts.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
};
export async function handleGetKnowledgeStorage(api) {
    try {
        const storage = await api.getKnowledgeStorage();
        // Create a visual progress bar
        const barLength = 20;
        const filledLength = Math.round((storage.usage_percentage / 100) * barLength);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
        const lines = [
            '## Knowledge Base Storage',
            '',
            '### Usage',
            `\`[${bar}]\` ${storage.usage_percentage.toFixed(1)}%`,
            '',
            `- **Knowledge Base:** ${storage.knowledge_storage_mb.toFixed(2)} MB`,
            `- **Total Used:** ${storage.total_storage_mb.toFixed(2)} MB`,
            `- **Storage Limit:** ${storage.storage_limit_mb.toFixed(2)} MB`,
            `- **Available:** ${(storage.storage_limit_mb - storage.total_storage_mb).toFixed(2)} MB`,
            '',
            '### Documents',
            `- **Total Documents:** ${storage.document_count}`,
            `- **Ready Documents:** ${storage.ready_document_count}`,
            `- **Categories:** ${storage.category_count}`,
        ];
        if (storage.usage_percentage > 80) {
            lines.push('');
            lines.push('⚠️ **Warning:** Storage usage is above 80%. Consider deleting unused documents.');
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error getting storage info: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=get-knowledge-storage.js.map