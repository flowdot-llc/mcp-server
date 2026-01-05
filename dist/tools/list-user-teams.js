/**
 * List User Teams Tool
 *
 * Lists all teams the user belongs to, including owned teams and member teams.
 * Use this to discover available teams before filtering knowledge base operations.
 */
export const listUserTeamsToolDef = {
    name: 'list_user_teams',
    description: 'List all teams you belong to. Use this to discover available teams before filtering knowledge base operations by team. Returns team ID, name, your role, and member count.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
};
export async function handleListUserTeams(api) {
    try {
        const teams = await api.listUserTeams();
        if (teams.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'You are not a member of any teams. Your knowledge base contains only personal documents.',
                    },
                ],
            };
        }
        const lines = [`## Your Teams (${teams.length})`, ''];
        for (const team of teams) {
            lines.push(`### ${team.name}`);
            lines.push(`- **ID:** ${team.id}`);
            lines.push(`- **Slug:** ${team.slug}`);
            if (team.description) {
                lines.push(`- **Description:** ${team.description}`);
            }
            lines.push(`- **Your Role:** ${team.role}`);
            lines.push(`- **Members:** ${team.member_count}`);
            lines.push(`- **Created:** ${team.created_at}`);
            lines.push('');
        }
        lines.push('---');
        lines.push('Use the team ID to filter knowledge base operations by team.');
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error listing teams: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=list-user-teams.js.map