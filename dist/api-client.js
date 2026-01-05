/**
 * FlowDot Hub API Client
 *
 * Handles communication with the FlowDot Hub API using MCP tokens.
 */
export class FlowDotApiClient {
    hubUrl;
    apiToken;
    constructor(hubUrl, apiToken) {
        // Remove trailing slash from hubUrl
        this.hubUrl = hubUrl.replace(/\/$/, '');
        this.apiToken = apiToken;
    }
    /**
     * Make an authenticated request to the FlowDot Hub API.
     */
    async request(endpoint, options = {}) {
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
        const data = (await response.json());
        if (!response.ok || !data.success) {
            const errorMessage = data.error || data.message || `API error: ${response.status}`;
            throw new Error(errorMessage);
        }
        return data.data;
    }
    /**
     * List workflows available to the user.
     */
    async listWorkflows(filter, favoritesOnly) {
        const params = new URLSearchParams();
        if (filter)
            params.set('filter', filter);
        if (favoritesOnly)
            params.set('favorites_only', 'true');
        const queryString = params.toString();
        const endpoint = `/workflows${queryString ? `?${queryString}` : ''}`;
        return this.request(endpoint);
    }
    /**
     * Get a specific workflow by ID.
     */
    async getWorkflow(workflowId) {
        return this.request(`/workflows/${workflowId}`);
    }
    /**
     * Execute a workflow.
     */
    async executeWorkflow(workflowId, inputs = {}, waitForCompletion = true, mode = 'flowdot') {
        return this.request(`/workflows/${workflowId}/execute`, {
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
    async getExecution(executionId) {
        return this.request(`/executions/${executionId}`);
    }
    /**
     * Chat with the FlowDot agent.
     */
    async agentChat(message, conversationId, mode) {
        return this.request('/agent/chat', {
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
    async testConnection() {
        try {
            await this.listWorkflows();
            return true;
        }
        catch {
            return false;
        }
    }
    // ============================================
    // Analytics & Feedback (analytics:read scope)
    // ============================================
    /**
     * Get workflow execution metrics.
     */
    async getWorkflowMetrics(workflowId, period) {
        const params = new URLSearchParams();
        if (period)
            params.set('period', period);
        const queryString = params.toString();
        return this.request(`/workflows/${workflowId}/metrics${queryString ? `?${queryString}` : ''}`);
    }
    /**
     * Get workflow comments.
     */
    async getWorkflowComments(workflowId) {
        return this.request(`/workflows/${workflowId}/comments`);
    }
    /**
     * Get execution history for a workflow.
     */
    async getExecutionHistory(workflowId, page, limit) {
        const params = new URLSearchParams();
        if (page)
            params.set('page', page.toString());
        if (limit)
            params.set('limit', limit.toString());
        const queryString = params.toString();
        return this.request(`/workflows/${workflowId}/executions${queryString ? `?${queryString}` : ''}`);
    }
    // ============================================
    // Workflow Management (workflows:manage scope)
    // ============================================
    /**
     * Get detailed workflow information including nodes, connections, signature.
     */
    async getWorkflowDetails(workflowId) {
        return this.request(`/workflows/${workflowId}/details`);
    }
    /**
     * Get the input schema for a workflow.
     */
    async getWorkflowInputsSchema(workflowId) {
        return this.request(`/workflows/${workflowId}/inputs-schema`);
    }
    /**
     * Duplicate a workflow.
     */
    async duplicateWorkflow(workflowId, name) {
        return this.request(`/workflows/${workflowId}/duplicate`, {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }
    /**
     * Toggle workflow public/private status.
     */
    async toggleWorkflowPublic(workflowId, isPublic) {
        return this.request(`/workflows/${workflowId}/toggle-public`, {
            method: 'POST',
            body: JSON.stringify({ is_public: isPublic }),
        });
    }
    /**
     * Favorite or unfavorite a workflow.
     */
    async favoriteWorkflow(workflowId, favorite) {
        return this.request(`/workflows/${workflowId}/favorite`, {
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
    async cancelExecution(executionId) {
        return this.request(`/executions/${executionId}/cancel`, {
            method: 'POST',
        });
    }
    /**
     * Retry a failed execution.
     */
    async retryExecution(executionId) {
        return this.request(`/executions/${executionId}/retry`, {
            method: 'POST',
        });
    }
    /**
     * Get SSE stream URL for execution (client handles actual streaming).
     */
    getExecutionStreamUrl(executionId) {
        return `${this.hubUrl}/api/mcp/v1/executions/${executionId}/stream`;
    }
    /**
     * Get auth token for SSE requests.
     */
    getAuthToken() {
        return this.apiToken;
    }
    // ============================================
    // Discovery & Organization (discovery:read scope)
    // ============================================
    /**
     * Get workflow tags.
     */
    async getWorkflowTags(workflowId) {
        return this.request(`/workflows/${workflowId}/tags`);
    }
    /**
     * Set workflow tags.
     */
    async setWorkflowTags(workflowId, tags) {
        return this.request(`/workflows/${workflowId}/tags`, {
            method: 'POST',
            body: JSON.stringify({ tags }),
        });
    }
    /**
     * Search workflows by name, description, or tags.
     */
    async searchWorkflows(query, tags, page) {
        const params = new URLSearchParams();
        params.set('q', query);
        if (tags && tags.length > 0)
            params.set('tags', tags.join(','));
        if (page)
            params.set('page', page.toString());
        return this.request(`/workflows/search?${params.toString()}`);
    }
    /**
     * Get public workflows from all users.
     */
    async getPublicWorkflows(page, sortBy) {
        const params = new URLSearchParams();
        if (page)
            params.set('page', page.toString());
        if (sortBy)
            params.set('sort_by', sortBy);
        const queryString = params.toString();
        return this.request(`/workflows/public${queryString ? `?${queryString}` : ''}`);
    }
    // ============================================
    // Workflow Building (workflows:build scope)
    // ============================================
    /**
     * Create a new empty workflow.
     */
    async createWorkflow(name, description) {
        return this.request('/workflows', {
            method: 'POST',
            body: JSON.stringify({ name, description }),
        });
    }
    /**
     * Delete a workflow.
     */
    async deleteWorkflow(workflowId) {
        return this.request(`/workflows/${workflowId}`, {
            method: 'DELETE',
        });
    }
    /**
     * Get the full graph (nodes and connections) of a workflow.
     */
    async getWorkflowGraph(workflowId) {
        return this.request(`/workflows/${workflowId}/graph`);
    }
    /**
     * Validate a workflow for errors.
     */
    async validateWorkflow(workflowId) {
        return this.request(`/workflows/${workflowId}/validate`, {
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
    async listAvailableNodes() {
        return this.request('/node-types');
    }
    /**
     * Get schema for a specific node type.
     */
    async getNodeSchema(nodeType) {
        return this.request(`/node-types/${encodeURIComponent(nodeType)}/schema`);
    }
    /**
     * Add a node to a workflow.
     */
    async addNode(workflowId, nodeType, position, properties) {
        return this.request(`/workflows/${workflowId}/nodes`, {
            method: 'POST',
            body: JSON.stringify({ type: nodeType, position, properties }),
        });
    }
    /**
     * Update a node in a workflow.
     */
    async updateNode(workflowId, nodeId, updates) {
        return this.request(`/workflows/${workflowId}/nodes/${nodeId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }
    /**
     * Delete a node from a workflow.
     */
    async deleteNode(workflowId, nodeId) {
        return this.request(`/workflows/${workflowId}/nodes/${nodeId}`, {
            method: 'DELETE',
        });
    }
    // ============================================
    // Connection Operations (connections:manage scope)
    // ============================================
    /**
     * Add a connection between nodes.
     */
    async addConnection(workflowId, sourceNodeId, sourceSocketId, targetNodeId, targetSocketId) {
        return this.request(`/workflows/${workflowId}/connections`, {
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
    async deleteConnection(workflowId, connectionId) {
        return this.request(`/workflows/${workflowId}/connections/${connectionId}`, {
            method: 'DELETE',
        });
    }
    /**
     * Get all connections for a specific node.
     */
    async getNodeConnections(workflowId, nodeId) {
        return this.request(`/workflows/${workflowId}/nodes/${nodeId}/connections`);
    }
    // ============================================
    // Custom Node Operations (custom_nodes:read / custom_nodes:manage)
    // ============================================
    /**
     * List user's own custom nodes.
     */
    async listCustomNodes(options) {
        const params = new URLSearchParams();
        if (options?.search)
            params.set('search', options.search);
        if (options?.category)
            params.set('category', options.category);
        if (options?.limit)
            params.set('limit', options.limit.toString());
        if (options?.page)
            params.set('page', options.page.toString());
        const queryString = params.toString();
        return this.request(`/custom-nodes${queryString ? `?${queryString}` : ''}`);
    }
    /**
     * Search public custom nodes.
     */
    async searchPublicCustomNodes(filters) {
        const params = new URLSearchParams();
        if (filters?.q)
            params.set('q', filters.q);
        if (filters?.category)
            params.set('category', filters.category);
        if (filters?.tags && filters.tags.length > 0)
            params.set('tags', JSON.stringify(filters.tags));
        if (filters?.verified_only)
            params.set('verified_only', 'true');
        if (filters?.sort)
            params.set('sort', filters.sort);
        if (filters?.limit)
            params.set('limit', filters.limit.toString());
        if (filters?.page)
            params.set('page', filters.page.toString());
        const queryString = params.toString();
        return this.request(`/custom-nodes/search${queryString ? `?${queryString}` : ''}`);
    }
    /**
     * Get a specific custom node with full details including script_code.
     */
    async getCustomNode(nodeId) {
        return this.request(`/custom-nodes/${nodeId}`);
    }
    /**
     * Get comments for a custom node.
     */
    async getCustomNodeComments(nodeId) {
        return this.request(`/custom-nodes/${nodeId}/comments`);
    }
    /**
     * Create a new custom node.
     */
    async createCustomNode(input) {
        return this.request('/custom-nodes', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * Update a custom node.
     */
    async updateCustomNode(nodeId, updates) {
        return this.request(`/custom-nodes/${nodeId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }
    /**
     * Delete a custom node.
     */
    async deleteCustomNode(nodeId) {
        return this.request(`/custom-nodes/${nodeId}`, {
            method: 'DELETE',
        });
    }
    /**
     * Copy a public custom node to user's library.
     */
    async copyCustomNode(nodeId, name) {
        return this.request(`/custom-nodes/${nodeId}/copy`, {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }
    /**
     * Toggle custom node visibility.
     */
    async toggleCustomNodeVisibility(nodeId, visibility) {
        return this.request(`/custom-nodes/${nodeId}/visibility`, {
            method: 'POST',
            body: JSON.stringify({ visibility }),
        });
    }
    /**
     * Vote on a custom node.
     */
    async voteCustomNode(nodeId, vote) {
        return this.request(`/custom-nodes/${nodeId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ vote }),
        });
    }
    /**
     * Toggle favorite on a custom node.
     */
    async favoriteCustomNode(nodeId, favorite) {
        return this.request(`/custom-nodes/${nodeId}/favorite`, {
            method: 'POST',
            body: JSON.stringify({ favorite }),
        });
    }
    /**
     * Add a comment to a custom node.
     */
    async addCustomNodeComment(nodeId, content, parentId) {
        return this.request(`/custom-nodes/${nodeId}/comments`, {
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
    async listApps(options) {
        const params = new URLSearchParams();
        if (options?.search)
            params.set('search', options.search);
        if (options?.category)
            params.set('category', options.category);
        if (options?.limit)
            params.set('limit', options.limit.toString());
        if (options?.page)
            params.set('page', options.page.toString());
        const queryString = params.toString();
        return this.request(`/apps${queryString ? `?${queryString}` : ''}`);
    }
    /**
     * Search public apps.
     */
    async searchPublicApps(filters) {
        const params = new URLSearchParams();
        if (filters?.q)
            params.set('q', filters.q);
        if (filters?.category)
            params.set('category', filters.category);
        if (filters?.tag)
            params.set('tag', filters.tag);
        if (filters?.mobile_compatible)
            params.set('mobile_compatible', 'true');
        if (filters?.sort)
            params.set('sort', filters.sort);
        if (filters?.limit)
            params.set('limit', filters.limit.toString());
        if (filters?.page)
            params.set('page', filters.page.toString());
        const queryString = params.toString();
        return this.request(`/apps/search${queryString ? `?${queryString}` : ''}`);
    }
    /**
     * Get app categories.
     */
    async getAppCategories() {
        return this.request('/apps/categories');
    }
    /**
     * Get popular app tags.
     */
    async getAppTags() {
        return this.request('/apps/tags');
    }
    /**
     * Get a specific app with full details including code.
     */
    async getApp(appId) {
        return this.request(`/apps/${appId}`);
    }
    /**
     * Get comments for an app.
     */
    async getAppComments(appId) {
        return this.request(`/apps/${appId}/comments`);
    }
    /**
     * Create a new app.
     */
    async createApp(input) {
        return this.request('/apps', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * Update an app.
     */
    async updateApp(appId, updates) {
        return this.request(`/apps/${appId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }
    /**
     * Delete an app.
     */
    async deleteApp(appId) {
        return this.request(`/apps/${appId}`, {
            method: 'DELETE',
        });
    }
    /**
     * Publish an app (make it public).
     */
    async publishApp(appId) {
        return this.request(`/apps/${appId}/publish`, {
            method: 'POST',
        });
    }
    /**
     * Unpublish an app (make it private).
     */
    async unpublishApp(appId) {
        return this.request(`/apps/${appId}/unpublish`, {
            method: 'POST',
        });
    }
    /**
     * Clone a public app to user's library.
     */
    async cloneApp(appId, name) {
        return this.request(`/apps/${appId}/clone`, {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }
    /**
     * Vote on an app.
     */
    async voteApp(appId, vote) {
        return this.request(`/apps/${appId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ vote }),
        });
    }
    /**
     * Toggle favorite on an app.
     */
    async favoriteApp(appId, favorite) {
        return this.request(`/apps/${appId}/favorite`, {
            method: 'POST',
            body: JSON.stringify({ favorite }),
        });
    }
    /**
     * Add a comment to an app.
     */
    async addAppComment(appId, content, parentId) {
        return this.request(`/apps/${appId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content, parent_id: parentId }),
        });
    }
    /**
     * Get workflows linked to an app.
     */
    async getAppWorkflows(appId) {
        return this.request(`/apps/${appId}/workflows`);
    }
    /**
     * Link a workflow to an app.
     */
    async linkAppWorkflow(appId, workflowHash, alias) {
        return this.request(`/apps/${appId}/workflows`, {
            method: 'POST',
            body: JSON.stringify({ workflow_hash: workflowHash, alias }),
        });
    }
    /**
     * Unlink a workflow from an app.
     */
    async unlinkAppWorkflow(appId, workflowHash) {
        return this.request(`/apps/${appId}/workflows/${workflowHash}`, {
            method: 'DELETE',
        });
    }
    // ============================================
    // Sharing & Public URLs (sharing:read / sharing:manage)
    // ============================================
    /**
     * Get the public URL for a workflow.
     */
    async getWorkflowPublicUrl(workflowId) {
        return this.request(`/workflows/${workflowId}/public-url`);
    }
    /**
     * List shared results for a workflow.
     */
    async listSharedResults(workflowId, options) {
        const params = new URLSearchParams();
        if (options?.sort)
            params.set('sort', options.sort);
        if (options?.limit)
            params.set('limit', options.limit.toString());
        if (options?.page)
            params.set('page', options.page.toString());
        const queryString = params.toString();
        return this.request(`/workflows/${workflowId}/shared-results${queryString ? `?${queryString}` : ''}`);
    }
    /**
     * Get a specific shared result.
     */
    async getSharedResult(workflowId, resultHash) {
        return this.request(`/workflows/${workflowId}/shared-results/${resultHash}`);
    }
    /**
     * Get comments for a shared result.
     */
    async getSharedResultComments(workflowId, resultHash) {
        return this.request(`/workflows/${workflowId}/shared-results/${resultHash}/comments`);
    }
    /**
     * Create a shared result from an execution.
     */
    async createSharedResult(workflowId, input) {
        return this.request(`/workflows/${workflowId}/shared-results`, {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * Add a comment to a workflow.
     */
    async addWorkflowComment(workflowId, content, parentId) {
        return this.request(`/workflows/${workflowId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content, parent_id: parentId }),
        });
    }
    /**
     * Add a comment to a shared result.
     */
    async addSharedResultComment(workflowId, resultHash, content, parentId) {
        return this.request(`/workflows/${workflowId}/shared-results/${resultHash}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content, parent_id: parentId }),
        });
    }
    /**
     * Vote on a workflow.
     */
    async voteWorkflow(workflowId, vote) {
        return this.request(`/workflows/${workflowId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ vote }),
        });
    }
    /**
     * Vote on a shared result.
     */
    async voteSharedResult(workflowId, resultHash, vote) {
        return this.request(`/workflows/${workflowId}/shared-results/${resultHash}/vote`, {
            method: 'POST',
            body: JSON.stringify({ vote }),
        });
    }
    // ============================================
    // Input Presets (presets:read / presets:manage)
    // ============================================
    /**
     * List input presets for a workflow.
     */
    async listInputPresets(workflowId, options) {
        const params = new URLSearchParams();
        if (options?.sort)
            params.set('sort', options.sort);
        if (options?.limit)
            params.set('limit', options.limit.toString());
        if (options?.page)
            params.set('page', options.page.toString());
        const queryString = params.toString();
        return this.request(`/workflows/${workflowId}/input-presets${queryString ? `?${queryString}` : ''}`);
    }
    /**
     * Get a specific input preset.
     */
    async getInputPreset(workflowId, presetHash) {
        return this.request(`/workflows/${workflowId}/input-presets/${presetHash}`);
    }
    /**
     * Create a new input preset.
     */
    async createInputPreset(workflowId, input) {
        return this.request(`/workflows/${workflowId}/input-presets`, {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * Update an input preset.
     */
    async updateInputPreset(workflowId, presetHash, updates) {
        return this.request(`/workflows/${workflowId}/input-presets/${presetHash}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }
    /**
     * Delete an input preset.
     */
    async deleteInputPreset(workflowId, presetHash) {
        return this.request(`/workflows/${workflowId}/input-presets/${presetHash}`, {
            method: 'DELETE',
        });
    }
    /**
     * Vote on an input preset.
     */
    async voteInputPreset(workflowId, presetHash, vote) {
        return this.request(`/workflows/${workflowId}/input-presets/${presetHash}/vote`, {
            method: 'POST',
            body: JSON.stringify({ vote }),
        });
    }
    /**
     * Toggle community inputs (input presets) for a workflow.
     */
    async toggleCommunityInputs(workflowId, enabled) {
        return this.request(`/workflows/${workflowId}/community-inputs`, {
            method: 'POST',
            body: JSON.stringify({ enabled }),
        });
    }
    // ============================================
    // Knowledge Base (knowledge:read / knowledge:manage)
    // ============================================
    /**
     * List knowledge base categories.
     */
    async listKnowledgeCategories() {
        return this.request('/knowledge/categories');
    }
    /**
     * Get a specific knowledge base category.
     */
    async getKnowledgeCategory(categoryId) {
        return this.request(`/knowledge/categories/${categoryId}`);
    }
    /**
     * Create a new knowledge base category.
     */
    async createKnowledgeCategory(input) {
        return this.request('/knowledge/categories', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * Update a knowledge base category.
     */
    async updateKnowledgeCategory(categoryId, updates) {
        return this.request(`/knowledge/categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }
    /**
     * Delete a knowledge base category.
     */
    async deleteKnowledgeCategory(categoryId) {
        return this.request(`/knowledge/categories/${categoryId}`, {
            method: 'DELETE',
        });
    }
    /**
     * List knowledge base documents.
     */
    async listKnowledgeDocuments(filters) {
        const params = new URLSearchParams();
        if (filters?.category_id)
            params.set('category_id', filters.category_id.toString());
        if (filters?.status)
            params.set('status', filters.status);
        const queryString = params.toString();
        const endpoint = `/knowledge/documents${queryString ? `?${queryString}` : ''}`;
        return this.request(endpoint);
    }
    /**
     * Get a specific knowledge base document.
     */
    async getKnowledgeDocument(documentId) {
        return this.request(`/knowledge/documents/${documentId}`);
    }
    /**
     * Upload text content as a document.
     */
    async uploadTextDocument(input) {
        return this.request('/knowledge/documents/upload-text', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * Upload a document from a URL.
     */
    async uploadDocumentFromUrl(input) {
        return this.request('/knowledge/documents/upload-from-url', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * Move a document to a different category.
     */
    async moveDocumentToCategory(documentId, categoryId) {
        return this.request(`/knowledge/documents/${documentId}/category`, {
            method: 'PUT',
            body: JSON.stringify({ category_id: categoryId }),
        });
    }
    /**
     * Reprocess a failed or pending document.
     */
    async reprocessDocument(documentId) {
        return this.request(`/knowledge/documents/${documentId}/reprocess`, {
            method: 'POST',
        });
    }
    /**
     * Delete a knowledge base document.
     */
    async deleteKnowledgeDocument(documentId) {
        return this.request(`/knowledge/documents/${documentId}`, {
            method: 'DELETE',
        });
    }
    /**
     * Query the knowledge base using RAG.
     */
    async queryKnowledgeBase(input) {
        return this.request('/knowledge/query', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * Get knowledge base storage usage.
     */
    async getKnowledgeStorage() {
        return this.request('/knowledge/storage');
    }
}
//# sourceMappingURL=api-client.js.map