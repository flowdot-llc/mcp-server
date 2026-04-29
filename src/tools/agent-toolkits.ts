/**
 * Agent Toolkit MCP Tools
 *
 * Tools for managing MCP agent toolkits - creating, installing, and using
 * custom tool collections for AI agents.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import type {
  AgentToolkit,
  ToolkitListFilters,
  ToolkitSearchFilters,
  CreateToolkitInput,
  UpdateToolkitInput,
  CreateToolkitToolInput,
  UpdateToolkitToolInput,
  InvokeToolkitToolInput} from '../types.js';

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

Toolkits organize related tools and credentials for specific integrations or use cases.

## Credential Requirements

Use credential_requirements to define what credentials users need to provide. Each credential can be:
- **api_key**: Standard API key (most common)
- **oauth**: OAuth 2.0 token that can be refreshed via OAuth flow
- **bearer**: Bearer token
- **basic**: Basic auth credentials
- **custom**: Custom credential type

## OAuth Configuration

For OAuth credentials, set credential_type: "oauth" and provide oauth_config with:

Required OAuth fields:
- **authorization_url**: OAuth authorization endpoint (e.g., "https://api.schwabapi.com/v1/oauth/authorize")
- **token_endpoint**: Token exchange endpoint (e.g., "https://api.schwabapi.com/v1/oauth/token")
- **scopes**: Array of OAuth scopes (e.g., ["api"])

Client credential references (reference OTHER credentials in the same toolkit):
- **client_id_credential_key**: Key name of the credential that stores the client ID (e.g., "SCHWAB_APP_KEY")
- **client_secret_credential_key**: Key name of the credential that stores the client secret (e.g., "SCHWAB_APP_SECRET")

Optional OAuth fields:
- **pkce_enabled**: Enable PKCE (default: true, recommended for security)
- **auth_error_codes**: HTTP codes indicating auth failure (default: [401, 403])
- **auth_error_patterns**: Error message patterns indicating auth failure
- **extra_auth_params**: Additional URL params for authorization request
- **token_endpoint_auth_method**: How client credentials are sent to token_endpoint.
  "client_secret_post" (default) — client_id + client_secret in body params.
  "client_secret_basic" — Authorization: Basic base64(client_id:client_secret) header.
                          Required by Schwab and some other providers; check the
                          provider's docs.
  "none" — public client (PKCE-only). client_id in body, no secret.
- **token_endpoint_extra_params**: Object of extra body params for token requests
  (e.g., \`{ resource: "..." }\` for some Microsoft tenants).
- **callback_mode**: "server" (default) routes the OAuth redirect back to the
  FlowDot Hub. "localhost" routes it to a localhost URL — use this for providers
  whose developer console only accepts \`https://127.0.0.1\` style callbacks
  (e.g., Schwab). The user is shown a manual code-paste UI in this mode.
- **localhost_redirect_uri**: The redirect URI to use when callback_mode=localhost.
- **auto_refresh_enabled**: When true (default), the executor automatically refreshes
  expired access tokens via the stored refresh_token before bubbling a re-auth
  prompt. Set to false for providers that do not issue refresh tokens.

## Example: OAuth Toolkit Setup (e.g., Schwab API)

credential_requirements: [
  {
    key_name: "SCHWAB_APP_KEY",
    label: "Schwab App Key (Client ID)",
    credential_type: "api_key",
    is_required: true,
    description: "Your Schwab Developer App Key"
  },
  {
    key_name: "SCHWAB_APP_SECRET",
    label: "Schwab App Secret (Client Secret)",
    credential_type: "api_key",
    is_required: true,
    description: "Your Schwab Developer App Secret"
  },
  {
    key_name: "SCHWAB_ACCESS_TOKEN",
    label: "Schwab Access Token",
    credential_type: "oauth",
    is_required: true,
    description: "OAuth access token (auto-refreshed by FlowDot)",
    oauth_config: {
      authorization_url: "https://api.schwabapi.com/v1/oauth/authorize",
      token_endpoint: "https://api.schwabapi.com/v1/oauth/token",
      scopes: ["api"],
      client_id_credential_key: "SCHWAB_APP_KEY",
      client_secret_credential_key: "SCHWAB_APP_SECRET",
      token_endpoint_auth_method: "client_secret_basic",
      callback_mode: "localhost",
      localhost_redirect_uri: "https://127.0.0.1",
      auto_refresh_enabled: true,
      pkce_enabled: false
    }
  }
]

Each API tool that uses an OAuth credential must declare a header that injects
the access token, e.g.:
  endpoint_config: {
    method: "GET",
    url: "https://api.schwabapi.com/trader/v1/accounts/accountNumbers",
    headers: { "Authorization": "Bearer {{credential.SCHWAB_ACCESS_TOKEN}}" }
  }
The platform does not auto-add an Authorization header for the oauth credential
type — this is intentional so signed-request toolkits (HMAC, Ed25519) keep
their custom auth scheme.`,
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
      credential_requirements: {
        type: 'array',
        description: 'Credential requirements for the toolkit. Define what API keys, OAuth tokens, or other credentials users need.',
        items: {
          type: 'object',
          properties: {
            key_name: {
              type: 'string',
              description: 'Unique key identifier (e.g., "API_KEY", "SCHWAB_ACCESS_TOKEN")',
            },
            label: {
              type: 'string',
              description: 'Human-readable label (e.g., "Schwab Access Token")',
            },
            credential_type: {
              type: 'string',
              enum: ['api_key', 'oauth', 'bearer', 'basic', 'custom'],
              description: 'Type of credential. Use "oauth" for tokens that can be refreshed via OAuth flow.',
            },
            description: {
              type: 'string',
              description: 'Help text explaining this credential',
            },
            is_required: {
              type: 'boolean',
              description: 'Whether this credential is required (default: true)',
            },
            placeholder: {
              type: 'string',
              description: 'Placeholder text for input field',
            },
            validation_pattern: {
              type: 'string',
              description: 'Regex pattern to validate credential format',
            },
            oauth_config: {
              type: 'object',
              description: 'OAuth configuration (required when credential_type is "oauth")',
              properties: {
                authorization_url: {
                  type: 'string',
                  description: 'OAuth authorization endpoint URL',
                },
                token_endpoint: {
                  type: 'string',
                  description: 'OAuth token exchange endpoint URL',
                },
                scopes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'OAuth scopes to request',
                },
                client_id_credential_key: {
                  type: 'string',
                  description: 'Key name of another credential that contains the OAuth client ID',
                },
                client_secret_credential_key: {
                  type: 'string',
                  description: 'Key name of another credential that contains the OAuth client secret',
                },
                pkce_enabled: {
                  type: 'boolean',
                  description: 'Enable PKCE for OAuth flow (default: true)',
                },
                auth_error_codes: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'HTTP status codes that indicate authentication failure (default: [401, 403])',
                },
                auth_error_patterns: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Error message patterns that indicate authentication failure',
                },
                extra_auth_params: {
                  type: 'object',
                  description: 'Additional URL parameters to include in authorization request',
                },
                token_endpoint_auth_method: {
                  type: 'string',
                  enum: ['client_secret_basic', 'client_secret_post', 'none'],
                  description: 'How client credentials are sent to token_endpoint. "client_secret_post" (default) sends them in the body. "client_secret_basic" sends them as a Basic auth header (required by Schwab and some other providers). "none" sends only client_id (public clients).',
                },
                token_endpoint_extra_params: {
                  type: 'object',
                  description: 'Additional body params to include in token-endpoint requests (provider quirks).',
                },
                callback_mode: {
                  type: 'string',
                  enum: ['server', 'localhost'],
                  description: '"server" (default) routes the OAuth redirect to the FlowDot Hub. "localhost" routes it to a localhost URL — for providers like Schwab whose developer console only accepts https://127.0.0.1 style callbacks. The user is shown a manual code-paste UI in this mode.',
                },
                localhost_redirect_uri: {
                  type: 'string',
                  description: 'The redirect URI to use when callback_mode is "localhost" (e.g., "https://127.0.0.1").',
                },
                auto_refresh_enabled: {
                  type: 'boolean',
                  description: 'When true (default), the executor automatically refreshes expired access tokens before returning a re-auth prompt. Set false for providers that do not issue refresh tokens.',
                },
              },
            },
          },
          required: ['key_name', 'label'],
        },
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
    if (args.credential_requirements && Array.isArray(args.credential_requirements)) {
      input.credential_requirements = args.credential_requirements.map((cred: any) => ({
        key_name: String(cred.key_name),
        label: String(cred.label),
        credential_type: cred.credential_type || 'api_key',
        description: cred.description ? String(cred.description) : undefined,
        is_required: cred.is_required !== undefined ? Boolean(cred.is_required) : true,
        placeholder: cred.placeholder ? String(cred.placeholder) : undefined,
        validation_pattern: cred.validation_pattern ? String(cred.validation_pattern) : undefined,
        oauth_config: cred.oauth_config || undefined,
      }));
    }

    const result = await api.createAgentToolkit(input);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to create toolkit' }],
        isError: true,
      };
    }

    const toolkit = result;
    const credsCount = input.credential_requirements?.length || 0;
    const oauthCreds = input.credential_requirements?.filter(c => c.credential_type === 'oauth').length || 0;

    const text = `✓ Toolkit created successfully!

**ID:** ${toolkit.id}
**Name:** ${toolkit.name}
**Title:** ${toolkit.title}
**Visibility:** ${toolkit.visibility}
${credsCount > 0 ? `**Credentials Defined:** ${credsCount} (${oauthCreds} OAuth)` : ''}

Next steps:
1. Add tools to your toolkit using mcp__flowdot__create_toolkit_tool
2. Install the toolkit using mcp__flowdot__install_toolkit
3. Configure credential mappings in the installation
${oauthCreds > 0 ? '4. Use the "Reconnect" button in the UI to authorize OAuth credentials' : ''}`;

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

Modify title, description, category, tags, and other toolkit properties.

## Updating Credential Requirements

Use credential_requirements to update the toolkit's credential definitions. This REPLACES all existing credentials.

For OAuth credentials, include oauth_config with:
- **authorization_url**: OAuth authorization endpoint
- **token_endpoint**: Token exchange endpoint
- **scopes**: Array of OAuth scopes
- **client_id_credential_key**: Key name of credential containing client ID
- **client_secret_credential_key**: Key name of credential containing client secret
- **pkce_enabled**: Enable PKCE (default: true)
- **token_endpoint_auth_method**: "client_secret_basic" | "client_secret_post" | "none" (default: "client_secret_post"). Use "client_secret_basic" for Schwab.
- **callback_mode**: "server" | "localhost" (default: "server"). Use "localhost" for providers like Schwab.
- **localhost_redirect_uri**: Required when callback_mode="localhost".
- **auto_refresh_enabled**: boolean (default: true). Disable for providers without refresh tokens.

See mcp__flowdot__create_agent_toolkit documentation for full OAuth configuration details and examples.`,
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
      credential_requirements: {
        type: 'array',
        description: 'Updated credential requirements (REPLACES all existing). See mcp__flowdot__create_agent_toolkit for schema details.',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Existing credential ID (include to update, omit for new)',
            },
            key_name: {
              type: 'string',
              description: 'Unique key identifier',
            },
            label: {
              type: 'string',
              description: 'Human-readable label',
            },
            credential_type: {
              type: 'string',
              enum: ['api_key', 'oauth', 'bearer', 'basic', 'custom'],
              description: 'Type of credential',
            },
            description: {
              type: 'string',
              description: 'Help text',
            },
            is_required: {
              type: 'boolean',
              description: 'Whether required',
            },
            placeholder: {
              type: 'string',
              description: 'Placeholder text',
            },
            validation_pattern: {
              type: 'string',
              description: 'Validation regex',
            },
            oauth_config: {
              type: 'object',
              description: 'OAuth configuration for oauth credential type',
              properties: {
                authorization_url: { type: 'string' },
                token_endpoint: { type: 'string' },
                scopes: { type: 'array', items: { type: 'string' } },
                client_id_credential_key: { type: 'string' },
                client_secret_credential_key: { type: 'string' },
                pkce_enabled: { type: 'boolean' },
                auth_error_codes: { type: 'array', items: { type: 'number' } },
                auth_error_patterns: { type: 'array', items: { type: 'string' } },
                extra_auth_params: { type: 'object' },
                token_endpoint_auth_method: {
                  type: 'string',
                  enum: ['client_secret_basic', 'client_secret_post', 'none'],
                },
                token_endpoint_extra_params: { type: 'object' },
                callback_mode: { type: 'string', enum: ['server', 'localhost'] },
                localhost_redirect_uri: { type: 'string' },
                auto_refresh_enabled: { type: 'boolean' },
              },
            },
          },
          required: ['key_name', 'label'],
        },
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
    if (args.credential_requirements && Array.isArray(args.credential_requirements)) {
      input.credential_requirements = args.credential_requirements.map((cred: any) => ({
        id: cred.id ? Number(cred.id) : undefined,
        key_name: String(cred.key_name),
        label: String(cred.label),
        credential_type: cred.credential_type || 'api_key',
        description: cred.description ? String(cred.description) : undefined,
        is_required: cred.is_required !== undefined ? Boolean(cred.is_required) : true,
        placeholder: cred.placeholder ? String(cred.placeholder) : undefined,
        validation_pattern: cred.validation_pattern ? String(cred.validation_pattern) : undefined,
        oauth_config: cred.oauth_config || undefined,
      }));
    }

    const result = await api.updateAgentToolkit(toolkitId, input);

    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to update toolkit' }],
        isError: true,
      };
    }

    const credsUpdated = input.credential_requirements ? ` (${input.credential_requirements.length} credentials)` : '';
    const text = `✓ Toolkit updated successfully!${credsUpdated}

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
    // The API client throws on error, so if we get here without exception, it succeeded.
    await api.deleteAgentToolkit(toolkitId);

    return {
      content: [{ type: 'text', text: `✓ Toolkit deleted successfully.` }],
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

    // The API client throws on error, so if we get here without exception, it succeeded.
    await api.toggleToolkitVisibility(toolkitId, visibility);

    return {
      content: [{ type: 'text', text: `✓ Toolkit visibility changed to: ${visibility}` }],
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
    // The API client throws on error, so if we get here without exception, it succeeded.
    await api.uninstallToolkit(installationId);

    return {
      content: [{ type: 'text', text: `✓ Toolkit uninstalled successfully.` }],
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
  _args: Record<string, unknown>
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

    return {
      content: [
        { type: 'text', text },
        { type: 'text', text: JSON.stringify({ installations }) },
      ],
    };
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

    // The API client throws on error, so if we get here without exception, it succeeded.
    await api.toggleToolkitActive(installationId, isActive);

    return {
      content: [{ type: 'text', text: `✓ Toolkit ${isActive ? 'activated' : 'deactivated'} successfully.` }],
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
     Type: ${req.credential_type}
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

export const testToolkitInstallationTool: Tool = {
  name: 'mcp__flowdot__test_toolkit_installation',
  description: `Run a Test Connection diagnostic against an installed toolkit.

Resolves the toolkit's health-check tool (the one designated by
\`health_check_tool_id\`, or auto-detected as the first GET-method HTTP tool with
no required inputs) and invokes it with empty inputs. Returns a structured
diagnostic outcome. Use this to verify a toolkit is actually working before
running production tools.

Possible \`test_outcome\` values:
- **success** — health-check call returned 2xx; toolkit is healthy.
- **auth_failure** — the executor signaled needs_oauth_reauth. Response includes
  an oauth_reauth payload pointing at the \`initiate_url\` the user should hit
  to re-authorize.
- **tool_error** — non-auth 4xx/5xx from the underlying API.
- **connection_error** — network/transport failure.
- **no_health_check_tool** — toolkit has no eligible tool. Owner should set
  health_check_tool_id via update_agent_toolkit.
- **inactive** — installation has is_active=false; test still ran for diagnostics.

When \`auth_failure\`, prompt the user to open the FlowDot reconnect URL:
\`<flowdot-web-base>/toolkits?reauth_installation_id=<id>&reauth_credential_key=<key>\`
which auto-opens the manual code paste flow for the credential.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      installation_id: {
        type: 'string',
        description: 'The installation ID (numeric, as a string).',
      },
    },
    required: ['installation_id'],
  },
};

export async function handleTestToolkitInstallation(
  api: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const installationId = Number(args.installation_id);
    if (!Number.isFinite(installationId) || installationId <= 0) {
      return {
        content: [{ type: 'text', text: 'installation_id must be a positive integer' }],
        isError: true,
      };
    }

    const result = await api.testToolkitInstallation(installationId);

    const lines = [
      `## Test Connection: ${result.tested_tool_name ?? '(no tool selected)'}`,
      '',
      `**Outcome:** ${result.test_outcome}`,
      result.tested_tool_title ? `**Tool:** ${result.tested_tool_title} (${result.tested_tool_name})` : '',
      result.http_status !== null ? `**HTTP status:** ${result.http_status}` : '',
      `**Message:** ${result.message}`,
    ].filter(Boolean);

    if (result.response_excerpt) {
      lines.push('', '**Response excerpt:**', '```', result.response_excerpt, '```');
    }

    if (result.needs_oauth_reauth && result.oauth_reauth) {
      lines.push(
        '',
        `**Reauthorize required for credential** \`${result.oauth_reauth.credential_key}\` (${result.oauth_reauth.credential_label}).`,
        `User should open: \`<flowdot-web-base>/toolkits?reauth_installation_id=${result.oauth_reauth.installation_id}&reauth_credential_key=${result.oauth_reauth.credential_key}\``,
      );
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
      isError: result.test_outcome !== 'success',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error running test connection: ${message}` }],
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

Runs the tool with provided inputs using your configured credentials.

You can optionally pass credential_overrides to provide dynamic credentials (like tokens from a previous tool call).`,
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
      credential_overrides: {
        type: 'object',
        description: 'Optional credential overrides (e.g., {"SCHWAB_ACCESS_TOKEN": "token_value"}). Use this to pass fresh tokens from a previous token refresh call.',
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
      credential_overrides: args.credential_overrides as Record<string, string> | undefined,
    };

    const result = await api.invokeToolkitTool(input);

    // Defensive check in case result is undefined
    if (!result || !result.success) {
      return {
        content: [{ type: 'text', text: result?.error || 'Tool execution failed' }],
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

    return {
      content: [
        { type: 'text', text },
        { type: 'text', text: JSON.stringify({ tools }) },
      ],
    };
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

/**
 * The full `endpoint_config` schema for HTTP toolkit tools, shared between
 * create_toolkit_tool and update_toolkit_tool. The Hub (Laravel) executor
 * supports all of the fields below; declaring them here lets agents discover
 * and use them. See AgentToolkitExecutionService::executeHttpTool for the
 * runtime semantics, and Docs/AGENT_TOOLKITS.md for the full guide.
 */
const httpEndpointConfigSchema = {
  type: 'object' as const,
  description:
    'HTTP configuration (required if tool_type is "http"). Supports template substitution via {{credential.KEY}} and {{input.name}} in url, headers, query_params, and body_template.',
  properties: {
    url: {
      type: 'string',
      description: 'API endpoint URL. May include {{credential.X}} or {{input.Y}} placeholders.',
    },
    method: {
      type: 'string',
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
    headers: {
      type: 'object',
      description:
        'Map of header name to template string. Each value may reference {{credential.X}} and {{input.Y}}.',
      additionalProperties: { type: 'string' },
    },
    query_params: {
      type: 'object',
      description:
        'Map of query param name to template string. Use this instead of putting query params in `url` so they are encoded correctly.',
      additionalProperties: { type: 'string' },
    },
    body_template: {
      type: 'object',
      description:
        'Body template for POST/PUT/PATCH. Sent as JSON by default. Values are recursively interpolated (strings support {{credential.X}} and {{input.Y}}).',
    },
    body_format: {
      type: 'string',
      enum: ['json', 'form'],
      description: 'Body encoding. "json" (default) or "form" for application/x-www-form-urlencoded (used by OAuth token endpoints).',
    },
    response_mapping: {
      type: 'object',
      description:
        'Optional JSONPath extraction map, e.g., { "id": "$.data.id", "status": "$.data.status" }. When set, the tool returns only the mapped fields.',
      additionalProperties: { type: 'string' },
    },
    signing: {
      type: 'object',
      description:
        'Per-request signed-request auth (e.g., Robinhood Crypto, Binance, Coinbase Pro, Kraken). When present, the executor generates a fresh timestamp, computes a signature over a templated message, and merges signed headers into the request.',
      properties: {
        algorithm: {
          type: 'string',
          enum: ['ed25519', 'hmac-sha256', 'hmac-sha512'],
          description: 'Signing algorithm. Robinhood uses ed25519; most other crypto exchanges use hmac-sha256.',
        },
        key_credential: {
          type: 'string',
          description:
            'Name of a credential (declared in the toolkit) holding the signing key. For ed25519, base64-encoded 32-byte seed or 64-byte secretKey. For HMAC, the raw secret string.',
        },
        message_template: {
          type: 'string',
          description:
            'Template for the message to sign. May use {{credential.X}} and the special vars {{__timestamp}}, {{__path}}, {{__method}}, {{__body}}. Example for Robinhood: "{{credential.ROBINHOOD_API_KEY}}{{__timestamp}}{{__path}}{{__method}}{{__body}}".',
        },
        timestamp_format: {
          type: 'string',
          enum: ['unix_seconds', 'unix_millis', 'iso8601'],
          description: 'Format for the {{__timestamp}} variable. Default: unix_seconds.',
        },
        headers: {
          type: 'object',
          description:
            'Map of header name to template string. May reference {{credential.X}}, the special vars above, and additionally {{__signature_b64}} / {{__signature_hex}} (the computed signature).',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['algorithm', 'key_credential', 'message_template', 'headers'],
    },
  },
} as const;

export const createToolkitToolTool: Tool = {
  name: 'mcp__flowdot__create_toolkit_tool',
  description: `Create a new tool in a toolkit.

Add HTTP or Workflow-based tools to your agent toolkit with custom input/output schemas and credentials.

For signed-request crypto exchange APIs (Robinhood Crypto, Binance, etc.), use endpoint_config.signing to declare the algorithm and message template — the Hub computes a fresh signature on every request.`,
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
      endpoint_config: httpEndpointConfigSchema,
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
      endpoint_config: httpEndpointConfigSchema,
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

    // The API client throws on error, so if we get here without exception, it succeeded.
    // The result may be undefined because the Hub returns {success: true} without a data field.
    await api.deleteToolkitTool(toolkitId, toolId);

    return {
      content: [{ type: 'text', text: `✓ Tool '${toolId}' deleted successfully.` }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error deleting tool: ${message}` }],
      isError: true,
    };
  }
}
