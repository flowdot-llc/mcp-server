/**
 * publish_app Tool
 *
 * Publish an app to make it publicly visible.
 * Required scope: apps:manage
 */
export const publishAppTool = {
    name: 'publish_app',
    description: `Publish an app to make it publicly visible in the FlowDot app marketplace.

Once published:
- Other users can discover and view your app
- Other users can clone your app
- Your app can receive votes and comments

You can unpublish at any time using unpublish_app.`,
    inputSchema: {
        type: 'object',
        properties: {
            app_id: {
                type: 'string',
                description: 'The app ID (hash) to publish',
            },
        },
        required: ['app_id'],
    },
};
export async function handlePublishApp(client, args) {
    try {
        const appId = String(args.app_id);
        await client.publishApp(appId);
        return {
            content: [{ type: 'text', text: `App ${appId} published successfully!\n\nYour app is now publicly visible in the FlowDot marketplace.` }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error publishing app: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=publish-app.js.map