/**
 * Upload Document from URL Tool
 *
 * Downloads and uploads a document from a URL to the knowledge base.
 * Can upload to personal or team knowledge base.
 */
export const uploadDocumentFromUrlToolDef = {
    name: 'upload_document_from_url',
    description: 'Download a document from a URL and add it to your knowledge base. Supports PDF, DOCX, TXT, Markdown, CSV, and JSON files (max 50MB). Can upload to personal or team knowledge base.',
    inputSchema: {
        type: 'object',
        properties: {
            url: {
                type: 'string',
                description: 'URL of the document to download',
            },
            title: {
                type: 'string',
                description: 'Optional: Title for the document (defaults to filename from URL)',
            },
            category_id: {
                type: 'number',
                description: 'Optional: Category ID to organize the document. Must belong to the same scope (personal or team).',
            },
            team_id: {
                type: 'number',
                description: 'Optional: Team ID to upload the document to. If omitted, uploads to personal knowledge base. Use list_user_teams to see available teams.',
            },
        },
        required: ['url'],
    },
};
export async function handleUploadDocumentFromUrl(api, args) {
    try {
        const result = await api.uploadDocumentFromUrl({
            url: args.url,
            title: args.title,
            category_id: args.category_id,
            team_id: args.team_id,
        });
        const lines = [
            `## Document Downloaded Successfully`,
            '',
            `**Title:** ${result.title}`,
            `**ID:** ${result.id}`,
            `**Hash:** ${result.hash}`,
            result.original_filename ? `**Filename:** ${result.original_filename}` : '',
            result.file_size_bytes ? `**Size:** ${(result.file_size_bytes / 1024).toFixed(1)} KB` : '',
            `**Status:** ${result.status}`,
        ].filter(Boolean);
        if (args.team_id) {
            lines.push(`**Location:** Team knowledge base (Team ID: ${args.team_id})`);
        }
        else {
            lines.push(`**Location:** Personal knowledge base`);
        }
        lines.push('');
        lines.push(result.message || 'Document downloaded and queued for processing.');
        lines.push('');
        lines.push('The document will be processed in the background. Use list_knowledge_documents to check the status.');
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error uploading document from URL: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=upload-document-from-url.js.map