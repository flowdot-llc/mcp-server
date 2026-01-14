/**
 * FlowDot Hub API Client
 *
 * Handles communication with the FlowDot Hub API using MCP tokens.
 */

import {
  ApiResponse,
  Workflow,
  Execution,
  ExecuteWorkflowResult,
  AgentChatResult,
  WorkflowMetrics,
  WorkflowComment,
  ExecutionHistoryItem,
  WorkflowDetails,
  WorkflowInputSchemaResult,
  CreateWorkflowResult,
  WorkflowGraph,
  ValidationResult,
  NodeType,
  NodeTypesResponse,
  WorkflowNode,
  WorkflowConnection,
  AddNodeResult,
  AddConnectionResult,
  SuccessResult,
  PublicWorkflow,
  PaginatedResult,
  RetryExecutionResult,
  // Custom Node Types
  CustomNode,
  CustomNodeComment,
  CustomNodeListFilters,
  CustomNodeSearchFilters,
  CreateCustomNodeInput,
  UpdateCustomNodeInput,
  VoteCustomNodeResult,
  FavoriteCustomNodeResult,
  CreateCustomNodeCommentResult,
  // App Types
  App,
  AppComment,
  AppWorkflow,
  AppListFilters,
  AppSearchFilters,
  CreateAppInput,
  UpdateAppInput,
  CreateAppResult,
  CloneAppResult,
  VoteAppResult,
  FavoriteAppResult,
  CreateAppCommentResult,
  LinkAppWorkflowResult,
  // App Code Editing Types
  EditAppCodeInput,
  AppendAppCodeInput,
  PrependAppCodeInput,
  InsertAppCodeInput,
  AppCodeEditResult,
  // Multi-File App Types
  AppFile,
  CreateAppFileInput,
  UpdateAppFileInput,
  RenameAppFileInput,
  AppFileResult,
  // Sharing Types
  WorkflowPublicUrlResult,
  SharedResult,
  SharedResultDetails,
  SharedResultComment,
  CreateSharedResultInput,
  CreateSharedResultResult,
  CreateCommentResult,
  SharedResultListFilters,
  VoteWorkflowResult,
  VoteSharedResultResult,
  // Input Preset Types
  InputPreset,
  InputPresetListResult,
  CreateInputPresetInput,
  UpdateInputPresetInput,
  CreateInputPresetResult,
  VoteInputPresetResult,
  InputPresetListFilters,
  ToggleCommunityInputsResult,
  // Team Types
  Team,
  // Knowledge Base Types
  DocumentCategory,
  KnowledgeDocument,
  KnowledgeQueryResponse,
  KnowledgeStorage,
  CreateKnowledgeCategoryInput,
  UpdateKnowledgeCategoryInput,
  UploadTextDocumentInput,
  UploadDocumentFromUrlInput,
  UploadDocumentResult,
  KnowledgeDocumentListFilters,
  KnowledgeQueryInput,
  KnowledgeCategoryListFilters,
  TransferDocumentInput,
  TransferDocumentResult,
  // Agent Toolkit Types
  AgentToolkit,
  AgentToolkitTool,
  AgentToolkitInstallation,
  ToolkitCredentialRequirement,
  ToolkitComment,
  CreateToolkitInput,
  UpdateToolkitInput,
  ToolkitSearchFilters,
  ToolkitListFilters,
  InstallToolkitResult,
  ToolkitCredentialStatus,
  InvokeToolkitToolInput,
  InvokeToolkitToolResult,
  VoteToolkitResult,
  FavoriteToolkitResult,
  CreateToolkitCommentResult,
} from './types.js';

export class FlowDotApiClient {
  private hubUrl: string;
  private apiToken: string;

  constructor(hubUrl: string, apiToken: string) {
    // Remove trailing slash from hubUrl
    this.hubUrl = hubUrl.replace(/\/$/, '');
    this.apiToken = apiToken;
  }

  /**
   * Make an authenticated request to the FlowDot Hub API.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.hubUrl}/api/mcp/v1${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    const data = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !data.success) {
      let errorMessage = data.error || data.message || `API error: ${response.status}`;

      // Include debug info if available
      if (data.debug) {
        const debug = data.debug as Record<string, unknown>;
        if (debug.hints && Array.isArray(debug.hints) && debug.hints.length > 0) {
          errorMessage += ' | Hints: ' + debug.hints.join('; ');
        }
        if (debug.code_preview) {
          errorMessage += ` | Code starts with: "${String(debug.code_preview).substring(0, 50)}..."`;
        }
      }

      throw new Error(errorMessage);
    }

    return data.data as T;
  }

  /**
   * List workflows available to the user.
   */
  async listWorkflows(filter?: string, favoritesOnly?: boolean): Promise<Workflow[]> {
    const params = new URLSearchParams();
    if (filter) params.set('filter', filter);
    if (favoritesOnly) params.set('favorites_only', 'true');

    const queryString = params.toString();
    const endpoint = `/workflows${queryString ? `?${queryString}` : ''}`;

    return this.request<Workflow[]>(endpoint);
  }

  /**
   * Get a specific workflow by ID.
   */
  async getWorkflow(workflowId: string): Promise<Workflow> {
    return this.request<Workflow>(`/workflows/${workflowId}`);
  }

  /**
   * Execute a workflow.
   */
  async executeWorkflow(
    workflowId: string,
    inputs: Record<string, unknown> = {},
    waitForCompletion: boolean = true,
    mode: string = 'flowdot'
  ): Promise<ExecuteWorkflowResult> {
    return this.request<ExecuteWorkflowResult>(`/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({
        inputs,
        wait_for_completion: waitForCompletion,
        mode,
      }),
    });
  }

  /**
   * Get execution status and results.
   */
  async getExecution(executionId: string): Promise<Execution> {
    return this.request<Execution>(`/executions/${executionId}`);
  }

  /**
   * Chat with the FlowDot agent.
   */
  async agentChat(
    message: string,
    conversationId?: string,
    mode?: string
  ): Promise<AgentChatResult> {
    return this.request<AgentChatResult>('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        mode: mode || 'flowdot',
      }),
    });
  }

  /**
   * Test the connection to the FlowDot Hub.
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.listWorkflows();
      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // Analytics & Feedback (analytics:read scope)
  // ============================================

  /**
   * Get workflow execution metrics.
   */
  async getWorkflowMetrics(workflowId: string, period?: string): Promise<WorkflowMetrics> {
    const params = new URLSearchParams();
    if (period) params.set('period', period);
    const queryString = params.toString();
    return this.request<WorkflowMetrics>(`/workflows/${workflowId}/metrics${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get workflow comments.
   */
  async getWorkflowComments(workflowId: string): Promise<WorkflowComment[]> {
    return this.request<WorkflowComment[]>(`/workflows/${workflowId}/comments`);
  }

  /**
   * Get execution history for a workflow.
   */
  async getExecutionHistory(workflowId: string, page?: number, limit?: number): Promise<PaginatedResult<ExecutionHistoryItem>> {
    const params = new URLSearchParams();
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());
    const queryString = params.toString();
    return this.request<PaginatedResult<ExecutionHistoryItem>>(`/workflows/${workflowId}/executions${queryString ? `?${queryString}` : ''}`);
  }

  // ============================================
  // Workflow Management (workflows:manage scope)
  // ============================================

  /**
   * Get detailed workflow information including nodes, connections, signature.
   */
  async getWorkflowDetails(workflowId: string): Promise<WorkflowDetails> {
    return this.request<WorkflowDetails>(`/workflows/${workflowId}/details`);
  }

  /**
   * Get the input schema for a workflow.
   */
  async getWorkflowInputsSchema(workflowId: string): Promise<WorkflowInputSchemaResult> {
    return this.request<WorkflowInputSchemaResult>(`/workflows/${workflowId}/inputs-schema`);
  }

  /**
   * Duplicate a workflow.
   */
  async duplicateWorkflow(workflowId: string, name?: string): Promise<CreateWorkflowResult> {
    return this.request<CreateWorkflowResult>(`/workflows/${workflowId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  /**
   * Toggle workflow public/private status.
   */
  async toggleWorkflowPublic(workflowId: string, isPublic: boolean): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/workflows/${workflowId}/toggle-public`, {
      method: 'POST',
      body: JSON.stringify({ is_public: isPublic }),
    });
  }

  /**
   * Favorite or unfavorite a workflow.
   */
  async favoriteWorkflow(workflowId: string, favorite: boolean): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/workflows/${workflowId}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ favorite }),
    });
  }

  // ============================================
  // Execution Enhancements (executions:manage scope)
  // ============================================

  /**
   * Cancel a running execution.
   */
  async cancelExecution(executionId: string): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/executions/${executionId}/cancel`, {
      method: 'POST',
    });
  }

  /**
   * Retry a failed execution.
   */
  async retryExecution(executionId: string): Promise<RetryExecutionResult> {
    return this.request<RetryExecutionResult>(`/executions/${executionId}/retry`, {
      method: 'POST',
    });
  }

  /**
   * Get SSE stream URL for execution (client handles actual streaming).
   */
  getExecutionStreamUrl(executionId: string): string {
    return `${this.hubUrl}/api/mcp/v1/executions/${executionId}/stream`;
  }

  /**
   * Get auth token for SSE requests.
   */
  getAuthToken(): string {
    return this.apiToken;
  }

  // ============================================
  // Discovery & Organization (discovery:read scope)
  // ============================================

  /**
   * Get workflow tags.
   */
  async getWorkflowTags(workflowId: string): Promise<{ workflow_id: string; tags: string[] }> {
    return this.request<{ workflow_id: string; tags: string[] }>(`/workflows/${workflowId}/tags`);
  }

  /**
   * Set workflow tags.
   */
  async setWorkflowTags(workflowId: string, tags: string[]): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/workflows/${workflowId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags }),
    });
  }

  /**
   * Search workflows by name, description, or tags.
   */
  async searchWorkflows(query: string, tags?: string[], page?: number): Promise<PaginatedResult<Workflow>> {
    const params = new URLSearchParams();
    params.set('q', query);
    if (tags && tags.length > 0) params.set('tags', tags.join(','));
    if (page) params.set('page', page.toString());
    return this.request<PaginatedResult<Workflow>>(`/workflows/search?${params.toString()}`);
  }

  /**
   * Get public workflows from all users.
   */
  async getPublicWorkflows(page?: number, sortBy?: string): Promise<PaginatedResult<PublicWorkflow>> {
    const params = new URLSearchParams();
    if (page) params.set('page', page.toString());
    if (sortBy) params.set('sort_by', sortBy);
    const queryString = params.toString();
    return this.request<PaginatedResult<PublicWorkflow>>(`/workflows/public${queryString ? `?${queryString}` : ''}`);
  }

  // ============================================
  // Workflow Building (workflows:build scope)
  // ============================================

  /**
   * Create a new empty workflow.
   */
  async createWorkflow(name: string, description?: string): Promise<CreateWorkflowResult> {
    return this.request<CreateWorkflowResult>('/workflows', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  /**
   * Delete a workflow.
   */
  async deleteWorkflow(workflowId: string): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/workflows/${workflowId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get the full graph (nodes and connections) of a workflow.
   */
  async getWorkflowGraph(workflowId: string): Promise<WorkflowGraph> {
    return this.request<WorkflowGraph>(`/workflows/${workflowId}/graph`);
  }

  /**
   * Validate a workflow for errors.
   */
  async validateWorkflow(workflowId: string): Promise<ValidationResult> {
    return this.request<ValidationResult>(`/workflows/${workflowId}/validate`, {
      method: 'POST',
    });
  }

  // ============================================
  // Node Operations (nodes:manage scope)
  // ============================================

  /**
   * List all available node types.
   * Note: Response may be an array or object depending on the API version.
   */
  async listAvailableNodes(): Promise<NodeTypesResponse> {
    return this.request<NodeTypesResponse>('/node-types');
  }

  /**
   * Get schema for a specific node type.
   */
  async getNodeSchema(nodeType: string): Promise<NodeType> {
    return this.request<NodeType>(`/node-types/${encodeURIComponent(nodeType)}/schema`);
  }

  /**
   * Add a node to a workflow.
   */
  async addNode(
    workflowId: string,
    nodeType: string,
    position: { x: number; y: number },
    properties?: Record<string, unknown>
  ): Promise<AddNodeResult> {
    return this.request<AddNodeResult>(`/workflows/${workflowId}/nodes`, {
      method: 'POST',
      body: JSON.stringify({ type: nodeType, position, properties }),
    });
  }

  /**
   * Update a node in a workflow.
   */
  async updateNode(
    workflowId: string,
    nodeId: string,
    updates: { position?: { x: number; y: number }; properties?: Record<string, unknown> }
  ): Promise<WorkflowNode> {
    return this.request<WorkflowNode>(`/workflows/${workflowId}/nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a node from a workflow.
   */
  async deleteNode(workflowId: string, nodeId: string): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/workflows/${workflowId}/nodes/${nodeId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Connection Operations (connections:manage scope)
  // ============================================

  /**
   * Add a connection between nodes.
   */
  async addConnection(
    workflowId: string,
    sourceNodeId: string,
    sourceSocketId: string,
    targetNodeId: string,
    targetSocketId: string
  ): Promise<AddConnectionResult> {
    return this.request<AddConnectionResult>(`/workflows/${workflowId}/connections`, {
      method: 'POST',
      body: JSON.stringify({
        source_node_id: sourceNodeId,
        source_socket_id: sourceSocketId,
        target_node_id: targetNodeId,
        target_socket_id: targetSocketId,
      }),
    });
  }

  /**
   * Delete a connection from a workflow.
   */
  async deleteConnection(workflowId: string, connectionId: string): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/workflows/${workflowId}/connections/${connectionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all connections for a specific node.
   */
  async getNodeConnections(workflowId: string, nodeId: string): Promise<WorkflowConnection[]> {
    return this.request<WorkflowConnection[]>(`/workflows/${workflowId}/nodes/${nodeId}/connections`);
  }

  // ============================================
  // Custom Node Operations (custom_nodes:read / custom_nodes:manage)
  // ============================================

  /**
   * List user's own custom nodes.
   */
  async listCustomNodes(
    options?: CustomNodeListFilters
  ): Promise<PaginatedResult<CustomNode>> {
    const params = new URLSearchParams();
    if (options?.search) params.set('search', options.search);
    if (options?.category) params.set('category', options.category);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.page) params.set('page', options.page.toString());
    const queryString = params.toString();
    return this.request<PaginatedResult<CustomNode>>(
      `/custom-nodes${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Search public custom nodes.
   */
  async searchPublicCustomNodes(
    filters?: CustomNodeSearchFilters
  ): Promise<PaginatedResult<CustomNode>> {
    const params = new URLSearchParams();
    if (filters?.q) params.set('q', filters.q);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.tags && filters.tags.length > 0) params.set('tags', JSON.stringify(filters.tags));
    if (filters?.verified_only) params.set('verified_only', 'true');
    if (filters?.sort) params.set('sort', filters.sort);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.page) params.set('page', filters.page.toString());
    const queryString = params.toString();
    return this.request<PaginatedResult<CustomNode>>(
      `/custom-nodes/search${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Get a specific custom node with full details including script_code.
   */
  async getCustomNode(nodeId: string): Promise<CustomNode> {
    return this.request<CustomNode>(`/custom-nodes/${nodeId}`);
  }

  /**
   * Get comments for a custom node.
   */
  async getCustomNodeComments(nodeId: string): Promise<CustomNodeComment[]> {
    return this.request<CustomNodeComment[]>(`/custom-nodes/${nodeId}/comments`);
  }

  /**
   * Create a new custom node.
   */
  async createCustomNode(input: CreateCustomNodeInput): Promise<CreateWorkflowResult> {
    return this.request<CreateWorkflowResult>('/custom-nodes', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Update a custom node.
   */
  async updateCustomNode(nodeId: string, updates: UpdateCustomNodeInput): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/custom-nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a custom node.
   */
  async deleteCustomNode(nodeId: string): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/custom-nodes/${nodeId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Copy a public custom node to user's library.
   */
  async copyCustomNode(nodeId: string, name?: string): Promise<CreateWorkflowResult> {
    return this.request<CreateWorkflowResult>(`/custom-nodes/${nodeId}/copy`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  /**
   * Toggle custom node visibility.
   */
  async toggleCustomNodeVisibility(
    nodeId: string,
    visibility: 'private' | 'public' | 'unlisted'
  ): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/custom-nodes/${nodeId}/visibility`, {
      method: 'POST',
      body: JSON.stringify({ visibility }),
    });
  }

  /**
   * Vote on a custom node.
   */
  async voteCustomNode(nodeId: string, vote: 'up' | 'down' | 'remove'): Promise<VoteCustomNodeResult> {
    return this.request<VoteCustomNodeResult>(`/custom-nodes/${nodeId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    });
  }

  /**
   * Toggle favorite on a custom node.
   */
  async favoriteCustomNode(nodeId: string, favorite: boolean): Promise<FavoriteCustomNodeResult> {
    return this.request<FavoriteCustomNodeResult>(`/custom-nodes/${nodeId}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ favorite }),
    });
  }

  /**
   * Add a comment to a custom node.
   */
  async addCustomNodeComment(
    nodeId: string,
    content: string,
    parentId?: number
  ): Promise<CreateCustomNodeCommentResult> {
    return this.request<CreateCustomNodeCommentResult>(`/custom-nodes/${nodeId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId }),
    });
  }

  // ============================================
  // App Operations (apps:read / apps:manage)
  // ============================================

  /**
   * List user's own apps.
   */
  async listApps(options?: AppListFilters): Promise<PaginatedResult<App>> {
    const params = new URLSearchParams();
    if (options?.search) params.set('search', options.search);
    if (options?.category) params.set('category', options.category);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.page) params.set('page', options.page.toString());
    const queryString = params.toString();
    return this.request<PaginatedResult<App>>(
      `/apps${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Search public apps.
   */
  async searchPublicApps(filters?: AppSearchFilters): Promise<PaginatedResult<App>> {
    const params = new URLSearchParams();
    if (filters?.q) params.set('q', filters.q);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.tag) params.set('tag', filters.tag);
    if (filters?.mobile_compatible) params.set('mobile_compatible', 'true');
    if (filters?.sort) params.set('sort', filters.sort);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.page) params.set('page', filters.page.toString());
    const queryString = params.toString();
    return this.request<PaginatedResult<App>>(
      `/apps/search${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Get app categories.
   */
  async getAppCategories(): Promise<string[]> {
    return this.request<string[]>('/apps/categories');
  }

  /**
   * Get popular app tags.
   */
  async getAppTags(): Promise<string[]> {
    return this.request<string[]>('/apps/tags');
  }

  /**
   * Get a specific app with full details including code.
   */
  async getApp(appId: string): Promise<App> {
    return this.request<App>(`/apps/${appId}`);
  }

  /**
   * Get comments for an app.
   */
  async getAppComments(appId: string): Promise<AppComment[]> {
    return this.request<AppComment[]>(`/apps/${appId}/comments`);
  }

  /**
   * Create a new app.
   */
  async createApp(input: CreateAppInput): Promise<CreateAppResult> {
    return this.request<CreateAppResult>('/apps', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Update an app.
   */
  async updateApp(appId: string, updates: UpdateAppInput): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/apps/${appId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete an app.
   */
  async deleteApp(appId: string): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/apps/${appId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Publish an app (make it public).
   */
  async publishApp(appId: string): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/apps/${appId}/publish`, {
      method: 'POST',
    });
  }

  /**
   * Unpublish an app (make it private).
   */
  async unpublishApp(appId: string): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/apps/${appId}/unpublish`, {
      method: 'POST',
    });
  }

  /**
   * Clone a public app to user's library.
   */
  async cloneApp(appId: string, name?: string): Promise<CloneAppResult> {
    return this.request<CloneAppResult>(`/apps/${appId}/clone`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  /**
   * Vote on an app.
   */
  async voteApp(appId: string, vote: 'up' | 'down' | 'remove'): Promise<VoteAppResult> {
    return this.request<VoteAppResult>(`/apps/${appId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    });
  }

  /**
   * Toggle favorite on an app.
   */
  async favoriteApp(appId: string, favorite: boolean): Promise<FavoriteAppResult> {
    return this.request<FavoriteAppResult>(`/apps/${appId}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ favorite }),
    });
  }

  /**
   * Add a comment to an app.
   */
  async addAppComment(
    appId: string,
    content: string,
    parentId?: number
  ): Promise<CreateAppCommentResult> {
    return this.request<CreateAppCommentResult>(`/apps/${appId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId }),
    });
  }

  /**
   * Get workflows linked to an app.
   */
  async getAppWorkflows(appId: string): Promise<AppWorkflow[]> {
    return this.request<AppWorkflow[]>(`/apps/${appId}/workflows`);
  }

  /**
   * Link a workflow to an app.
   */
  async linkAppWorkflow(appId: string, workflowHash: string, alias?: string): Promise<LinkAppWorkflowResult> {
    return this.request<LinkAppWorkflowResult>(`/apps/${appId}/workflows`, {
      method: 'POST',
      body: JSON.stringify({ workflow_hash: workflowHash, alias }),
    });
  }

  /**
   * Unlink a workflow from an app.
   */
  async unlinkAppWorkflow(appId: string, workflowHash: string): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/apps/${appId}/workflows/${workflowHash}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // App Code Editing (apps:manage scope)
  // ============================================

  /**
   * Edit app code using string replacement (find and replace).
   * Replaces old_string with new_string in the app's code.
   */
  async editAppCode(appId: string, input: EditAppCodeInput): Promise<AppCodeEditResult> {
    return this.request<AppCodeEditResult>(`/apps/${appId}/code/edit`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Append content to the end of app code.
   */
  async appendAppCode(appId: string, input: AppendAppCodeInput): Promise<AppCodeEditResult> {
    return this.request<AppCodeEditResult>(`/apps/${appId}/code/append`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Prepend content to the beginning of app code.
   */
  async prependAppCode(appId: string, input: PrependAppCodeInput): Promise<AppCodeEditResult> {
    return this.request<AppCodeEditResult>(`/apps/${appId}/code/prepend`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Insert content after a specific pattern in app code.
   */
  async insertAppCode(appId: string, input: InsertAppCodeInput): Promise<AppCodeEditResult> {
    return this.request<AppCodeEditResult>(`/apps/${appId}/code/insert`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // ============================================
  // Multi-File App Operations (apps:manage scope)
  // ============================================

  /**
   * List all files in a multi-file app.
   */
  async listAppFiles(appId: string): Promise<AppFile[]> {
    return this.request<AppFile[]>(`/apps/${appId}/files`);
  }

  /**
   * Get a specific file from a multi-file app.
   */
  async getAppFile(appId: string, filePath: string): Promise<AppFile> {
    return this.request<AppFile>(`/apps/${appId}/files/${encodeURIComponent(filePath)}`);
  }

  /**
   * Create a new file in a multi-file app.
   */
  async createAppFile(appId: string, input: CreateAppFileInput): Promise<AppFileResult> {
    return this.request<AppFileResult>(`/apps/${appId}/files`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Update an existing file in a multi-file app.
   */
  async updateAppFile(appId: string, filePath: string, input: UpdateAppFileInput): Promise<AppFileResult> {
    return this.request<AppFileResult>(`/apps/${appId}/files/${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  /**
   * Delete a file from a multi-file app.
   */
  async deleteAppFile(appId: string, filePath: string): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/apps/${appId}/files/${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Rename a file in a multi-file app.
   */
  async renameAppFile(appId: string, filePath: string, input: RenameAppFileInput): Promise<AppFileResult> {
    return this.request<AppFileResult>(`/apps/${appId}/files/${encodeURIComponent(filePath)}/rename`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Set a file as the entry point for a multi-file app.
   */
  async setAppEntryFile(appId: string, filePath: string): Promise<AppFileResult> {
    return this.request<AppFileResult>(`/apps/${appId}/files/${encodeURIComponent(filePath)}/set-entry`, {
      method: 'POST',
    });
  }

  // convertAppToMultiFile removed - all apps are multi-file by default

  // ============================================
  // Sharing & Public URLs (sharing:read / sharing:manage)
  // ============================================

  /**
   * Get the public URL for a workflow.
   */
  async getWorkflowPublicUrl(workflowId: string): Promise<WorkflowPublicUrlResult> {
    return this.request<WorkflowPublicUrlResult>(`/workflows/${workflowId}/public-url`);
  }

  /**
   * List shared results for a workflow.
   */
  async listSharedResults(
    workflowId: string,
    options?: SharedResultListFilters
  ): Promise<PaginatedResult<SharedResult>> {
    const params = new URLSearchParams();
    if (options?.sort) params.set('sort', options.sort);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.page) params.set('page', options.page.toString());
    const queryString = params.toString();
    return this.request<PaginatedResult<SharedResult>>(
      `/workflows/${workflowId}/shared-results${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Get a specific shared result.
   */
  async getSharedResult(workflowId: string, resultHash: string): Promise<SharedResultDetails> {
    return this.request<SharedResultDetails>(`/workflows/${workflowId}/shared-results/${resultHash}`);
  }

  /**
   * Get comments for a shared result.
   */
  async getSharedResultComments(workflowId: string, resultHash: string): Promise<SharedResultComment[]> {
    return this.request<SharedResultComment[]>(`/workflows/${workflowId}/shared-results/${resultHash}/comments`);
  }

  /**
   * Create a shared result from an execution.
   */
  async createSharedResult(
    workflowId: string,
    input: CreateSharedResultInput
  ): Promise<CreateSharedResultResult> {
    return this.request<CreateSharedResultResult>(`/workflows/${workflowId}/shared-results`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Add a comment to a workflow.
   */
  async addWorkflowComment(
    workflowId: string,
    content: string,
    parentId?: number
  ): Promise<CreateCommentResult> {
    return this.request<CreateCommentResult>(`/workflows/${workflowId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId }),
    });
  }

  /**
   * Add a comment to a shared result.
   */
  async addSharedResultComment(
    workflowId: string,
    resultHash: string,
    content: string,
    parentId?: number
  ): Promise<CreateCommentResult> {
    return this.request<CreateCommentResult>(
      `/workflows/${workflowId}/shared-results/${resultHash}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ content, parent_id: parentId }),
      }
    );
  }

  /**
   * Vote on a workflow.
   */
  async voteWorkflow(workflowId: string, vote: 'up' | 'down' | 'remove'): Promise<VoteWorkflowResult> {
    return this.request<VoteWorkflowResult>(`/workflows/${workflowId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    });
  }

  /**
   * Vote on a shared result.
   */
  async voteSharedResult(
    workflowId: string,
    resultHash: string,
    vote: 'up' | 'down' | 'remove'
  ): Promise<VoteSharedResultResult> {
    return this.request<VoteSharedResultResult>(
      `/workflows/${workflowId}/shared-results/${resultHash}/vote`,
      {
        method: 'POST',
        body: JSON.stringify({ vote }),
      }
    );
  }

  // ============================================
  // Input Presets (presets:read / presets:manage)
  // ============================================

  /**
   * List input presets for a workflow.
   */
  async listInputPresets(
    workflowId: string,
    options?: InputPresetListFilters
  ): Promise<InputPresetListResult> {
    const params = new URLSearchParams();
    if (options?.sort) params.set('sort', options.sort);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.page) params.set('page', options.page.toString());
    const queryString = params.toString();
    return this.request<InputPresetListResult>(
      `/workflows/${workflowId}/input-presets${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Get a specific input preset.
   */
  async getInputPreset(workflowId: string, presetHash: string): Promise<InputPreset> {
    return this.request<InputPreset>(`/workflows/${workflowId}/input-presets/${presetHash}`);
  }

  /**
   * Create a new input preset.
   */
  async createInputPreset(
    workflowId: string,
    input: CreateInputPresetInput
  ): Promise<CreateInputPresetResult> {
    return this.request<CreateInputPresetResult>(`/workflows/${workflowId}/input-presets`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Update an input preset.
   */
  async updateInputPreset(
    workflowId: string,
    presetHash: string,
    updates: UpdateInputPresetInput
  ): Promise<InputPreset> {
    return this.request<InputPreset>(`/workflows/${workflowId}/input-presets/${presetHash}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete an input preset.
   */
  async deleteInputPreset(workflowId: string, presetHash: string): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/workflows/${workflowId}/input-presets/${presetHash}`, {
      method: 'DELETE',
    });
  }

  /**
   * Vote on an input preset.
   */
  async voteInputPreset(
    workflowId: string,
    presetHash: string,
    vote: 'up' | 'down' | 'remove'
  ): Promise<VoteInputPresetResult> {
    return this.request<VoteInputPresetResult>(
      `/workflows/${workflowId}/input-presets/${presetHash}/vote`,
      {
        method: 'POST',
        body: JSON.stringify({ vote }),
      }
    );
  }

  /**
   * Toggle community inputs (input presets) for a workflow.
   */
  async toggleCommunityInputs(
    workflowId: string,
    enabled: boolean
  ): Promise<ToggleCommunityInputsResult> {
    return this.request<ToggleCommunityInputsResult>(`/workflows/${workflowId}/community-inputs`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  // ============================================
  // Teams (teams:read)
  // ============================================

  /**
   * List teams the user belongs to.
   */
  async listUserTeams(): Promise<Team[]> {
    return this.request<Team[]>('/teams');
  }

  // ============================================
  // Knowledge Base (knowledge:read / knowledge:manage)
  // ============================================

  /**
   * List knowledge base categories.
   * @param filters - Optional filters for team_id or personal categories
   */
  async listKnowledgeCategories(filters?: KnowledgeCategoryListFilters): Promise<DocumentCategory[]> {
    const params = new URLSearchParams();
    if (filters?.team_id) params.set('team_id', filters.team_id.toString());
    if (filters?.personal) params.set('personal', '1');

    const queryString = params.toString();
    return this.request<DocumentCategory[]>(`/knowledge/categories${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get a specific knowledge base category.
   */
  async getKnowledgeCategory(categoryId: number): Promise<DocumentCategory> {
    return this.request<DocumentCategory>(`/knowledge/categories/${categoryId}`);
  }

  /**
   * Create a new knowledge base category.
   */
  async createKnowledgeCategory(input: CreateKnowledgeCategoryInput): Promise<DocumentCategory> {
    return this.request<DocumentCategory>('/knowledge/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Update a knowledge base category.
   */
  async updateKnowledgeCategory(
    categoryId: number,
    updates: UpdateKnowledgeCategoryInput
  ): Promise<DocumentCategory> {
    return this.request<DocumentCategory>(`/knowledge/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a knowledge base category.
   */
  async deleteKnowledgeCategory(categoryId: number): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/knowledge/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  /**
   * List knowledge base documents.
   * @param filters - Optional filters for category, team, and status
   */
  async listKnowledgeDocuments(filters?: KnowledgeDocumentListFilters): Promise<KnowledgeDocument[]> {
    const params = new URLSearchParams();
    if (filters?.category_id) params.set('category_id', filters.category_id.toString());
    if (filters?.team_id !== undefined) params.set('team_id', filters.team_id.toString());
    if (filters?.status) params.set('status', filters.status);

    const queryString = params.toString();
    const endpoint = `/knowledge/documents${queryString ? `?${queryString}` : ''}`;

    return this.request<KnowledgeDocument[]>(endpoint);
  }

  /**
   * Get a specific knowledge base document.
   */
  async getKnowledgeDocument(documentId: string | number): Promise<KnowledgeDocument> {
    return this.request<KnowledgeDocument>(`/knowledge/documents/${documentId}`);
  }

  /**
   * Upload text content as a document.
   */
  async uploadTextDocument(input: UploadTextDocumentInput): Promise<UploadDocumentResult> {
    return this.request<UploadDocumentResult>('/knowledge/documents/upload-text', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Upload a document from a URL.
   */
  async uploadDocumentFromUrl(input: UploadDocumentFromUrlInput): Promise<UploadDocumentResult> {
    return this.request<UploadDocumentResult>('/knowledge/documents/upload-from-url', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Move a document to a different category.
   */
  async moveDocumentToCategory(documentId: number, categoryId: number | null): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/knowledge/documents/${documentId}/category`, {
      method: 'PUT',
      body: JSON.stringify({ category_id: categoryId }),
    });
  }

  /**
   * Transfer document ownership between personal and team.
   * @param documentId - The document ID to transfer
   * @param input - Transfer options (team_id and optional category_id)
   */
  async transferDocumentOwnership(
    documentId: number,
    input: TransferDocumentInput
  ): Promise<TransferDocumentResult> {
    return this.request<TransferDocumentResult>(`/knowledge/documents/${documentId}/transfer`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  /**
   * Reprocess a failed or pending document.
   */
  async reprocessDocument(documentId: number): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/knowledge/documents/${documentId}/reprocess`, {
      method: 'POST',
    });
  }

  /**
   * Delete a knowledge base document.
   */
  async deleteKnowledgeDocument(documentId: number): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/knowledge/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Query the knowledge base using RAG.
   */
  async queryKnowledgeBase(input: KnowledgeQueryInput): Promise<KnowledgeQueryResponse> {
    return this.request<KnowledgeQueryResponse>('/knowledge/query', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Get knowledge base storage usage.
   */
  async getKnowledgeStorage(): Promise<KnowledgeStorage> {
    return this.request<KnowledgeStorage>('/knowledge/storage');
  }

  // ============================================
  // Agent Toolkit Operations
  // ============================================

  /**
   * List user's own toolkits.
   */
  async listAgentToolkits(filters?: ToolkitListFilters): Promise<PaginatedResult<AgentToolkit>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.page) params.set('page', filters.page.toString());
    const queryString = params.toString();
    return this.request<PaginatedResult<AgentToolkit>>(`/agent-toolkits${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Search public toolkits in the marketplace.
   */
  async searchPublicAgentToolkits(filters?: ToolkitSearchFilters): Promise<PaginatedResult<AgentToolkit>> {
    const params = new URLSearchParams();
    if (filters?.query) params.set('query', filters.query);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.tags) params.set('tags', filters.tags.join(','));
    if (filters?.verified_only) params.set('verified_only', 'true');
    if (filters?.sort) params.set('sort', filters.sort);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.page) params.set('page', filters.page.toString());
    const queryString = params.toString();
    return this.request<PaginatedResult<AgentToolkit>>(`/agent-toolkits/search${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get detailed information about a toolkit.
   */
  async getAgentToolkit(toolkitId: string): Promise<AgentToolkit> {
    return this.request<AgentToolkit>(`/agent-toolkits/${toolkitId}`);
  }

  /**
   * Create a new agent toolkit.
   */
  async createAgentToolkit(input: CreateToolkitInput): Promise<AgentToolkit> {
    return this.request<AgentToolkit>('/agent-toolkits', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Update an existing toolkit.
   */
  async updateAgentToolkit(toolkitId: string, input: UpdateToolkitInput): Promise<AgentToolkit> {
    return this.request<AgentToolkit>(`/agent-toolkits/${toolkitId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  /**
   * Delete a toolkit.
   */
  async deleteAgentToolkit(toolkitId: string): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/agent-toolkits/${toolkitId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Copy/duplicate a toolkit.
   */
  async copyAgentToolkit(toolkitId: string, name?: string): Promise<AgentToolkit> {
    return this.request<AgentToolkit>(`/agent-toolkits/${toolkitId}/copy`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  /**
   * Toggle toolkit visibility.
   */
  async toggleToolkitVisibility(
    toolkitId: string,
    visibility: 'private' | 'public' | 'unlisted'
  ): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/agent-toolkits/${toolkitId}/toggle-public`, {
      method: 'POST',
      body: JSON.stringify({ visibility }),
    });
  }

  /**
   * List tools in a toolkit.
   */
  async listToolkitTools(toolkitId: string): Promise<AgentToolkitTool[]> {
    return this.request<AgentToolkitTool[]>(`/agent-toolkits/${toolkitId}/tools`);
  }

  /**
   * Get a specific tool in a toolkit.
   */
  async getToolkitTool(toolkitId: string, toolId: string): Promise<AgentToolkitTool> {
    return this.request<AgentToolkitTool>(`/agent-toolkits/${toolkitId}/tools/${toolId}`);
  }

  /**
   * Install a toolkit.
   */
  async installToolkit(toolkitId: string): Promise<InstallToolkitResult> {
    return this.request<InstallToolkitResult>(`/agent-toolkits/${toolkitId}/install`, {
      method: 'POST',
    });
  }

  /**
   * Uninstall a toolkit.
   */
  async uninstallToolkit(installationId: string): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/agent-toolkit-installations/${installationId}`, {
      method: 'DELETE',
    });
  }

  /**
   * List installed toolkits.
   */
  async listInstalledToolkits(): Promise<AgentToolkitInstallation[]> {
    return this.request<AgentToolkitInstallation[]>('/agent-toolkits/installed');
  }

  /**
   * Get a toolkit installation.
   */
  async getToolkitInstallation(installationId: string): Promise<AgentToolkitInstallation> {
    return this.request<AgentToolkitInstallation>(`/agent-toolkit-installations/${installationId}`);
  }

  /**
   * Update a toolkit installation (credential mapping).
   */
  async updateToolkitInstallation(
    installationId: string,
    credentialMapping: Record<string, string>
  ): Promise<AgentToolkitInstallation> {
    return this.request<AgentToolkitInstallation>(`/agent-toolkit-installations/${installationId}`, {
      method: 'PUT',
      body: JSON.stringify({ credential_mapping: credentialMapping }),
    });
  }

  /**
   * Toggle toolkit installation active status.
   */
  async toggleToolkitActive(installationId: string, isActive: boolean): Promise<SuccessResult> {
    return this.request<SuccessResult>(`/agent-toolkit-installations/${installationId}/toggle-active`, {
      method: 'POST',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  /**
   * Check credentials for a toolkit installation.
   */
  async checkToolkitCredentials(installationId: string): Promise<ToolkitCredentialStatus> {
    return this.request<ToolkitCredentialStatus>(`/agent-toolkit-installations/${installationId}/check-credentials`);
  }

  /**
   * Invoke a tool from an installed toolkit.
   */
  async invokeToolkitTool(input: InvokeToolkitToolInput): Promise<InvokeToolkitToolResult> {
    return this.request<InvokeToolkitToolResult>(
      `/agent-toolkit-installations/${input.installation_id}/execute/${input.tool_name}`,
      {
        method: 'POST',
        body: JSON.stringify({ inputs: input.inputs }),
      }
    );
  }

  /**
   * Get comments on a toolkit.
   */
  async getToolkitComments(toolkitId: string): Promise<ToolkitComment[]> {
    return this.request<ToolkitComment[]>(`/agent-toolkits/${toolkitId}/comments`);
  }

  /**
   * Add a comment to a toolkit.
   */
  async addToolkitComment(
    toolkitId: string,
    content: string,
    parentId?: number
  ): Promise<CreateToolkitCommentResult> {
    return this.request<CreateToolkitCommentResult>(`/agent-toolkits/${toolkitId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId }),
    });
  }

  /**
   * Vote on a toolkit.
   */
  async voteToolkit(toolkitId: string, vote: 'up' | 'down' | 'remove'): Promise<VoteToolkitResult> {
    return this.request<VoteToolkitResult>(`/agent-toolkits/${toolkitId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    });
  }

  /**
   * Favorite a toolkit.
   */
  async favoriteToolkit(toolkitId: string, favorite: boolean): Promise<FavoriteToolkitResult> {
    return this.request<FavoriteToolkitResult>(`/agent-toolkits/${toolkitId}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ favorite }),
    });
  }
}
