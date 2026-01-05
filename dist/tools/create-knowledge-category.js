/**
 * Create Knowledge Category Tool
 *
 * Creates a new document category in the knowledge base.
 */
export const createKnowledgeCategoryToolDef = {
    name: 'create_knowledge_category',
    description: 'Create a new category to organize documents in your knowledge base. Categories help group related documents for targeted RAG queries.',
    inputSchema: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Name for the category (max 100 characters)',
            },
            description: {
                type: 'string',
                description: 'Optional description of what documents belong in this category (max 500 characters)',
            },
            color: {
                type: 'string',
                description: 'Optional hex color code for the category (e.g., #3B82F6). Default: blue',
                pattern: '^#[0-9A-Fa-f]{6}$',
            },
        },
        required: ['name'],
    },
};
export async function handleCreateKnowledgeCategory(api, args) {
    try {
        const category = await api.createKnowledgeCategory({
            name: args.name,
            description: args.description,
            color: args.color,
        });
        const lines = [
            `## Category Created Successfully`,
            '',
            `**Name:** ${category.name}`,
            `**ID:** ${category.id}`,
            `**Slug:** ${category.slug}`,
            category.description ? `**Description:** ${category.description}` : '',
            `**Color:** ${category.color}`,
            '',
            `You can now upload documents to this category using the category_id: ${category.id}`,
        ].filter(Boolean);
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error creating category: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=create-knowledge-category.js.map