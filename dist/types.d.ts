/**
 * FlowDot MCP Server Types
 */
export interface FlowDotConfig {
    apiToken: string;
    hubUrl: string;
}
export interface Workflow {
    id: string;
    name: string;
    description: string | null;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    input_schema?: InputSchema[] | null;
}
export interface InputSchema {
    name: string;
    type: string;
    description?: string | null;
    required?: boolean;
    default?: unknown;
}
export interface WorkflowInputSchemaResult {
    workflow_id: string;
    inputs: InputSchema[];
    settings: InputSchema[];
    usage_notes: string[];
}
export interface Execution {
    execution_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    started_at: string | null;
    completed_at: string | null;
    duration_ms: number | null;
    outputs: Record<string, unknown> | null;
    error: string | null;
}
export interface ExecuteWorkflowResult {
    execution_id: string | null;
    status: string;
    outputs?: Record<string, unknown>;
    message?: string;
}
export interface AgentChatResult {
    response: string;
    conversation_id: string | null;
    suggested_workflows: SuggestedWorkflow[];
}
export interface SuggestedWorkflow {
    id: string;
    name: string;
    description: string | null;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    count?: number;
}
export interface WorkflowMetrics {
    workflow_id: string;
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    success_rate: number;
    avg_duration_ms: number | null;
    executions_by_day: DailyMetric[];
    period: string;
}
export interface DailyMetric {
    date: string;
    count: number;
    success_count: number;
    failure_count: number;
}
export interface WorkflowComment {
    id: number;
    user_name: string;
    user_hash: string;
    content: string;
    vote_count: number;
    created_at: string;
    replies: WorkflowComment[];
}
export interface ExecutionHistoryItem {
    execution_id: string;
    status: string;
    description: string | null;
    started_at: string | null;
    completed_at: string | null;
    duration_ms: number | null;
    created_at: string;
}
export interface WorkflowDetails extends Workflow {
    nodes: Record<string, WorkflowNode>;
    connections: Record<string, WorkflowConnection>;
    signature: WorkflowSignature;
    tags: string[];
    is_favorited: boolean;
    favorite_count: number;
    vote_count: number;
    copy_count: number;
    visibility: string;
    is_disabled: boolean;
}
export interface WorkflowSignature {
    inputs: SignatureInput[];
    outputs: SignatureOutput[];
    settings: SignatureSetting[];
    usage_notes: string[];
}
export interface SignatureInput {
    name: string;
    dataType: string;
    nodeId: string;
    socketName: string;
}
export interface SignatureOutput {
    name: string;
    dataType: string;
    nodeId: string;
    nodeType: string;
    socketName: string;
}
export interface SignatureSetting {
    type: string;
    name: string;
    nodeId: string;
    currentValue: unknown;
    options: string[];
    description: string;
}
export interface WorkflowGraph {
    nodes: Record<string, WorkflowNode>;
    connections: Record<string, WorkflowConnection>;
}
export interface WorkflowNode {
    id: string;
    type: string;
    title: string;
    position: Position;
    width?: number;
    height?: number;
    inputs: NodeSocket[];
    outputs: NodeSocket[];
    properties: NodeProperty[];
    typeVersion?: string;
}
export interface Position {
    x: number;
    y: number;
}
export interface NodeSocket {
    name: string;
    dataType: string;
}
export interface NodeProperty {
    key: string;
    value: unknown;
    dataType: string;
}
export interface WorkflowConnection {
    id: string;
    sourceNodeId: string;
    sourceSocketId: string;
    targetNodeId: string;
    targetSocketId: string;
    isFeedback?: boolean;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationError {
    type: string;
    nodeId?: string;
    message: string;
}
export interface ValidationWarning {
    type: string;
    nodeId?: string;
    message: string;
}
export interface NodeType {
    type: string;
    title: string;
    category: string;
    description: string;
    use_case?: string;
    version: string;
    inputs: NodeSocket[];
    outputs: NodeSocket[];
    properties: NodeTypeProperty[];
    experimental?: boolean;
    pinned?: boolean;
}
export interface NodeTypeProperty {
    key: string;
    value: unknown;
    dataType: string;
    description?: string;
    options?: unknown[];
}
export type NodeTypesResponse = NodeType[] | {
    [nodeTypeName: string]: NodeType;
};
export interface NodeTypesByCategory {
    [nodeTypeName: string]: NodeType;
}
export interface PublicWorkflow {
    id: string;
    name: string;
    description: string | null;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    user_name: string;
    user_hash: string;
    vote_count: number;
    favorite_count: number;
    copy_count: number;
    tags: string[];
}
export interface PaginatedResult<T> {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}
export interface SearchFilters {
    tags?: string[];
    is_public?: boolean;
    created_after?: string;
    created_before?: string;
}
export interface ExecutionStreamEvent {
    event: 'node_started' | 'node_completed' | 'node_error' | 'execution_completed' | 'execution_failed';
    data: {
        node_id?: string;
        node_title?: string;
        status?: string;
        output?: unknown;
        error?: string;
        timestamp: string;
    };
}
export interface RetryExecutionResult extends ExecuteWorkflowResult {
    original_execution_id: string;
}
export interface SuccessResult {
    success: boolean;
    message?: string;
}
export interface CreateWorkflowResult {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
}
export interface AddNodeResult {
    node_id: string;
    node: WorkflowNode;
}
export interface AddConnectionResult {
    connection_id: string;
    connection: WorkflowConnection;
}
export interface CustomNode {
    id: string;
    name: string;
    title: string;
    description: string;
    category: string;
    version: string;
    icon: string | null;
    inputs?: CustomNodeSocket[];
    outputs?: CustomNodeSocket[];
    properties?: CustomNodeProperty[];
    script_code?: string;
    llm_config?: CustomNodeLLMConfig | null;
    execution_timeout?: number;
    memory_limit?: number;
    visibility: 'private' | 'public' | 'unlisted' | 'team';
    is_verified: boolean;
    is_disabled?: boolean;
    user_name?: string;
    user_hash?: string;
    team_name?: string | null;
    vote_count?: number;
    favorite_count?: number;
    execution_count: number;
    copy_count: number;
    tags: string[];
    ancestry?: CustomNodeAncestry | null;
    is_favorited?: boolean;
    user_vote?: number | null;
    can_edit?: boolean;
    created_at: string;
    updated_at: string;
}
export interface CustomNodeSocket {
    name: string;
    dataType: string;
    description?: string;
}
export interface CustomNodeProperty {
    key: string;
    value: unknown;
    dataType: string;
    description?: string;
}
export interface CustomNodeAncestry {
    copied_from_node_hash: string | null;
    copied_from_node_name: string | null;
    copied_from_user_name: string | null;
    copied_from_user_hash: string | null;
    chain: AncestryChainItem[];
}
export interface AncestryChainItem {
    node_hash: string;
    node_name: string;
    user_id: number;
    user_name: string | null;
    user_hash: string | null;
    copied_at: string;
    is_current: boolean;
}
export interface CustomNodeComment {
    id: number;
    user_name: string;
    user_hash: string | null;
    content: string;
    vote_count: number;
    created_at: string;
    replies: CustomNodeComment[];
}
export interface CustomNodeLLMConfig {
    enabled: boolean;
}
export interface CreateCustomNodeInput {
    name: string;
    title: string;
    description: string;
    category?: string;
    version?: string;
    icon?: string;
    inputs: CustomNodeSocket[];
    outputs: CustomNodeSocket[];
    properties?: CustomNodeProperty[];
    script_code: string;
    execution_timeout?: number;
    memory_limit?: number;
    visibility?: 'private' | 'public' | 'unlisted';
    tags?: string[];
    llm_config?: CustomNodeLLMConfig;
}
export interface UpdateCustomNodeInput {
    name?: string;
    title?: string;
    description?: string;
    category?: string;
    version?: string;
    icon?: string;
    inputs?: CustomNodeSocket[];
    outputs?: CustomNodeSocket[];
    properties?: CustomNodeProperty[];
    script_code?: string;
    execution_timeout?: number;
    memory_limit?: number;
    tags?: string[];
    llm_config?: CustomNodeLLMConfig | null;
}
export interface CustomNodeSearchFilters {
    q?: string;
    category?: string;
    tags?: string[];
    verified_only?: boolean;
    sort?: 'updated_at' | 'created_at' | 'execution_count' | 'copy_count';
    limit?: number;
    page?: number;
}
export interface CustomNodeListFilters {
    search?: string;
    category?: string;
    limit?: number;
    page?: number;
}
export interface VoteCustomNodeResult {
    id: string;
    vote: string;
    vote_count: number;
}
export interface FavoriteCustomNodeResult {
    id: string;
    is_favorited: boolean;
}
export interface CreateCustomNodeCommentResult {
    id: number;
    content: string;
    user_name: string;
    created_at: string;
}
export interface App {
    id: string;
    name: string;
    description: string | null;
    code: string | null;
    mobile_code: string | null;
    config: Record<string, unknown> | null;
    category: string | null;
    tags: string[];
    is_public: boolean;
    mobile_compatible: boolean;
    user_name?: string;
    user_hash?: string | null;
    upvotes: number;
    downvotes: number;
    vote_score?: number;
    execution_count: number;
    clone_count: number;
    view_count?: number;
    is_verified: boolean;
    is_featured: boolean;
    workflows?: AppWorkflow[];
    is_favorited?: boolean;
    user_vote?: number | null;
    can_edit?: boolean;
    created_at: string;
    updated_at: string;
    published_at: string | null;
}
export interface AppWorkflow {
    hash: string;
    name: string;
    description: string | null;
    signature: WorkflowSignature | null;
    alias: string | null;
}
export interface AppComment {
    id: number;
    user_name: string;
    user_hash: string | null;
    content: string;
    vote_count: number;
    created_at: string;
    replies: AppComment[];
}
export interface CreateAppInput {
    name: string;
    description?: string;
    code?: string;
    mobile_code?: string;
    config?: Record<string, unknown>;
    category?: string;
    tags?: string[];
    mobile_compatible?: boolean;
}
export interface UpdateAppInput {
    name?: string;
    description?: string;
    code?: string;
    mobile_code?: string;
    config?: Record<string, unknown>;
    category?: string;
    tags?: string[];
    mobile_compatible?: boolean;
}
export interface AppSearchFilters {
    q?: string;
    category?: string;
    tag?: string;
    mobile_compatible?: boolean;
    sort?: 'trending' | 'popular' | 'recent' | 'most_used';
    limit?: number;
    page?: number;
}
export interface AppListFilters {
    search?: string;
    category?: string;
    limit?: number;
    page?: number;
}
export interface CreateAppResult {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
}
export interface CloneAppResult {
    id: string;
    name: string;
    original_app_id: string;
    created_at: string;
}
export interface VoteAppResult {
    id: string;
    upvotes: number;
    downvotes: number;
    vote_score: number;
}
export interface FavoriteAppResult {
    id: string;
    is_favorited: boolean;
}
export interface CreateAppCommentResult {
    id: number;
    content: string;
    user_name: string;
    created_at: string;
}
export interface LinkAppWorkflowResult {
    hash: string;
    name: string;
    description: string | null;
    signature: WorkflowSignature | null;
    alias: string | null;
}
export interface WorkflowPublicUrlResult {
    workflow_id: string;
    workflow_name: string;
    is_public: boolean;
    public_url: string;
    accessible: boolean;
    message: string;
}
export interface SharedResult {
    hash: string;
    title: string | null;
    description: string | null;
    preset_hash: string | null;
    view_count: number;
    vote_count: number;
    is_active: boolean;
    share_url: string;
    expires_at: string | null;
    created_at: string;
    user?: {
        hash: string;
        name: string;
        avatar?: string;
    } | null;
    workflow?: {
        hash: string;
        name: string;
        description: string | null;
    };
}
export interface SharedResultDetails extends SharedResult {
    shared_node_results: Record<string, unknown>;
    shared_inputs: Record<string, unknown>;
}
export interface SharedResultComment {
    id: number;
    user_name: string;
    user_hash: string | null;
    content: string;
    vote_count: number;
    created_at: string;
    replies: SharedResultComment[];
}
export interface CreateSharedResultInput {
    execution_id: string;
    title?: string;
    description?: string;
    preset_hash?: string;
    expires_in_days?: number;
}
export interface CreateSharedResultResult {
    hash: string;
    title: string | null;
    description: string | null;
    preset_hash: string | null;
    view_count: number;
    is_active: boolean;
    share_url: string;
    expires_at: string | null;
    created_at: string;
}
export interface CreateCommentResult {
    id: number;
    content: string;
    user_name: string;
    user_hash: string;
    created_at: string;
}
export interface SharedResultListFilters {
    sort?: 'newest' | 'oldest' | 'most_viewed';
    limit?: number;
    page?: number;
}
export interface VoteWorkflowResult {
    id: string;
    vote: string;
    vote_count: number;
}
export interface VoteSharedResultResult {
    hash: string;
    vote: string;
    vote_count: number;
}
export interface InputPreset {
    hash: string;
    title: string;
    description: string | null;
    inputs: Record<string, unknown>;
    vote_count: number;
    usage_count: number;
    public_url: string;
    can_edit?: boolean;
    created_at: string;
    updated_at: string;
    user?: {
        hash: string;
        name: string;
    } | null;
    workflow?: {
        hash: string;
        name: string;
    };
}
export interface InputPresetListResult {
    data: InputPreset[];
    community_inputs_enabled: boolean;
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
    message?: string;
}
export interface CreateInputPresetInput {
    title: string;
    description?: string;
    inputs: Record<string, unknown>;
}
export interface UpdateInputPresetInput {
    title?: string;
    description?: string;
    inputs?: Record<string, unknown>;
}
export interface CreateInputPresetResult {
    hash: string;
    title: string;
    description: string | null;
    inputs: Record<string, unknown>;
    vote_count: number;
    usage_count: number;
    public_url: string;
    created_at: string;
}
export interface VoteInputPresetResult {
    hash: string;
    vote: string;
    vote_count: number;
}
export interface InputPresetListFilters {
    sort?: 'popular' | 'newest' | 'oldest' | 'most_used';
    limit?: number;
    page?: number;
}
export interface ToggleCommunityInputsResult {
    workflow_id: string;
    workflow_name: string;
    community_inputs_enabled: boolean;
    message: string;
}
export interface Team {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    role: 'owner' | 'admin' | 'manager' | 'editor' | 'viewer';
    member_count: number;
    created_at: string;
}
export interface DocumentCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    color: string;
    document_count: number;
    team_id: number | null;
    team_name: string | null;
    created_at: string;
    updated_at: string;
}
export interface KnowledgeDocument {
    id: number;
    hash: string;
    title: string;
    original_filename: string;
    mime_type: string;
    file_size_bytes: number;
    formatted_size: string;
    status: 'pending' | 'processing' | 'ready' | 'failed';
    processing_error: string | null;
    chunk_count: number;
    token_count: number;
    has_embeddings: boolean;
    metadata: Record<string, unknown> | null;
    category: {
        id: number;
        name: string;
        color: string;
    } | null;
    team_id: number | null;
    team: {
        id: number;
        name: string;
        slug: string;
    } | null;
    is_team_document: boolean;
    can_edit: boolean;
    can_delete: boolean;
    processed_at: string | null;
    created_at: string;
}
export interface KnowledgeQueryResult {
    chunk_id: number;
    content: string;
    token_count: number;
    chunk_index: number;
    relevance: number | null;
    similarity: number | null;
    document_id: number;
    document_title: string;
    document_hash: string | null;
    is_team_document: boolean;
    team_id: number | null;
    metadata: Record<string, unknown> | null;
}
export interface KnowledgeQueryResponse {
    query: string;
    result_count: number;
    results: KnowledgeQueryResult[];
}
export interface KnowledgeStorage {
    knowledge_storage_bytes: number;
    knowledge_storage_mb: number;
    total_storage_bytes: number;
    total_storage_mb: number;
    storage_limit_bytes: number;
    storage_limit_mb: number;
    usage_percentage: number;
    document_count: number;
    ready_document_count: number;
    category_count: number;
}
export interface CreateKnowledgeCategoryInput {
    name: string;
    description?: string;
    color?: string;
    team_id?: number;
}
export interface UpdateKnowledgeCategoryInput {
    name?: string;
    description?: string;
    color?: string;
}
export interface UploadTextDocumentInput {
    title: string;
    content: string;
    category_id?: number;
    team_id?: number;
    mime_type?: 'text/plain' | 'text/markdown' | 'application/json';
}
export interface UploadDocumentFromUrlInput {
    url: string;
    title?: string;
    category_id?: number;
    team_id?: number;
}
export interface UploadDocumentResult {
    id: number;
    hash: string;
    title: string;
    original_filename?: string;
    file_size_bytes?: number;
    status: string;
    message: string;
}
export interface KnowledgeDocumentListFilters {
    category_id?: number;
    team_id?: number | 'personal';
    status?: 'pending' | 'processing' | 'ready' | 'failed';
}
export interface KnowledgeQueryInput {
    query: string;
    category_id?: number;
    team_id?: number;
    include_personal?: boolean;
    include_team?: boolean;
    top_k?: number;
}
export interface KnowledgeCategoryListFilters {
    team_id?: number;
    personal?: boolean;
}
export interface TransferDocumentInput {
    team_id?: number | null;
    category_id?: number | null;
}
export interface TransferDocumentResult {
    message: string;
    document: {
        id: number;
        hash: string;
        title: string;
        team_id: number | null;
        team_name: string | null;
        category_id: number | null;
    };
}
//# sourceMappingURL=types.d.ts.map