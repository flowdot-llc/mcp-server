import { describe, it, expect } from 'vitest';
import {
  activeInteractiveCliTools,
  isInteractiveCliToolName,
  INTERACTIVE_CLI_TOOLS,
  CLI_QA_ENABLED,
} from './interactive-cli.js';
import { categoryForTool, toolsForCategories } from './tool-categories.js';
import { capabilitiesFor } from './tool-capabilities.js';

describe('interactive-cli opt-in', () => {
  it('is DISABLED by default (no FLOWDOT_CLI_QA in the test env) → advertises nothing', () => {
    expect(CLI_QA_ENABLED).toBe(false);
    expect(activeInteractiveCliTools()).toEqual([]);
  });

  it('defines all 11 tools with the interactive_cli__ prefix', () => {
    expect(INTERACTIVE_CLI_TOOLS).toHaveLength(11);
    for (const t of INTERACTIVE_CLI_TOOLS) expect(t.name.startsWith('interactive_cli__')).toBe(true);
    expect(isInteractiveCliToolName('interactive_cli__start_session')).toBe(true);
    expect(isInteractiveCliToolName('list_workflows')).toBe(false);
  });
});

describe('interactive-cli category + capabilities', () => {
  it('every interactive_cli__* tool maps to the interactive-cli category (not the default workflows bucket)', () => {
    for (const t of INTERACTIVE_CLI_TOOLS) {
      expect(categoryForTool(t.name)).toBe('interactive-cli');
    }
  });

  it('capabilitiesFor tags spawn/type as execute and reads as read (never [unknown])', () => {
    expect(capabilitiesFor('interactive_cli__start_session')).toEqual(['execute']);
    expect(capabilitiesFor('interactive_cli__run_test_sequence')).toEqual(['execute']);
    expect(capabilitiesFor('interactive_cli__send_input')).toEqual(['execute']);
    expect(capabilitiesFor('interactive_cli__read_output')).toEqual(['read']);
    expect(capabilitiesFor('interactive_cli__wait_for_idle')).toEqual(['read']);
    expect(capabilitiesFor('interactive_cli__get_status')).toEqual(['read']);
  });

  it('toolsForCategories(["interactive-cli"]) is empty while disabled (opt-in prompt budget honored)', () => {
    // Disabled in the test env → the category unlock yields nothing.
    expect(toolsForCategories(['interactive-cli'])).toEqual([]);
  });
});
