/**
 * unpublish_app Tool
 *
 * Unpublish an app to make it private again.
 * Required scope: apps:manage
 */
export const unpublishAppTool = {
    name: 'unpublish_app',
    description: `Unpublish an app to make it private. The app will no longer be visible in the public marketplace.

Existing clones of your app will continue to work for their owners, but new users won't be able to discover or clone it.`,
    inputSchema: {
        type: 'object',
        properties: {
            app_id: {
                type: 'string',
                description: 'The app ID (hash) to unpublish',
            },
        },
        required: ['app_id'],
    },
};
export async function handleUnpublishApp(client, args) {
    try {
        const appId = String(args.app_id);
        await client.unpublishApp(appId);
        return {
            content: [{ type: 'text', text: `App ${appId} unpublished. It is now private and only visible to you.` }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error unpublishing app: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=unpublish-app.js.map