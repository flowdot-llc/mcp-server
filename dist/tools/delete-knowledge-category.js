/**
 * Delete Knowledge Category Tool
 *
 * Deletes a document category. Documents in the category become uncategorized.
 */
export const deleteKnowledgeCategoryToolDef = {
    name: 'delete_knowledge_category',
    description: 'Delete a knowledge base category. Documents in the category will become uncategorized (not deleted).',
    inputSchema: {
        type: 'object',
        properties: {
            category_id: {
                type: 'number',
                description: 'The ID of the category to delete',
            },
        },
        required: ['category_id'],
    },
};
export async function handleDeleteKnowledgeCategory(api, args) {
    try {
        const result = await api.deleteKnowledgeCategory(args.category_id);
        return {
            content: [
                {
                    type: 'text',
                    text: result.message || `Category ${args.category_id} deleted successfully.`,
                },
            ],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error deleting category: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=delete-knowledge-category.js.map