import { describe, expect, it } from 'vitest';

import { capabilitiesFor, isTagged } from './tool-capabilities.js';

describe('mcp-server tool-capabilities', () => {
  describe('exact-name overrides', () => {
    it('whoami → read + network-egress + credential', () => {
      expect(capabilitiesFor('whoami')).toEqual(['read', 'network-egress', 'credential']);
    });
    it('agent_chat → execute + network-egress + credential (LLM dispatch)', () => {
      expect(capabilitiesFor('agent_chat')).toEqual(['execute', 'network-egress', 'credential']);
    });
    it('panic_status → read (no Hub side effect at this layer)', () => {
      expect(capabilitiesFor('panic_status')).toEqual(['read']);
    });
    it('panic_stop / panic_clear → execute + credential', () => {
      expect(capabilitiesFor('panic_stop')).toEqual(['execute', 'credential']);
      expect(capabilitiesFor('panic_clear')).toEqual(['execute', 'credential']);
    });
    it('email_send → write + network-egress + credential', () => {
      expect(capabilitiesFor('email_send')).toEqual(['write', 'network-egress', 'credential']);
    });
    it('email_delete → delete + network-egress + credential', () => {
      expect(capabilitiesFor('email_delete')).toEqual(['delete', 'network-egress', 'credential']);
    });
    it('search (no underscore) → read + network-egress + credential', () => {
      expect(capabilitiesFor('search')).toEqual(['read', 'network-egress', 'credential']);
    });
  });

  describe('prefix patterns', () => {
    it('list_workflows → read + network-egress + credential', () => {
      expect(capabilitiesFor('list_workflows')).toEqual(['read', 'network-egress', 'credential']);
    });
    it('get_workflow_details → read', () => {
      expect(capabilitiesFor('get_workflow_details')).toEqual(['read', 'network-egress', 'credential']);
    });
    it('create_workflow → write', () => {
      expect(capabilitiesFor('create_workflow')).toEqual(['write', 'network-egress', 'credential']);
    });
    it('update_recipe_step → write', () => {
      expect(capabilitiesFor('update_recipe_step')).toEqual(['write', 'network-egress', 'credential']);
    });
    it('delete_workflow → delete', () => {
      expect(capabilitiesFor('delete_workflow')).toEqual(['delete', 'network-egress', 'credential']);
    });
    it('execute_workflow → execute', () => {
      expect(capabilitiesFor('execute_workflow')).toEqual(['execute', 'network-egress', 'credential']);
    });
    it('cancel_execution → execute', () => {
      expect(capabilitiesFor('cancel_execution')).toEqual(['execute', 'network-egress', 'credential']);
    });
    it('upload_text_document → write', () => {
      expect(capabilitiesFor('upload_text_document')).toEqual(['write', 'network-egress', 'credential']);
    });
    it('checkpoint_recipe → write', () => {
      expect(capabilitiesFor('checkpoint_recipe')).toEqual(['write', 'network-egress', 'credential']);
    });
    it('restore_recipe_version → write', () => {
      expect(capabilitiesFor('restore_recipe_version')).toEqual(['write', 'network-egress', 'credential']);
    });
    it('edit_app_code → write', () => {
      expect(capabilitiesFor('edit_app_code')).toEqual(['write', 'network-egress', 'credential']);
    });
    it('rename_app_file → write', () => {
      expect(capabilitiesFor('rename_app_file')).toEqual(['write', 'network-egress', 'credential']);
    });
    it('uninstall_toolkit → delete', () => {
      expect(capabilitiesFor('uninstall_toolkit')).toEqual(['delete', 'network-egress', 'credential']);
    });
  });

  describe('mcp__-doubled toolkit names', () => {
    it('strips mcp__flowdot__ prefix and applies prefix rule', () => {
      expect(capabilitiesFor('mcp__flowdot__list_agent_toolkits')).toEqual(['read', 'network-egress', 'credential']);
    });
    it('strips and resolves an exact override on the stripped name', () => {
      // (not currently used but verifies the stripping path)
      // mcp__flowdot__whoami would resolve to whoami's exact override.
      expect(capabilitiesFor('mcp__flowdot__whoami')).toEqual(['read', 'network-egress', 'credential']);
    });
    it('mcp__flowdot__delete_agent_toolkit → delete', () => {
      expect(capabilitiesFor('mcp__flowdot__delete_agent_toolkit')).toEqual(['delete', 'network-egress', 'credential']);
    });
    it('mcp__flowdot__invoke_toolkit_tool → execute', () => {
      expect(capabilitiesFor('mcp__flowdot__invoke_toolkit_tool')).toEqual(['execute', 'network-egress', 'credential']);
    });
  });

  describe('unknown fallback', () => {
    it('returns [unknown] for tools that do not match any rule', () => {
      expect(capabilitiesFor('some_unknown_tool_xyz')).toEqual(['unknown']);
    });
    it('returns [unknown] for tools without the mcp__ prefix and no other match', () => {
      expect(capabilitiesFor('xyzzy')).toEqual(['unknown']);
    });
  });

  describe('isTagged', () => {
    it('true for tagged tools', () => {
      expect(isTagged('list_workflows')).toBe(true);
      expect(isTagged('whoami')).toBe(true);
    });
    it('false for unknown tools', () => {
      expect(isTagged('xyzzy_no_rule')).toBe(false);
    });
  });
});
