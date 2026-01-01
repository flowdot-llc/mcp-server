/**
 * unlink_app_workflow Tool
 *
 * Unlink a workflow from an app.
 * Required scope: apps:manage
 */
export const unlinkAppWorkflowTool = {
    name: 'unlink_app_workflow',
    description: `Unlink a workflow from an app. After unlinking, the app will no longer be able to invoke that workflow.

Make sure to update your app code to remove any references to the unlinked workflow.`,
    inputSchema: {
        type: 'object',
        properties: {
            app_id: {
                type: 'string',
                description: 'The app ID (hash)',
            },
            workflow_hash: {
                type: 'string',
                description: 'The workflow hash to unlink',
            },
        },
        required: ['app_id', 'workflow_hash'],
    },
};
export async function handleUnlinkAppWorkflow(client, args) {
    try {
        const appId = String(args.app_id);
        const workflowHash = String(args.workflow_hash);
        await client.unlinkAppWorkflow(appId, workflowHash);
        return {
            content: [{ type: 'text', text: `Workflow ${workflowHash} unlinked from app ${appId} successfully.` }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error unlinking workflow: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=unlink-app-workflow.js.map