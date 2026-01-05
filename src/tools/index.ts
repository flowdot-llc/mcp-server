/**
 * MCP Tools Registry
 *
 * Registers all available MCP tools with the server.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

// ============================================
// Core Tools (Existing)
// ============================================
import { listWorkflowsTool, handleListWorkflows } from './list-workflows.js';
import { executeWorkflowTool, handleExecuteWorkflow } from './execute-workflow.js';
import { getExecutionTool, handleGetExecution } from './get-execution.js';
import { agentChatTool, handleAgentChat } from './agent-chat.js';

// ============================================
// Analytics & Feedback Tools (analytics:read)
// ============================================
import { getWorkflowMetricsTool, handleGetWorkflowMetrics } from './get-workflow-metrics.js';
import { getWorkflowCommentsTool, handleGetWorkflowComments } from './get-workflow-comments.js';
import { getExecutionHistoryTool, handleGetExecutionHistory } from './get-execution-history.js';

// ============================================
// Workflow Management Tools (workflows:manage)
// ============================================
import { getWorkflowDetailsTool, handleGetWorkflowDetails } from './get-workflow-details.js';
import { getWorkflowInputsSchemaTool, handleGetWorkflowInputsSchema } from './get-workflow-inputs-schema.js';
import { duplicateWorkflowTool, handleDuplicateWorkflow } from './duplicate-workflow.js';
import { toggleWorkflowPublicTool, handleToggleWorkflowPublic } from './toggle-workflow-public.js';
import { favoriteWorkflowTool, handleFavoriteWorkflow } from './favorite-workflow.js';

// ============================================
// Execution Enhancements Tools (executions:manage)
// ============================================
import { cancelExecutionTool, handleCancelExecution } from './cancel-execution.js';
import { retryExecutionTool, handleRetryExecution } from './retry-execution.js';
import { streamExecutionTool, handleStreamExecution } from './stream-execution.js';

// ============================================
// Discovery & Organization Tools (discovery:read)
// ============================================
import { getWorkflowTagsTool, handleGetWorkflowTags } from './get-workflow-tags.js';
import { setWorkflowTagsTool, handleSetWorkflowTags } from './set-workflow-tags.js';
import { searchWorkflowsTool, handleSearchWorkflows } from './search-workflows.js';
import { getPublicWorkflowsTool, handleGetPublicWorkflows } from './get-public-workflows.js';
import { searchTool, handleSearch } from './search.js';

// ============================================
// Workflow Building Tools (workflows:build)
// ============================================
import { createWorkflowTool, handleCreateWorkflow } from './create-workflow.js';
import { deleteWorkflowTool, handleDeleteWorkflow } from './delete-workflow.js';
import { getWorkflowGraphTool, handleGetWorkflowGraph } from './get-workflow-graph.js';
import { validateWorkflowTool, handleValidateWorkflow } from './validate-workflow.js';

// ============================================
// Node Operations Tools (nodes:manage)
// ============================================
import { listAvailableNodesTool, handleListAvailableNodes } from './list-available-nodes.js';
import { getNodeSchemaTool, handleGetNodeSchema } from './get-node-schema.js';
import { addNodeTool, handleAddNode } from './add-node.js';
import { updateNodeTool, handleUpdateNode } from './update-node.js';
import { deleteNodeTool, handleDeleteNode } from './delete-node.js';

// ============================================
// Connection Operations Tools (connections:manage)
// ============================================
import { addConnectionTool, handleAddConnection } from './add-connection.js';
import { deleteConnectionTool, handleDeleteConnection } from './delete-connection.js';
import { getNodeConnectionsTool, handleGetNodeConnections } from './get-node-connections.js';

// ============================================
// Custom Node Operations Tools (custom_nodes:read / custom_nodes:manage)
// ============================================
import { listCustomNodesTool, handleListCustomNodes } from './list-custom-nodes.js';
import { searchPublicCustomNodesTool, handleSearchPublicCustomNodes } from './search-public-custom-nodes.js';
import { getCustomNodeTool, handleGetCustomNode } from './get-custom-node.js';
import { getCustomNodeCommentsTool, handleGetCustomNodeComments } from './get-custom-node-comments.js';
import { getCustomNodeTemplateTool, handleGetCustomNodeTemplate } from './get-custom-node-template.js';
import { createCustomNodeTool, handleCreateCustomNode } from './create-custom-node.js';
import { updateCustomNodeTool, handleUpdateCustomNode } from './update-custom-node.js';
import { deleteCustomNodeTool, handleDeleteCustomNode } from './delete-custom-node.js';
import { copyCustomNodeTool, handleCopyCustomNode } from './copy-custom-node.js';
import { toggleCustomNodeVisibilityTool, handleToggleCustomNodeVisibility } from './toggle-custom-node-visibility.js';
import { voteCustomNodeTool, handleVoteCustomNode } from './vote-custom-node.js';
import { favoriteCustomNodeTool, handleFavoriteCustomNode } from './favorite-custom-node.js';
import { addCustomNodeCommentTool, handleAddCustomNodeComment } from './add-custom-node-comment.js';

// ============================================
// App Operations Tools (apps:read / apps:manage)
// ============================================
import { listAppsTool, handleListApps } from './list-apps.js';
import { searchAppsTool, handleSearchApps } from './search-apps.js';
import { getAppTool, handleGetApp } from './get-app.js';
import { createAppTool, handleCreateApp } from './create-app.js';
import { updateAppTool, handleUpdateApp } from './update-app.js';
import { deleteAppTool, handleDeleteApp } from './delete-app.js';
import { publishAppTool, handlePublishApp } from './publish-app.js';
import { unpublishAppTool, handleUnpublishApp } from './unpublish-app.js';
import { cloneAppTool, handleCloneApp } from './clone-app.js';
import { linkAppWorkflowTool, handleLinkAppWorkflow } from './link-app-workflow.js';
import { unlinkAppWorkflowTool, handleUnlinkAppWorkflow } from './unlink-app-workflow.js';
import { getAppTemplateTool, handleGetAppTemplate } from './get-app-template.js';

// ============================================
// Sharing & Public URLs Tools (sharing:read / sharing:manage)
// ============================================
import { getWorkflowPublicUrlTool, handleGetWorkflowPublicUrl } from './get-workflow-public-url.js';
import { listSharedResultsTool, handleListSharedResults } from './list-shared-results.js';
import { getSharedResultTool, handleGetSharedResult } from './get-shared-result.js';
import { getSharedResultCommentsTool, handleGetSharedResultComments } from './get-shared-result-comments.js';
import { createSharedResultTool, handleCreateSharedResult } from './create-shared-result.js';
import { addWorkflowCommentTool, handleAddWorkflowComment } from './add-workflow-comment.js';
import { addSharedResultCommentTool, handleAddSharedResultComment } from './add-shared-result-comment.js';
import { voteWorkflowTool, handleVoteWorkflow } from './vote-workflow.js';
import { voteSharedResultTool, handleVoteSharedResult } from './vote-shared-result.js';

// ============================================
// Input Preset Tools (presets:read / presets:manage)
// ============================================
import { listInputPresetsTool, handleListInputPresets } from './list-input-presets.js';
import { getInputPresetTool, handleGetInputPreset } from './get-input-preset.js';
import { createInputPresetTool, handleCreateInputPreset } from './create-input-preset.js';
import { updateInputPresetTool, handleUpdateInputPreset } from './update-input-preset.js';
import { deleteInputPresetTool, handleDeleteInputPreset } from './delete-input-preset.js';
import { voteInputPresetTool, handleVoteInputPreset } from './vote-input-preset.js';
import { toggleCommunityInputsTool, handleToggleCommunityInputs } from './toggle-community-inputs.js';

// All available tools
const tools = [
  // Core (4)
  listWorkflowsTool,
  executeWorkflowTool,
  getExecutionTool,
  agentChatTool,
  // Analytics & Feedback (3)
  getWorkflowMetricsTool,
  getWorkflowCommentsTool,
  getExecutionHistoryTool,
  // Workflow Management (5)
  getWorkflowDetailsTool,
  getWorkflowInputsSchemaTool,
  duplicateWorkflowTool,
  toggleWorkflowPublicTool,
  favoriteWorkflowTool,
  // Execution Enhancements (3)
  cancelExecutionTool,
  retryExecutionTool,
  streamExecutionTool,
  // Discovery & Organization (4)
  getWorkflowTagsTool,
  setWorkflowTagsTool,
  searchWorkflowsTool,
  searchTool,
  getPublicWorkflowsTool,
  // Workflow Building (4)
  createWorkflowTool,
  deleteWorkflowTool,
  getWorkflowGraphTool,
  validateWorkflowTool,
  // Node Operations (5)
  listAvailableNodesTool,
  getNodeSchemaTool,
  addNodeTool,
  updateNodeTool,
  deleteNodeTool,
  // Connection Operations (3)
  addConnectionTool,
  deleteConnectionTool,
  getNodeConnectionsTool,
  // Custom Node Operations (13)
  listCustomNodesTool,
  searchPublicCustomNodesTool,
  getCustomNodeTool,
  getCustomNodeCommentsTool,
  getCustomNodeTemplateTool,
  createCustomNodeTool,
  updateCustomNodeTool,
  deleteCustomNodeTool,
  copyCustomNodeTool,
  toggleCustomNodeVisibilityTool,
  voteCustomNodeTool,
  favoriteCustomNodeTool,
  addCustomNodeCommentTool,
  // App Operations (12)
  listAppsTool,
  searchAppsTool,
  getAppTool,
  createAppTool,
  updateAppTool,
  deleteAppTool,
  publishAppTool,
  unpublishAppTool,
  cloneAppTool,
  linkAppWorkflowTool,
  unlinkAppWorkflowTool,
  getAppTemplateTool,
  // Sharing & Public URLs (9)
  getWorkflowPublicUrlTool,
  listSharedResultsTool,
  getSharedResultTool,
  getSharedResultCommentsTool,
  createSharedResultTool,
  addWorkflowCommentTool,
  addSharedResultCommentTool,
  voteWorkflowTool,
  voteSharedResultTool,
  // Input Presets (7)
  listInputPresetsTool,
  getInputPresetTool,
  createInputPresetTool,
  updateInputPresetTool,
  deleteInputPresetTool,
  voteInputPresetTool,
  toggleCommunityInputsTool,
];

/**
 * Register all tools with the MCP server.
 */
export function registerTools(server: Server, api: FlowDotApiClient): void {
  // Handle tools/list request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Handle tools/call request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      // ============================================
      // Core Tools
      // ============================================
      case 'list_workflows':
        return handleListWorkflows(api, args as { filter?: string; favorites_only?: boolean });

      case 'execute_workflow':
        return handleExecuteWorkflow(api, args as {
          workflow_id: string;
          inputs?: Record<string, unknown>;
          wait_for_completion?: boolean;
          mode?: string;
        });

      case 'get_execution_status':
        return handleGetExecution(api, args as { execution_id: string });

      case 'agent_chat':
        return handleAgentChat(api, args as { message: string; conversation_id?: string });

      // ============================================
      // Analytics & Feedback Tools
      // ============================================
      case 'get_workflow_metrics':
        return handleGetWorkflowMetrics(api, args as { workflow_id: string; period?: string });

      case 'get_workflow_comments':
        return handleGetWorkflowComments(api, args as { workflow_id: string });

      case 'get_execution_history':
        return handleGetExecutionHistory(api, args as { workflow_id: string; page?: number; limit?: number });

      // ============================================
      // Workflow Management Tools
      // ============================================
      case 'get_workflow_details':
        return handleGetWorkflowDetails(api, args as { workflow_id: string });

      case 'get_workflow_inputs_schema':
        return handleGetWorkflowInputsSchema(api, args as { workflow_id: string });

      case 'duplicate_workflow':
        return handleDuplicateWorkflow(api, args as { workflow_id: string; name?: string });

      case 'toggle_workflow_public':
        return handleToggleWorkflowPublic(api, args as { workflow_id: string; is_public: boolean });

      case 'favorite_workflow':
        return handleFavoriteWorkflow(api, args as { workflow_id: string; favorite: boolean });

      // ============================================
      // Execution Enhancements Tools
      // ============================================
      case 'cancel_execution':
        return handleCancelExecution(api, args as { execution_id: string });

      case 'retry_execution':
        return handleRetryExecution(api, args as { execution_id: string });

      case 'stream_execution':
        return handleStreamExecution(api, args as { execution_id: string });

      // ============================================
      // Discovery & Organization Tools
      // ============================================
      case 'get_workflow_tags':
        return handleGetWorkflowTags(api, args as { workflow_id: string });

      case 'set_workflow_tags':
        return handleSetWorkflowTags(api, args as { workflow_id: string; tags: string[] });

      case 'search_workflows':
        return handleSearchWorkflows(api, args as { query: string; tags?: string[]; page?: number });
      
      case 'search':
        return handleSearch(api, args as { query: string; type?: 'workflow' | 'app' | 'custom_node'; page?: number });

      case 'get_public_workflows':
        return handleGetPublicWorkflows(api, args as { page?: number; sort_by?: string });

      // ============================================
      // Workflow Building Tools
      // ============================================
      case 'create_workflow':
        return handleCreateWorkflow(api, args as { name: string; description?: string });

      case 'delete_workflow':
        return handleDeleteWorkflow(api, args as { workflow_id: string });

      case 'get_workflow_graph':
        return handleGetWorkflowGraph(api, args as { workflow_id: string });

      case 'validate_workflow':
        return handleValidateWorkflow(api, args as { workflow_id: string });

      // ============================================
      // Node Operations Tools
      // ============================================
      case 'list_available_nodes':
        return handleListAvailableNodes(api, args as Record<string, never>);

      case 'get_node_schema':
        return handleGetNodeSchema(api, args as { node_type: string });

      case 'add_node':
        return handleAddNode(api, args as {
          workflow_id: string;
          node_type: string;
          position: { x: number; y: number };
          properties?: Record<string, unknown>;
        });

      case 'update_node':
        return handleUpdateNode(api, args as {
          workflow_id: string;
          node_id: string;
          position?: { x: number; y: number };
          properties?: Record<string, unknown>;
        });

      case 'delete_node':
        return handleDeleteNode(api, args as { workflow_id: string; node_id: string });

      // ============================================
      // Connection Operations Tools
      // ============================================
      case 'add_connection':
        return handleAddConnection(api, args as {
          workflow_id: string;
          source_node_id: string;
          source_socket_id: string;
          target_node_id: string;
          target_socket_id: string;
        });

      case 'delete_connection':
        return handleDeleteConnection(api, args as { workflow_id: string; connection_id: string });

      case 'get_node_connections':
        return handleGetNodeConnections(api, args as { workflow_id: string; node_id: string });

      // ============================================
      // Custom Node Operations Tools
      // ============================================
      case 'list_custom_nodes':
        return handleListCustomNodes(api, args as { search?: string; category?: string; limit?: number; page?: number });

      case 'search_public_custom_nodes':
        return handleSearchPublicCustomNodes(api, args as {
          query?: string;
          category?: string;
          tags?: string[];
          verified_only?: boolean;
          sort?: string;
          limit?: number;
          page?: number;
        });

      case 'get_custom_node':
        return handleGetCustomNode(api, args as { node_id: string });

      case 'get_custom_node_comments':
        return handleGetCustomNodeComments(api, args as { node_id: string });

      case 'get_custom_node_template':
        return handleGetCustomNodeTemplate(args as {
          inputs: Array<{ name: string; dataType: 'text' | 'number' | 'boolean' | 'json' | 'array' | 'any'; description?: string }>;
          outputs: Array<{ name: string; dataType: 'text' | 'number' | 'boolean' | 'json' | 'array' | 'any'; description?: string }>;
          properties?: Array<{ key: string; dataType: string; description?: string }>;
        });

      case 'create_custom_node':
        return handleCreateCustomNode(api, args as any);

      case 'update_custom_node':
        return handleUpdateCustomNode(api, args as any);

      case 'delete_custom_node':
        return handleDeleteCustomNode(api, args as { node_id: string });

      case 'copy_custom_node':
        return handleCopyCustomNode(api, args as { node_id: string; name?: string });

      case 'toggle_custom_node_visibility':
        return handleToggleCustomNodeVisibility(api, args as { node_id: string; visibility?: 'private' | 'public' | 'unlisted' });

      case 'vote_custom_node':
        return handleVoteCustomNode(api, args as { node_id: string; vote: 'up' | 'down' | 'remove' });

      case 'favorite_custom_node':
        return handleFavoriteCustomNode(api, args as { node_id: string; favorite?: boolean });

      case 'add_custom_node_comment':
        return handleAddCustomNodeComment(api, args as { node_id: string; content: string; parent_id?: number });

      // ============================================
      // App Operations Tools
      // ============================================
      case 'list_apps':
        return handleListApps(api, args as { search?: string; category?: string; limit?: number; page?: number });

      case 'search_apps':
        return handleSearchApps(api, args as {
          query?: string;
          category?: string;
          tag?: string;
          mobile_compatible?: boolean;
          sort?: string;
          limit?: number;
          page?: number;
        });

      case 'get_app':
        return handleGetApp(api, args as { app_id: string });

      case 'create_app':
        return handleCreateApp(api, args as any);

      case 'update_app':
        return handleUpdateApp(api, args as any);

      case 'delete_app':
        return handleDeleteApp(api, args as { app_id: string });

      case 'publish_app':
        return handlePublishApp(api, args as { app_id: string });

      case 'unpublish_app':
        return handleUnpublishApp(api, args as { app_id: string });

      case 'clone_app':
        return handleCloneApp(api, args as { app_id: string; name?: string });

      case 'link_app_workflow':
        return handleLinkAppWorkflow(api, args as { app_id: string; workflow_hash: string; alias?: string });

      case 'unlink_app_workflow':
        return handleUnlinkAppWorkflow(api, args as { app_id: string; workflow_hash: string });

      case 'get_app_template':
        return handleGetAppTemplate(args as { template?: string });

      // ============================================
      // Sharing & Public URLs Tools
      // ============================================
      case 'get_workflow_public_url':
        return handleGetWorkflowPublicUrl(api, args as { workflow_id: string });

      case 'list_shared_results':
        return handleListSharedResults(api, args as {
          workflow_id: string;
          sort?: string;
          limit?: number;
          page?: number;
        });

      case 'get_shared_result':
        return handleGetSharedResult(api, args as { workflow_id: string; result_hash: string });

      case 'get_shared_result_comments':
        return handleGetSharedResultComments(api, args as { workflow_id: string; result_hash: string });

      case 'create_shared_result':
        return handleCreateSharedResult(api, args as {
          workflow_id: string;
          execution_id: string;
          title?: string;
          description?: string;
          preset_hash?: string;
          expires_in_days?: number;
        });

      case 'add_workflow_comment':
        return handleAddWorkflowComment(api, args as { workflow_id: string; content: string; parent_id?: number });

      case 'add_shared_result_comment':
        return handleAddSharedResultComment(api, args as {
          workflow_id: string;
          result_hash: string;
          content: string;
          parent_id?: number;
        });

      case 'vote_workflow':
        return handleVoteWorkflow(api, args as { workflow_id: string; vote: 'up' | 'down' | 'remove' });

      case 'vote_shared_result':
        return handleVoteSharedResult(api, args as {
          workflow_id: string;
          result_hash: string;
          vote: 'up' | 'down' | 'remove';
        });

      // ============================================
      // Input Preset Tools
      // ============================================
      case 'list_input_presets':
        return handleListInputPresets(api, args as {
          workflow_id: string;
          sort?: string;
          limit?: number;
          page?: number;
        });

      case 'get_input_preset':
        return handleGetInputPreset(api, args as { workflow_id: string; preset_hash: string });

      case 'create_input_preset':
        return handleCreateInputPreset(api, args as {
          workflow_id: string;
          title: string;
          description?: string;
          inputs: Record<string, unknown>;
        });

      case 'update_input_preset':
        return handleUpdateInputPreset(api, args as {
          workflow_id: string;
          preset_hash: string;
          title?: string;
          description?: string;
          inputs?: Record<string, unknown>;
        });

      case 'delete_input_preset':
        return handleDeleteInputPreset(api, args as { workflow_id: string; preset_hash: string });

      case 'vote_input_preset':
        return handleVoteInputPreset(api, args as {
          workflow_id: string;
          preset_hash: string;
          vote: 'up' | 'down' | 'remove';
        });

      case 'toggle_community_inputs':
        return handleToggleCommunityInputs(api, args as { workflow_id: string; enabled: boolean });

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  });
}
