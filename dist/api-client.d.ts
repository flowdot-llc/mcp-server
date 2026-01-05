/**
 * FlowDot Hub API Client
 *
 * Handles communication with the FlowDot Hub API using MCP tokens.
 */
import { Workflow, Execution, ExecuteWorkflowResult, AgentChatResult, WorkflowMetrics, WorkflowComment, ExecutionHistoryItem, WorkflowDetails, WorkflowInputSchemaResult, CreateWorkflowResult, WorkflowGraph, ValidationResult, NodeType, NodeTypesResponse, WorkflowNode, WorkflowConnection, AddNodeResult, AddConnectionResult, SuccessResult, PublicWorkflow, PaginatedResult, RetryExecutionResult, CustomNode, CustomNodeComment, CustomNodeListFilters, CustomNodeSearchFilters, CreateCustomNodeInput, UpdateCustomNodeInput, VoteCustomNodeResult, FavoriteCustomNodeResult, CreateCustomNodeCommentResult, App, AppComment, AppWorkflow, AppListFilters, AppSearchFilters, CreateAppInput, UpdateAppInput, CreateAppResult, CloneAppResult, VoteAppResult, FavoriteAppResult, CreateAppCommentResult, LinkAppWorkflowResult, WorkflowPublicUrlResult, SharedResult, SharedResultDetails, SharedResultComment, CreateSharedResultInput, CreateSharedResultResult, CreateCommentResult, SharedResultListFilters, VoteWorkflowResult, VoteSharedResultResult, InputPreset, InputPresetListResult, CreateInputPresetInput, UpdateInputPresetInput, CreateInputPresetResult, VoteInputPresetResult, InputPresetListFilters, ToggleCommunityInputsResult, DocumentCategory, KnowledgeDocument, KnowledgeQueryResponse, KnowledgeStorage, CreateKnowledgeCategoryInput, UpdateKnowledgeCategoryInput, UploadTextDocumentInput, UploadDocumentFromUrlInput, UploadDocumentResult, KnowledgeDocumentListFilters, KnowledgeQueryInput } from './types.js';
export declare class FlowDotApiClient {
    private hubUrl;
    private apiToken;
    constructor(hubUrl: string, apiToken: string);
    /**
     * Make an authenticated request to the FlowDot Hub API.
     */
    private request;
    /**
     * List workflows available to the user.
     */
    listWorkflows(filter?: string, favoritesOnly?: boolean): Promise<Workflow[]>;
    /**
     * Get a specific workflow by ID.
     */
    getWorkflow(workflowId: string): Promise<Workflow>;
    /**
     * Execute a workflow.
     */
    executeWorkflow(workflowId: string, inputs?: Record<string, unknown>, waitForCompletion?: boolean, mode?: string): Promise<ExecuteWorkflowResult>;
    /**
     * Get execution status and results.
     */
    getExecution(executionId: string): Promise<Execution>;
    /**
     * Chat with the FlowDot agent.
     */
    agentChat(message: string, conversationId?: string, mode?: string): Promise<AgentChatResult>;
    /**
     * Test the connection to the FlowDot Hub.
     */
    testConnection(): Promise<boolean>;
    /**
     * Get workflow execution metrics.
     */
    getWorkflowMetrics(workflowId: string, period?: string): Promise<WorkflowMetrics>;
    /**
     * Get workflow comments.
     */
    getWorkflowComments(workflowId: string): Promise<WorkflowComment[]>;
    /**
     * Get execution history for a workflow.
     */
    getExecutionHistory(workflowId: string, page?: number, limit?: number): Promise<PaginatedResult<ExecutionHistoryItem>>;
    /**
     * Get detailed workflow information including nodes, connections, signature.
     */
    getWorkflowDetails(workflowId: string): Promise<WorkflowDetails>;
    /**
     * Get the input schema for a workflow.
     */
    getWorkflowInputsSchema(workflowId: string): Promise<WorkflowInputSchemaResult>;
    /**
     * Duplicate a workflow.
     */
    duplicateWorkflow(workflowId: string, name?: string): Promise<CreateWorkflowResult>;
    /**
     * Toggle workflow public/private status.
     */
    toggleWorkflowPublic(workflowId: string, isPublic: boolean): Promise<SuccessResult>;
    /**
     * Favorite or unfavorite a workflow.
     */
    favoriteWorkflow(workflowId: string, favorite: boolean): Promise<SuccessResult>;
    /**
     * Cancel a running execution.
     */
    cancelExecution(executionId: string): Promise<SuccessResult>;
    /**
     * Retry a failed execution.
     */
    retryExecution(executionId: string): Promise<RetryExecutionResult>;
    /**
     * Get SSE stream URL for execution (client handles actual streaming).
     */
    getExecutionStreamUrl(executionId: string): string;
    /**
     * Get auth token for SSE requests.
     */
    getAuthToken(): string;
    /**
     * Get workflow tags.
     */
    getWorkflowTags(workflowId: string): Promise<{
        workflow_id: string;
        tags: string[];
    }>;
    /**
     * Set workflow tags.
     */
    setWorkflowTags(workflowId: string, tags: string[]): Promise<SuccessResult>;
    /**
     * Search workflows by name, description, or tags.
     */
    searchWorkflows(query: string, tags?: string[], page?: number): Promise<PaginatedResult<Workflow>>;
    /**
     * Get public workflows from all users.
     */
    getPublicWorkflows(page?: number, sortBy?: string): Promise<PaginatedResult<PublicWorkflow>>;
    /**
     * Create a new empty workflow.
     */
    createWorkflow(name: string, description?: string): Promise<CreateWorkflowResult>;
    /**
     * Delete a workflow.
     */
    deleteWorkflow(workflowId: string): Promise<SuccessResult>;
    /**
     * Get the full graph (nodes and connections) of a workflow.
     */
    getWorkflowGraph(workflowId: string): Promise<WorkflowGraph>;
    /**
     * Validate a workflow for errors.
     */
    validateWorkflow(workflowId: string): Promise<ValidationResult>;
    /**
     * List all available node types.
     * Note: Response may be an array or object depending on the API version.
     */
    listAvailableNodes(): Promise<NodeTypesResponse>;
    /**
     * Get schema for a specific node type.
     */
    getNodeSchema(nodeType: string): Promise<NodeType>;
    /**
     * Add a node to a workflow.
     */
    addNode(workflowId: string, nodeType: string, position: {
        x: number;
        y: number;
    }, properties?: Record<string, unknown>): Promise<AddNodeResult>;
    /**
     * Update a node in a workflow.
     */
    updateNode(workflowId: string, nodeId: string, updates: {
        position?: {
            x: number;
            y: number;
        };
        properties?: Record<string, unknown>;
    }): Promise<WorkflowNode>;
    /**
     * Delete a node from a workflow.
     */
    deleteNode(workflowId: string, nodeId: string): Promise<SuccessResult>;
    /**
     * Add a connection between nodes.
     */
    addConnection(workflowId: string, sourceNodeId: string, sourceSocketId: string, targetNodeId: string, targetSocketId: string): Promise<AddConnectionResult>;
    /**
     * Delete a connection from a workflow.
     */
    deleteConnection(workflowId: string, connectionId: string): Promise<SuccessResult>;
    /**
     * Get all connections for a specific node.
     */
    getNodeConnections(workflowId: string, nodeId: string): Promise<WorkflowConnection[]>;
    /**
     * List user's own custom nodes.
     */
    listCustomNodes(options?: CustomNodeListFilters): Promise<PaginatedResult<CustomNode>>;
    /**
     * Search public custom nodes.
     */
    searchPublicCustomNodes(filters?: CustomNodeSearchFilters): Promise<PaginatedResult<CustomNode>>;
    /**
     * Get a specific custom node with full details including script_code.
     */
    getCustomNode(nodeId: string): Promise<CustomNode>;
    /**
     * Get comments for a custom node.
     */
    getCustomNodeComments(nodeId: string): Promise<CustomNodeComment[]>;
    /**
     * Create a new custom node.
     */
    createCustomNode(input: CreateCustomNodeInput): Promise<CreateWorkflowResult>;
    /**
     * Update a custom node.
     */
    updateCustomNode(nodeId: string, updates: UpdateCustomNodeInput): Promise<SuccessResult>;
    /**
     * Delete a custom node.
     */
    deleteCustomNode(nodeId: string): Promise<SuccessResult>;
    /**
     * Copy a public custom node to user's library.
     */
    copyCustomNode(nodeId: string, name?: string): Promise<CreateWorkflowResult>;
    /**
     * Toggle custom node visibility.
     */
    toggleCustomNodeVisibility(nodeId: string, visibility: 'private' | 'public' | 'unlisted'): Promise<SuccessResult>;
    /**
     * Vote on a custom node.
     */
    voteCustomNode(nodeId: string, vote: 'up' | 'down' | 'remove'): Promise<VoteCustomNodeResult>;
    /**
     * Toggle favorite on a custom node.
     */
    favoriteCustomNode(nodeId: string, favorite: boolean): Promise<FavoriteCustomNodeResult>;
    /**
     * Add a comment to a custom node.
     */
    addCustomNodeComment(nodeId: string, content: string, parentId?: number): Promise<CreateCustomNodeCommentResult>;
    /**
     * List user's own apps.
     */
    listApps(options?: AppListFilters): Promise<PaginatedResult<App>>;
    /**
     * Search public apps.
     */
    searchPublicApps(filters?: AppSearchFilters): Promise<PaginatedResult<App>>;
    /**
     * Get app categories.
     */
    getAppCategories(): Promise<string[]>;
    /**
     * Get popular app tags.
     */
    getAppTags(): Promise<string[]>;
    /**
     * Get a specific app with full details including code.
     */
    getApp(appId: string): Promise<App>;
    /**
     * Get comments for an app.
     */
    getAppComments(appId: string): Promise<AppComment[]>;
    /**
     * Create a new app.
     */
    createApp(input: CreateAppInput): Promise<CreateAppResult>;
    /**
     * Update an app.
     */
    updateApp(appId: string, updates: UpdateAppInput): Promise<SuccessResult>;
    /**
     * Delete an app.
     */
    deleteApp(appId: string): Promise<SuccessResult>;
    /**
     * Publish an app (make it public).
     */
    publishApp(appId: string): Promise<SuccessResult>;
    /**
     * Unpublish an app (make it private).
     */
    unpublishApp(appId: string): Promise<SuccessResult>;
    /**
     * Clone a public app to user's library.
     */
    cloneApp(appId: string, name?: string): Promise<CloneAppResult>;
    /**
     * Vote on an app.
     */
    voteApp(appId: string, vote: 'up' | 'down' | 'remove'): Promise<VoteAppResult>;
    /**
     * Toggle favorite on an app.
     */
    favoriteApp(appId: string, favorite: boolean): Promise<FavoriteAppResult>;
    /**
     * Add a comment to an app.
     */
    addAppComment(appId: string, content: string, parentId?: number): Promise<CreateAppCommentResult>;
    /**
     * Get workflows linked to an app.
     */
    getAppWorkflows(appId: string): Promise<AppWorkflow[]>;
    /**
     * Link a workflow to an app.
     */
    linkAppWorkflow(appId: string, workflowHash: string, alias?: string): Promise<LinkAppWorkflowResult>;
    /**
     * Unlink a workflow from an app.
     */
    unlinkAppWorkflow(appId: string, workflowHash: string): Promise<SuccessResult>;
    /**
     * Get the public URL for a workflow.
     */
    getWorkflowPublicUrl(workflowId: string): Promise<WorkflowPublicUrlResult>;
    /**
     * List shared results for a workflow.
     */
    listSharedResults(workflowId: string, options?: SharedResultListFilters): Promise<PaginatedResult<SharedResult>>;
    /**
     * Get a specific shared result.
     */
    getSharedResult(workflowId: string, resultHash: string): Promise<SharedResultDetails>;
    /**
     * Get comments for a shared result.
     */
    getSharedResultComments(workflowId: string, resultHash: string): Promise<SharedResultComment[]>;
    /**
     * Create a shared result from an execution.
     */
    createSharedResult(workflowId: string, input: CreateSharedResultInput): Promise<CreateSharedResultResult>;
    /**
     * Add a comment to a workflow.
     */
    addWorkflowComment(workflowId: string, content: string, parentId?: number): Promise<CreateCommentResult>;
    /**
     * Add a comment to a shared result.
     */
    addSharedResultComment(workflowId: string, resultHash: string, content: string, parentId?: number): Promise<CreateCommentResult>;
    /**
     * Vote on a workflow.
     */
    voteWorkflow(workflowId: string, vote: 'up' | 'down' | 'remove'): Promise<VoteWorkflowResult>;
    /**
     * Vote on a shared result.
     */
    voteSharedResult(workflowId: string, resultHash: string, vote: 'up' | 'down' | 'remove'): Promise<VoteSharedResultResult>;
    /**
     * List input presets for a workflow.
     */
    listInputPresets(workflowId: string, options?: InputPresetListFilters): Promise<InputPresetListResult>;
    /**
     * Get a specific input preset.
     */
    getInputPreset(workflowId: string, presetHash: string): Promise<InputPreset>;
    /**
     * Create a new input preset.
     */
    createInputPreset(workflowId: string, input: CreateInputPresetInput): Promise<CreateInputPresetResult>;
    /**
     * Update an input preset.
     */
    updateInputPreset(workflowId: string, presetHash: string, updates: UpdateInputPresetInput): Promise<InputPreset>;
    /**
     * Delete an input preset.
     */
    deleteInputPreset(workflowId: string, presetHash: string): Promise<SuccessResult>;
    /**
     * Vote on an input preset.
     */
    voteInputPreset(workflowId: string, presetHash: string, vote: 'up' | 'down' | 'remove'): Promise<VoteInputPresetResult>;
    /**
     * Toggle community inputs (input presets) for a workflow.
     */
    toggleCommunityInputs(workflowId: string, enabled: boolean): Promise<ToggleCommunityInputsResult>;
    /**
     * List knowledge base categories.
     */
    listKnowledgeCategories(): Promise<DocumentCategory[]>;
    /**
     * Get a specific knowledge base category.
     */
    getKnowledgeCategory(categoryId: number): Promise<DocumentCategory>;
    /**
     * Create a new knowledge base category.
     */
    createKnowledgeCategory(input: CreateKnowledgeCategoryInput): Promise<DocumentCategory>;
    /**
     * Update a knowledge base category.
     */
    updateKnowledgeCategory(categoryId: number, updates: UpdateKnowledgeCategoryInput): Promise<DocumentCategory>;
    /**
     * Delete a knowledge base category.
     */
    deleteKnowledgeCategory(categoryId: number): Promise<SuccessResult>;
    /**
     * List knowledge base documents.
     */
    listKnowledgeDocuments(filters?: KnowledgeDocumentListFilters): Promise<KnowledgeDocument[]>;
    /**
     * Get a specific knowledge base document.
     */
    getKnowledgeDocument(documentId: string | number): Promise<KnowledgeDocument>;
    /**
     * Upload text content as a document.
     */
    uploadTextDocument(input: UploadTextDocumentInput): Promise<UploadDocumentResult>;
    /**
     * Upload a document from a URL.
     */
    uploadDocumentFromUrl(input: UploadDocumentFromUrlInput): Promise<UploadDocumentResult>;
    /**
     * Move a document to a different category.
     */
    moveDocumentToCategory(documentId: number, categoryId: number | null): Promise<SuccessResult>;
    /**
     * Reprocess a failed or pending document.
     */
    reprocessDocument(documentId: number): Promise<SuccessResult>;
    /**
     * Delete a knowledge base document.
     */
    deleteKnowledgeDocument(documentId: number): Promise<SuccessResult>;
    /**
     * Query the knowledge base using RAG.
     */
    queryKnowledgeBase(input: KnowledgeQueryInput): Promise<KnowledgeQueryResponse>;
    /**
     * Get knowledge base storage usage.
     */
    getKnowledgeStorage(): Promise<KnowledgeStorage>;
}
//# sourceMappingURL=api-client.d.ts.map