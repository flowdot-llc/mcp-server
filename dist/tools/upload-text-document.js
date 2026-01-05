/**
 * Upload Text Document Tool
 *
 * Uploads text content directly as a document to the knowledge base.
 * Can upload to personal or team knowledge base.
 */
export const uploadTextDocumentToolDef = {
    name: 'upload_text_document',
    description: 'Upload text content directly as a document to your knowledge base. Ideal for creating documents from AI-generated content, notes, or any text. The document will be processed and chunked for RAG queries. Can upload to personal or team knowledge base.',
    inputSchema: {
        type: 'object',
        properties: {
            title: {
                type: 'string',
                description: 'Title for the document (max 255 characters)',
            },
            content: {
                type: 'string',
                description: 'The text content to upload (max 10MB)',
            },
            category_id: {
                type: 'number',
                description: 'Optional: Category ID to organize the document. Must belong to the same scope (personal or team).',
            },
            team_id: {
                type: 'number',
                description: 'Optional: Team ID to upload the document to. If omitted, uploads to personal knowledge base. Use list_user_teams to see available teams.',
            },
            mime_type: {
                type: 'string',
                enum: ['text/plain', 'text/markdown', 'application/json'],
                description: 'Content type: text/plain (default), text/markdown, or application/json',
            },
        },
        required: ['title', 'content'],
    },
};
export async function handleUploadTextDocument(api, args) {
    try {
        const result = await api.uploadTextDocument({
            title: args.title,
            content: args.content,
            category_id: args.category_id,
            team_id: args.team_id,
            mime_type: args.mime_type,
        });
        const lines = [
            `## Document Uploaded Successfully`,
            '',
            `**Title:** ${result.title}`,
            `**ID:** ${result.id}`,
            `**Hash:** ${result.hash}`,
            `**Status:** ${result.status}`,
        ];
        if (args.team_id) {
            lines.push(`**Location:** Team knowledge base (Team ID: ${args.team_id})`);
        }
        else {
            lines.push(`**Location:** Personal knowledge base`);
        }
        lines.push('');
        lines.push(result.message || 'Document created and queued for processing.');
        lines.push('');
        lines.push('The document will be processed in the background. Use list_knowledge_documents to check the status.');
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error uploading document: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=upload-text-document.js.map