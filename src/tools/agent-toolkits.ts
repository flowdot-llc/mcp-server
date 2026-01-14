/**
 * Agent Toolkit MCP Tools
 *
 * Tools for managing MCP agent toolkits - creating, installing, and using
 * custom tool collections for AI agents.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import {
  AgentToolkit,
  PaginatedResult,
  ToolkitListFilters,
  ToolkitSearchFilters,
  CreateToolkitInput,
  UpdateToolkitInput,
  CreateToolkitToolInput,
  UpdateToolkitToolInput,
  InvokeToolkitToolInput,
  ToolkitCredentialStatus,
} from '../types.js';

// ============================================
// Discovery & Browsing Tools
// ============================================

export const listAgentToolkitsTool: Tool = {
  name: 'mcp__flowdot__list_agent_toolkits',
  description: `List your own MCP agent toolkits with optional filtering.

Toolkits are collections of custom tools that can be installed and used by AI agents. Each toolkit can contain multiple related tools with shared credentials and configuration.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      search: {
        type: 'string',
        description: 'Filter toolkits by name or description',
      },
      category: {
        type: 'string',
        description: 'Filter by category (e.g., "api-integration", "data-processing", "automation")',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 50, max: 100)',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (default: 1)',
      },
    },
  },
};

export async function handleListAgentToolkits(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const options: ToolkitListFilters = {};
    if (args.search) options.search = String(args.search);
    if (args.category) options.category = String(args.category);
    if (args.limit) options.limit = Number(args.limit);
    if (args.page) options.page = Number(args.page);

    const result = await api.listAgentToolkits(options);

    if (!result.data || result.data.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No toolkits found. Create your first toolkit using mcp__flowdot__create_agent_toolkit.'
        }],
      };
    }

    const toolkitsInfo = result.data.map((toolkit: AgentToolkit) => {
      const tags = toolkit.tags?.length ? `[${toolkit.tags.join(', ')}]` : '';
      const status = toolkit.visibility === 'public' ? 'Public' : 'Private';
      const verified = toolkit.is_verified ? '✓ Verified' : '';
      return `- **${toolkit.title}** (${toolkit.name})
  ID: ${toolkit.id}
  ${toolkit.description || 'No description'}
  Category: ${toolkit.category} | Status: ${status} ${verified}
  Tools: ${toolkit.tools_count} | Installations: ${toolkit.installation_count}
  ${tags ? `Tags: ${tags}` : ''}`;
    });

    const text = `Found ${result.total || result.data.length} toolkit(s):

${toolkitsInfo.join('\n\n')}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing toolkits: ${message}` }],
      isError: true,
    };
  }
}

export const searchAgentToolkitsTool: Tool = {
  name: 'mcp__flowdot__search_agent_toolkits',
  description: `Search the public MCP toolkit marketplace for toolkits created by other users.

Discover reusable tool collections for various use cases like API integrations, data processing, automation, and more.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Search query (searches name, title, and description)',
      },
      category: {
        type: 'string',
        description: 'Filter by category',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tags',
      },
      verified_only: {
        type: 'boolean',
        description: 'Only show verified toolkits (default: false)',
      },
      sort: {
        type: 'string',
        enum: ['trending', 'popular', 'recent', 'most_installed'],
        description: 'Sort order (default: trending)',
      },
      limit: {
        type: 'number',
        description: 'Maximum results per page (default: 20, max: 100)',
      },
      page: {
        type: 'number',
        description: 'Page number (default: 1)',
      },
    },
  },
};

export async function handleSearchAgentToolkits(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const options: ToolkitSearchFilters = {};
    if (args.query) options.query = String(args.query);
    if (args.category) options.category = String(args.category);
    if (args.tags && Array.isArray(args.tags)) {
      options.tags = args.tags.map(t => String(t));
    }
    if (args.verified_only) options.verified_only = Boolean(args.verified_only);
    if (args.sort) options.sort = args.sort as 'trending' | 'popular' | 'recent' | 'most_installed';
    if (args.limit) options.limit = Number(args.limit);
    if (args.page) options.page = Number(args.page);

    const result = await api.searchPublicAgentToolkits(options);

    if (!result.data || result.data.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No toolkits found matching your search criteria.'
        }],
      };
    }

    const toolkitsInfo = result.data.map((toolkit: AgentToolkit) => {
      const verified = toolkit.is_verified ? '✓ Verified' : '';
      const featured = toolkit.is_featured ? '⭐ Featured' : '';
      return `### ${toolkit.title} ${verified} ${featured}
- **ID:** ${toolkit.id}
- **Name:** ${toolkit.name}
- **Description:** ${toolkit.description || 'No description'}
- **Category:** ${toolkit.category}
- **Tools:** ${toolkit.tools_count}
- **Installations:** ${toolkit.installation_count} | **Votes:** ${toolkit.vote_count || 0}
- **Author:** ${toolkit.user_name || 'Unknown'}
${toolkit.tags?.length ? `- **Tags:** ${toolkit.tags.join(', ')}` : ''}
`;
    });

    const text = `## Toolkit Search Results

Found ${result.total || result.data.length} toolkit(s):

${toolkitsInfo.join('\n')}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error searching toolkits: ${message}` }],
      isError: true,
    };
  }
}

export const getAgentToolkitTool: Tool = {
  name: 'mcp__flowdot__get_agent_toolkit',
  description: `Get detailed information about a specific agent toolkit.

Returns comprehensive toolkit details including tools, credentials, and metadata.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID (hash)',
      },
    },
    required: ['toolkit_id'],
  },
};

export async function handleGetAgentToolkit(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const toolkit = await api.getAgentToolkit(toolkitId);
    const verified = toolkit.is_verified ? '✓ Verified' : '';
    const text = `# ${toolkit.title} ${verified}

**ID:** ${toolkit.id}
**Name:** ${toolkit.name}
**Category:** ${toolkit.category}
**Version:** ${toolkit.version}
**Visibility:** ${toolkit.visibility}
**Author:** ${toolkit.user_name || 'Unknown'}

**Description:**
${toolkit.description || 'No description'}

**Stats:**
- Tools: ${toolkit.tools_count}
- Installations: ${toolkit.installation_count}
- Votes: ${toolkit.vote_count || 0}
- Copies: ${toolkit.copy_count}

${toolkit.tags?.length ? `**Tags:** ${toolkit.tags.join(', ')}` : ''}

${toolkit.tools && toolkit.tools.length > 0 ? `
**Tools:**
${toolkit.tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}
` : ''}

Created: ${toolkit.created_at}
Updated: ${toolkit.updated_at}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting toolkit: ${message}` }],
      isError: true,
    };
  }
}

export const getToolkitCommentsTool: Tool = {
  name: 'mcp__flowdot__get_toolkit_comments',
  description: `Get comments on a toolkit.

View community feedback and discussions about a toolkit.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID (hash)',
      },
    },
    required: ['toolkit_id'],
  },
};

export async function handleGetToolkitComments(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const comments = await api.getToolkitComments(toolkitId);

    if (!comments || comments.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No comments yet.'
        }],
      };
    }

    const formatComment = (comment: any, indent = 0): string => {
      const prefix = '  '.repeat(indent);
      let text = `${prefix}- **${comment.user_name}** (${comment.created_at})\n${prefix}  ${comment.content}\n${prefix}  Votes: ${comment.vote_count || 0}`;

      if (comment.replies && comment.replies.length > 0) {
        text += '\n' + comment.replies.map((r: any) => formatComment(r, indent + 1)).join('\n');
      }

      return text;
    };

    const commentsText = comments.map((c: any) => formatComment(c)).join('\n\n');
    const text = `## Toolkit Comments

${commentsText}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting comments: ${message}` }],
      isError: true,
    };
  }
}

// ============================================
// Toolkit Management Tools
// ============================================

export const createAgentToolkitTool: Tool = {
  name: 'mcp__flowdot__create_agent_toolkit',
  description: `Create a new MCP agent toolkit.

Toolkits organize related tools and credentials for specific integrations or use cases.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: 'Unique identifier (lowercase, hyphens only, e.g., "my-api-toolkit")',
      },
      title: {
        type: 'string',
        description: 'Display name (e.g., "My API Toolkit")',
      },
      description: {
        type: 'string',
        description: 'What this toolkit does',
      },
      category: {
        type: 'string',
        description: 'Category (e.g., "api-integration", "data-processing", "automation")',
      },
      version: {
        type: 'string',
        description: 'Version string (default: "1.0.0")',
      },
      icon: {
        type: 'string',
        description: 'Icon name or emoji',
      },
      visibility: {
        type: 'string',
        enum: ['private', 'public', 'unlisted'],
        description: 'Visibility setting (default: "private")',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for discoverability (max 10)',
      },
    },
    required: ['name', 'title', 'description'],
  },
};

export async function handleCreateAgentToolkit(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const input: CreateToolkitInput = {
      name: String(args.name),
      title: String(args.title),
      description: String(args.description),
    };

    if (args.category) input.category = String(args.category);
    if (args.version) input.version = String(args.version);
    if (args.icon) input.icon = String(args.icon);
    if (args.visibility) input.visibility = args.visibility as 'private' | 'public' | 'unlisted';
    if (args.tags && Array.isArray(args.tags)) {
      input.tags = args.tags.map(t => String(t));
    }

    const result = await api.createAgentToolkit(input);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to create toolkit' }],
        isError: true,
      };
    }

    const toolkit = result;
    const text = `✓ Toolkit created successfully!

**ID:** ${toolkit.id}
**Name:** ${toolkit.name}
**Title:** ${toolkit.title}
**Visibility:** ${toolkit.visibility}

Next steps:
1. Add tools to your toolkit
2. Define credential requirements
3. Install and configure credentials
4. Start using your toolkit!`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error creating toolkit: ${message}` }],
      isError: true,
    };
  }
}

export const updateAgentToolkitTool: Tool = {
  name: 'mcp__flowdot__update_agent_toolkit',
  description: `Update an existing agent toolkit's metadata.

Modify title, description, category, tags, and other toolkit properties.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID (hash)',
      },
      name: {
        type: 'string',
        description: 'New name (lowercase, hyphens only)',
      },
      title: {
        type: 'string',
        description: 'New display title',
      },
      description: {
        type: 'string',
        description: 'New description',
      },
      category: {
        type: 'string',
        description: 'New category',
      },
      version: {
        type: 'string',
        description: 'New version',
      },
      icon: {
        type: 'string',
        description: 'New icon',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'New tags',
      },
    },
    required: ['toolkit_id'],
  },
};

export async function handleUpdateAgentToolkit(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const input: UpdateToolkitInput = {};

    if (args.name) input.name = String(args.name);
    if (args.title) input.title = String(args.title);
    if (args.description) input.description = String(args.description);
    if (args.category) input.category = String(args.category);
    if (args.version) input.version = String(args.version);
    if (args.icon) input.icon = String(args.icon);
    if (args.tags && Array.isArray(args.tags)) {
      input.tags = args.tags.map(t => String(t));
    }

    const result = await api.updateAgentToolkit(toolkitId, input);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to update toolkit' }],
        isError: true,
      };
    }

    const text = `✓ Toolkit updated successfully!

**ID:** ${result.id}
**Title:** ${result.title}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error updating toolkit: ${message}` }],
      isError: true,
    };
  }
}

export const deleteAgentToolkitTool: Tool = {
  name: 'mcp__flowdot__delete_agent_toolkit',
  description: `Delete a toolkit permanently.

WARNING: This cannot be undone. All tools, installations, and related data will be deleted.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID (hash)',
      },
    },
    required: ['toolkit_id'],
  },
};

export async function handleDeleteAgentToolkit(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const result = await api.deleteAgentToolkit(toolkitId);

    const text = result.success
      ? `✓ Toolkit deleted successfully.`
      : `Error: ${'Failed to delete toolkit'}`;

    return {
      content: [{ type: 'text', text }],
      isError: !result.success,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error deleting toolkit: ${message}` }],
      isError: true,
    };
  }
}

export const copyAgentToolkitTool: Tool = {
  name: 'mcp__flowdot__copy_agent_toolkit',
  description: `Copy/duplicate a toolkit.

Creates a private copy of a toolkit that you can customize.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID to copy',
      },
      name: {
        type: 'string',
        description: 'New name for the copy (optional, auto-generated if not provided)',
      },
    },
    required: ['toolkit_id'],
  },
};

export async function handleCopyAgentToolkit(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const name = args.name ? String(args.name) : undefined;

    const result = await api.copyAgentToolkit(toolkitId, name);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to copy toolkit' }],
        isError: true,
      };
    }

    const text = `✓ Toolkit copied successfully!

**New ID:** ${result.id}
**Name:** ${result.name}
**Title:** ${result.title}

The copy is private. You can now customize it as needed.`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error copying toolkit: ${message}` }],
      isError: true,
    };
  }
}

export const toggleToolkitVisibilityTool: Tool = {
  name: 'mcp__flowdot__toggle_toolkit_visibility',
  description: `Change toolkit visibility (private, public, or unlisted).

Public toolkits are searchable by others. Unlisted are accessible via direct link only.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID (hash)',
      },
      visibility: {
        type: 'string',
        enum: ['private', 'public', 'unlisted'],
        description: 'New visibility setting',
      },
    },
    required: ['toolkit_id', 'visibility'],
  },
};

export async function handleToggleToolkitVisibility(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const visibility = args.visibility as 'private' | 'public' | 'unlisted';

    const result = await api.toggleToolkitVisibility(toolkitId, visibility);

    const text = result.success
      ? `✓ Toolkit visibility changed to: ${visibility}`
      : `Error: ${'Failed to change visibility'}`;

    return {
      content: [{ type: 'text', text }],
      isError: !result.success,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error changing visibility: ${message}` }],
      isError: true,
    };
  }
}

export const voteToolkitTool: Tool = {
  name: 'mcp__flowdot__vote_toolkit',
  description: `Vote on a toolkit (upvote, downvote, or remove your vote).`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID (hash)',
      },
      vote: {
        type: 'string',
        enum: ['up', 'down', 'remove'],
        description: 'Vote action',
      },
    },
    required: ['toolkit_id', 'vote'],
  },
};

export async function handleVoteToolkit(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const vote = args.vote as 'up' | 'down' | 'remove';

    const result = await api.voteToolkit(toolkitId, vote);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to vote' }],
        isError: true,
      };
    }

    const text = `✓ Vote recorded! Current votes: ${result.vote_count}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error voting: ${message}` }],
      isError: true,
    };
  }
}

export const favoriteToolkitTool: Tool = {
  name: 'mcp__flowdot__favorite_toolkit',
  description: `Add or remove a toolkit from your favorites.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID (hash)',
      },
      favorite: {
        type: 'boolean',
        description: 'true to favorite, false to unfavorite',
      },
    },
    required: ['toolkit_id', 'favorite'],
  },
};

export async function handleFavoriteToolkit(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const favorite = Boolean(args.favorite);

    const result = await api.favoriteToolkit(toolkitId, favorite);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to update favorite' }],
        isError: true,
      };
    }

    const text = favorite
      ? `✓ Toolkit added to favorites!`
      : `✓ Toolkit removed from favorites.`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error updating favorite: ${message}` }],
      isError: true,
    };
  }
}

export const addToolkitCommentTool: Tool = {
  name: 'mcp__flowdot__add_toolkit_comment',
  description: `Add a comment to a toolkit.

Share feedback, ask questions, or discuss the toolkit with the community.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID (hash)',
      },
      content: {
        type: 'string',
        description: 'Comment content (max 2000 characters)',
      },
      parent_id: {
        type: 'number',
        description: 'Parent comment ID (for replies, optional)',
      },
    },
    required: ['toolkit_id', 'content'],
  },
};

export async function handleAddToolkitComment(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const content = String(args.content);
    const parentId = args.parent_id ? Number(args.parent_id) : undefined;

    const result = await api.addToolkitComment(toolkitId, content, parentId);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to add comment' }],
        isError: true,
      };
    }

    const text = `✓ Comment added successfully!`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error adding comment: ${message}` }],
      isError: true,
    };
  }
}

// ============================================
// Installation Management Tools
// ============================================

export const installToolkitTool: Tool = {
  name: 'mcp__flowdot__install_toolkit',
  description: `Install a toolkit to your account.

After installation, you can configure credentials and use the toolkit's tools.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID to install',
      },
    },
    required: ['toolkit_id'],
  },
};

export async function handleInstallToolkit(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const result = await api.installToolkit(toolkitId);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to install toolkit' }],
        isError: true,
      };
    }

    const installation = result;
    const text = `✓ Toolkit installed successfully!

**Installation ID:** ${installation.id}
**Toolkit:** ${installation.toolkit_name}
**Status:** ${installation.is_active ? 'Active' : 'Inactive'}
**Credentials:** ${installation.credentials_configured ? 'Configured' : 'Not configured'}

${!installation.credentials_configured ? `
⚠️ Missing credentials: ${installation.missing_credentials.join(', ')}

Next steps:
1. Use mcp__flowdot__check_toolkit_credentials to see required credentials
2. Use mcp__flowdot__update_toolkit_installation to map credentials
3. Use mcp__flowdot__toggle_toolkit_active to activate
` : 'You can now use this toolkit!'}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error installing toolkit: ${message}` }],
      isError: true,
    };
  }
}

export const uninstallToolkitTool: Tool = {
  name: 'mcp__flowdot__uninstall_toolkit',
  description: `Uninstall a toolkit from your account.

Removes the installation and credential mapping (toolkit itself remains available).`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      installation_id: {
        type: 'string',
        description: 'The installation ID',
      },
    },
    required: ['installation_id'],
  },
};

export async function handleUninstallToolkit(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const installationId = String(args.installation_id);
    const result = await api.uninstallToolkit(installationId);

    const text = result.success
      ? `✓ Toolkit uninstalled successfully.`
      : `Error: ${'Failed to uninstall toolkit'}`;

    return {
      content: [{ type: 'text', text }],
      isError: !result.success,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error uninstalling toolkit: ${message}` }],
      isError: true,
    };
  }
}

export const listInstalledToolkitsTool: Tool = {
  name: 'mcp__flowdot__list_installed_toolkits',
  description: `List all toolkits you have installed.

Shows installation status and credential configuration for each toolkit.`,
  inputSchema: {
    type: 'object' as const,
    properties: {},
  },
};

export async function handleListInstalledToolkits(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const installations = await api.listInstalledToolkits();

    if (!installations || installations.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No toolkits installed. Search for toolkits using mcp__flowdot__search_agent_toolkits.'
        }],
      };
    }

    const installationsInfo = installations.map((install: any) => {
      const status = install.is_active ? '✓ Active' : '○ Inactive';
      const creds = install.credentials_configured ? '✓ Configured' : '⚠️ Missing credentials';
      return `- **${install.toolkit_title}** ${status}
  Installation ID: ${install.id}
  Toolkit ID: ${install.toolkit_id}
  Credentials: ${creds}
  Version: ${install.toolkit_version}
  Last used: ${install.last_used_at || 'Never'}
  Usage count: ${install.usage_count}`;
    });

    const text = `## Installed Toolkits (${installations.length})

${installationsInfo.join('\n\n')}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing installations: ${message}` }],
      isError: true,
    };
  }
}

export const toggleToolkitActiveTool: Tool = {
  name: 'mcp__flowdot__toggle_toolkit_active',
  description: `Enable or disable a toolkit installation.

Inactive toolkits won't be available for use but remain installed.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      installation_id: {
        type: 'string',
        description: 'The installation ID',
      },
      is_active: {
        type: 'boolean',
        description: 'true to activate, false to deactivate',
      },
    },
    required: ['installation_id', 'is_active'],
  },
};

export async function handleToggleToolkitActive(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const installationId = String(args.installation_id);
    const isActive = Boolean(args.is_active);

    const result = await api.toggleToolkitActive(installationId, isActive);

    const text = result.success
      ? `✓ Toolkit ${isActive ? 'activated' : 'deactivated'} successfully.`
      : `Error: ${'Failed to toggle toolkit'}`;

    return {
      content: [{ type: 'text', text }],
      isError: !result.success,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error toggling toolkit: ${message}` }],
      isError: true,
    };
  }
}

export const checkToolkitCredentialsTool: Tool = {
  name: 'mcp__flowdot__check_toolkit_credentials',
  description: `Check credential status for a toolkit installation.

Shows which credentials are required and which are missing.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      installation_id: {
        type: 'string',
        description: 'The installation ID',
      },
    },
    required: ['installation_id'],
  },
};

export async function handleCheckToolkitCredentials(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const installationId = String(args.installation_id);
    const result = await api.checkToolkitCredentials(installationId);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to check credentials' }],
        isError: true,
      };
    }

    const status = result;
    const requirements = status.required_credentials.map(req => {
      const required = req.is_required ? '[REQUIRED]' : '[optional]';
      const missing = status.missing_credentials.includes(req.key_name) ? '⚠️ MISSING' : '✓';
      return `  ${missing} ${req.label} ${required}
     Key: ${req.key_name}
     Type: ${req.type}
     ${req.description || ''}`;
    });

    const text = `## Credential Status: ${status.toolkit_name}

**Status:** ${status.credentials_configured ? '✓ All credentials configured' : '⚠️ Missing required credentials'}

**Required Credentials:**

${requirements.join('\n\n')}

${status.missing_credentials.length > 0 ? `
**Missing:** ${status.missing_credentials.join(', ')}

Use mcp__flowdot__update_toolkit_installation to map these credentials to your API keys.
` : ''}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error checking credentials: ${message}` }],
      isError: true,
    };
  }
}

export const updateToolkitInstallationTool: Tool = {
  name: 'mcp__flowdot__update_toolkit_installation',
  description: `Update toolkit installation (configure credential mapping).

Map toolkit credential requirements to your stored API keys.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      installation_id: {
        type: 'string',
        description: 'The installation ID',
      },
      credential_mapping: {
        type: 'object',
        description: 'Map of toolkit credential keys to your API key names (e.g., {"SPOTIFY_API_KEY": "my-spotify-key"})',
      },
    },
    required: ['installation_id', 'credential_mapping'],
  },
};

export async function handleUpdateToolkitInstallation(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const installationId = String(args.installation_id);
    const credentialMapping = args.credential_mapping as Record<string, string>;

    const result = await api.updateToolkitInstallation(installationId, credentialMapping);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to update installation' }],
        isError: true,
      };
    }

    const text = `✓ Installation updated successfully!

**Credentials configured:** ${result.credentials_configured ? 'Yes' : 'No'}

${result.missing_credentials && result.missing_credentials.length > 0 ? `
⚠️ Still missing: ${result.missing_credentials.join(', ')}
` : '✓ All credentials configured! You can now use this toolkit.'}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error updating installation: ${message}` }],
      isError: true,
    };
  }
}

// ============================================
// Execution Tools
// ============================================

export const invokeToolkitToolTool: Tool = {
  name: 'mcp__flowdot__invoke_toolkit_tool',
  description: `Execute a tool from an installed toolkit.

Runs the tool with provided inputs using your configured credentials.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      installation_id: {
        type: 'string',
        description: 'The installation ID',
      },
      tool_name: {
        type: 'string',
        description: 'The name of the tool to execute',
      },
      inputs: {
        type: 'object',
        description: 'Tool inputs (as defined by the tool\'s input schema)',
      },
    },
    required: ['installation_id', 'tool_name'],
  },
};

export async function handleInvokeToolkitTool(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const input: InvokeToolkitToolInput = {
      installation_id: String(args.installation_id),
      tool_name: String(args.tool_name),
      inputs: (args.inputs as Record<string, unknown>) || {},
    };

    const result = await api.invokeToolkitTool(input);

    if (!result.success) {
      return {
        content: [{ type: 'text', text: result.error || 'Tool execution failed' }],
        isError: true,
      };
    }

    const text = `✓ Tool executed successfully!

**Result:**
${JSON.stringify(result.data, null, 2)}

${result.execution_time_ms ? `Execution time: ${result.execution_time_ms}ms` : ''}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error invoking tool: ${message}` }],
      isError: true,
    };
  }
}

// ============================================
// Tool Management Tools (Read-Only)
// ============================================

export const listToolkitToolsTool: Tool = {
  name: 'mcp__flowdot__list_toolkit_tools',
  description: `List all tools in a toolkit.

Shows tool names, descriptions, and types (HTTP or Workflow).`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID (hash)',
      },
    },
    required: ['toolkit_id'],
  },
};

export async function handleListToolkitTools(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const tools = await api.listToolkitTools(toolkitId);

    if (!tools || tools.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No tools in this toolkit.'
        }],
      };
    }

    const toolsInfo = tools.map((tool: any) => {
      const enabled = tool.is_enabled ? '✓' : '○';
      const creds = tool.credential_keys && tool.credential_keys.length > 0
        ? `Requires: ${tool.credential_keys.join(', ')}`
        : 'No credentials required';

      return `${enabled} **${tool.title}** (${tool.name})
  Type: ${tool.tool_type}
  Description: ${tool.description}
  ${creds}`;
    });

    const text = `## Toolkit Tools (${tools.length})

${toolsInfo.join('\n\n')}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing tools: ${message}` }],
      isError: true,
    };
  }
}

export const getToolkitToolTool: Tool = {
  name: 'mcp__flowdot__get_toolkit_tool',
  description: `Get detailed information about a specific tool in a toolkit.

Shows input schema, configuration, and requirements.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID (hash)',
      },
      tool_id: {
        type: 'string',
        description: 'The tool ID',
      },
    },
    required: ['toolkit_id', 'tool_id'],
  },
};

export async function handleGetToolkitTool(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const toolId = String(args.tool_id);

    const result = await api.getToolkitTool(toolkitId, toolId);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Tool not found.' }],
        isError: true,
      };
    }

    const tool = result;
    const text = `# ${tool.title}

**Name:** ${tool.name}
**Type:** ${tool.tool_type}
**Status:** ${tool.is_enabled ? 'Enabled' : 'Disabled'}

**Description:**
${tool.description}

**Input Schema:**
${JSON.stringify(tool.input_schema, null, 2)}

${tool.credential_keys && tool.credential_keys.length > 0 ? `
**Required Credentials:**
${tool.credential_keys.join(', ')}
` : ''}

${tool.tool_type === 'http' && tool.endpoint_config ? `
**HTTP Configuration:**
- URL: ${tool.endpoint_config.url}
- Method: ${tool.endpoint_config.method}
` : ''}

${tool.tool_type === 'workflow' && tool.workflow_hash ? `
**Workflow:** ${tool.workflow_hash}
` : ''}

**Timeout:** ${tool.timeout_ms || 30000}ms`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting tool: ${message}` }],
      isError: true,
    };
  }
}

export const createToolkitToolTool: Tool = {
  name: 'mcp__flowdot__create_toolkit_tool',
  description: `Create a new tool in a toolkit.

Add HTTP or Workflow-based tools to your agent toolkit with custom input/output schemas and credentials.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID (hash)',
      },
      name: {
        type: 'string',
        description: 'Unique tool name (lowercase, hyphens, e.g., "get-weather")',
      },
      title: {
        type: 'string',
        description: 'Display title (e.g., "Get Weather Data")',
      },
      description: {
        type: 'string',
        description: 'What this tool does',
      },
      tool_type: {
        type: 'string',
        enum: ['http', 'workflow'],
        description: 'Tool type: "http" for REST API calls, "workflow" for FlowDot workflows',
      },
      input_schema: {
        type: 'object',
        description: 'JSON Schema defining tool inputs',
      },
      output_schema: {
        type: 'object',
        description: 'Optional JSON Schema defining tool outputs',
      },
      endpoint_config: {
        type: 'object',
        description: 'HTTP configuration (required if tool_type is "http")',
        properties: {
          url: { type: 'string', description: 'API endpoint URL' },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
        },
      },
      workflow_hash: {
        type: 'string',
        description: 'FlowDot workflow hash (required if tool_type is "workflow")',
      },
      credential_keys: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of credential keys this tool requires (e.g., ["API_KEY", "API_SECRET"])',
      },
      timeout_ms: {
        type: 'number',
        description: 'Execution timeout in milliseconds (1000-300000, default: 30000)',
      },
      is_enabled: {
        type: 'boolean',
        description: 'Whether the tool is enabled (default: true)',
      },
    },
    required: ['toolkit_id', 'name', 'title', 'description', 'tool_type', 'input_schema'],
  },
};

export async function handleCreateToolkitTool(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const input: CreateToolkitToolInput = {
      name: String(args.name),
      title: String(args.title),
      description: String(args.description),
      tool_type: args.tool_type as 'http' | 'workflow',
      input_schema: args.input_schema as Record<string, unknown>,
    };

    if (args.output_schema) input.output_schema = args.output_schema as Record<string, unknown>;
    if (args.endpoint_config) input.endpoint_config = args.endpoint_config as any;
    if (args.workflow_hash) input.workflow_hash = String(args.workflow_hash);
    if (args.credential_keys && Array.isArray(args.credential_keys)) {
      input.credential_keys = args.credential_keys.map(k => String(k));
    }
    if (args.timeout_ms) input.timeout_ms = Number(args.timeout_ms);
    if (args.is_enabled !== undefined) input.is_enabled = Boolean(args.is_enabled);

    const result = await api.createToolkitTool(toolkitId, input);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to create tool' }],
        isError: true,
      };
    }

    const text = `✓ Tool created successfully!

**Name:** ${result.name}
**Title:** ${result.title}
**Type:** ${result.tool_type}
**ID:** ${result.id}

Your tool is now available in the toolkit.`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error creating tool: ${message}` }],
      isError: true,
    };
  }
}

export const updateToolkitToolTool: Tool = {
  name: 'mcp__flowdot__update_toolkit_tool',
  description: `Update an existing tool in a toolkit.

Modify tool configuration, schemas, endpoints, or credentials.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID (hash)',
      },
      tool_id: {
        type: 'string',
        description: 'The tool ID to update',
      },
      name: {
        type: 'string',
        description: 'New tool name',
      },
      title: {
        type: 'string',
        description: 'New title',
      },
      description: {
        type: 'string',
        description: 'New description',
      },
      tool_type: {
        type: 'string',
        enum: ['http', 'workflow'],
        description: 'New tool type',
      },
      input_schema: {
        type: 'object',
        description: 'New input schema',
      },
      output_schema: {
        type: 'object',
        description: 'New output schema',
      },
      endpoint_config: {
        type: 'object',
        description: 'New HTTP configuration',
      },
      workflow_hash: {
        type: 'string',
        description: 'New workflow hash',
      },
      credential_keys: {
        type: 'array',
        items: { type: 'string' },
        description: 'New credential keys list',
      },
      timeout_ms: {
        type: 'number',
        description: 'New timeout in milliseconds',
      },
      is_enabled: {
        type: 'boolean',
        description: 'Enable or disable the tool',
      },
    },
    required: ['toolkit_id', 'tool_id'],
  },
};

export async function handleUpdateToolkitTool(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const toolId = String(args.tool_id);
    const input: UpdateToolkitToolInput = {};

    if (args.name) input.name = String(args.name);
    if (args.title) input.title = String(args.title);
    if (args.description) input.description = String(args.description);
    if (args.tool_type) input.tool_type = args.tool_type as 'http' | 'workflow';
    if (args.input_schema) input.input_schema = args.input_schema as Record<string, unknown>;
    if (args.output_schema) input.output_schema = args.output_schema as Record<string, unknown>;
    if (args.endpoint_config) input.endpoint_config = args.endpoint_config as any;
    if (args.workflow_hash) input.workflow_hash = String(args.workflow_hash);
    if (args.credential_keys && Array.isArray(args.credential_keys)) {
      input.credential_keys = args.credential_keys.map(k => String(k));
    }
    if (args.timeout_ms) input.timeout_ms = Number(args.timeout_ms);
    if (args.is_enabled !== undefined) input.is_enabled = Boolean(args.is_enabled);

    const result = await api.updateToolkitTool(toolkitId, toolId, input);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to update tool' }],
        isError: true,
      };
    }

    const text = `✓ Tool updated successfully!

**Name:** ${result.name}
**Title:** ${result.title}`;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error updating tool: ${message}` }],
      isError: true,
    };
  }
}

export const deleteToolkitToolTool: Tool = {
  name: 'mcp__flowdot__delete_toolkit_tool',
  description: `Delete a tool from a toolkit.

WARNING: This cannot be undone. The tool will be permanently removed.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      toolkit_id: {
        type: 'string',
        description: 'The toolkit ID (hash)',
      },
      tool_id: {
        type: 'string',
        description: 'The tool ID to delete',
      },
    },
    required: ['toolkit_id', 'tool_id'],
  },
};

export async function handleDeleteToolkitTool(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const toolkitId = String(args.toolkit_id);
    const toolId = String(args.tool_id);

    const result = await api.deleteToolkitTool(toolkitId, toolId);

    const text = result.success
      ? `✓ Tool deleted successfully.`
      : `Error: ${'Failed to delete tool'}`;

    return {
      content: [{ type: 'text', text }],
      isError: !result.success,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error deleting tool: ${message}` }],
      isError: true,
    };
  }
}
