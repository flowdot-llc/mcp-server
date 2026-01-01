/**
 * clone_app Tool
 *
 * Clone a public app to your library.
 * Required scope: apps:manage
 */
export const cloneAppTool = {
    name: 'clone_app',
    description: `Clone a public app to your library. Creates a private copy that you can customize.

The cloned app will:
- Be owned by you
- Start as private (not published)
- Have all the original code and configuration
- Not include linked workflows (you'll need to link your own)`,
    inputSchema: {
        type: 'object',
        properties: {
            app_id: {
                type: 'string',
                description: 'The app ID (hash) to clone',
            },
            name: {
                type: 'string',
                description: 'Name for the cloned app (defaults to "Original Name (Copy)")',
            },
        },
        required: ['app_id'],
    },
};
export async function handleCloneApp(client, args) {
    try {
        const appId = String(args.app_id);
        const name = args.name ? String(args.name) : undefined;
        const result = await client.cloneApp(appId, name);
        const text = `App cloned successfully!

**New App ID:** ${result.id}
**Name:** ${result.name}
**Original App:** ${result.original_app_id}
**Created:** ${result.created_at}

## Next Steps

1. **Link your workflows** - The cloned app doesn't include workflow links.
   Use link_app_workflow to connect your own workflows.

2. **Customize the code** - Use update_app to modify the React code.

3. **Test and publish** - When ready, use publish_app to make it public.`;
        return {
            content: [{ type: 'text', text }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error cloning app: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=clone-app.js.map