/**
 * Tests for progressive-disclosure category mapping + discovery tools.
 */
import { describe, it, expect } from 'vitest';
import { tools } from './tools/index.js';
import {
  categoryForTool,
  toolsForCategories,
  mapTopicToCategory,
  learnAbout,
  listToolForResourceType,
  DISCOVERY_TOOLS,
  TOOL_CATEGORIES,
  LEARN_TOPICS,
} from './tool-categories.js';

describe('categoryForTool', () => {
  it('maps representative tools to the right category', () => {
    expect(categoryForTool('create_app')).toBe('apps');
    expect(categoryForTool('edit_app_code')).toBe('apps');
    expect(categoryForTool('link_app_toolkit')).toBe('apps'); // app op, not toolkit
    expect(categoryForTool('mcp__flowdot__invoke_toolkit_tool')).toBe('toolkits');
    expect(categoryForTool('create_recipe')).toBe('recipes');
    expect(categoryForTool('create_custom_node')).toBe('custom-nodes');
    expect(categoryForTool('query_knowledge_base')).toBe('knowledge');
    expect(categoryForTool('upload_image')).toBe('knowledge');
    expect(categoryForTool('grant_kb_access')).toBe('knowledge');
    expect(categoryForTool('create_goal')).toBe('goals');
    expect(categoryForTool('create_agent_character')).toBe('characters');
    expect(categoryForTool('email_send')).toBe('email');
    expect(categoryForTool('send_notification')).toBe('comms');
    expect(categoryForTool('create_workflow')).toBe('workflows');
    expect(categoryForTool('add_node')).toBe('workflows');
    expect(categoryForTool('create_shared_result')).toBe('workflows');
  });

  it('assigns every tool to one of the known categories', () => {
    for (const t of tools) {
      expect(TOOL_CATEGORIES).toContain(categoryForTool(t.name));
    }
  });

  it('keeps every category well under the 128-tool prompt ceiling', () => {
    for (const cat of TOOL_CATEGORIES) {
      expect(toolsForCategories([cat]).length).toBeLessThan(100);
    }
  });
});

describe('toolsForCategories', () => {
  it('returns only the requested categories, deduped', () => {
    const appTools = toolsForCategories(['apps']);
    expect(appTools.some((t) => t.name === 'create_app')).toBe(true);
    expect(appTools.some((t) => t.name === 'create_recipe')).toBe(false);
    const names = appTools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('mapTopicToCategory', () => {
  it('maps learn topics to categories, overview → null, images → knowledge', () => {
    expect(mapTopicToCategory('apps')).toBe('apps');
    expect(mapTopicToCategory('knowledge-base')).toBe('knowledge');
    expect(mapTopicToCategory('images')).toBe('knowledge');
    expect(mapTopicToCategory('overview')).toBeNull();
    expect(mapTopicToCategory('nonsense')).toBeNull();
  });
});

describe('learnAbout', () => {
  it('unlocks a category and lists its tools WITH parameters', () => {
    const res = learnAbout('apps');
    expect(res.categoryToLoad).toBe('apps');
    expect(res.text).toContain('create_app');
    // The model needs the exact param names to emit the action, not just a name.
    expect(res.text).toContain('required:');
    expect(res.text).toContain('name (');
  });
  it('overview teaches but unlocks nothing', () => {
    const res = learnAbout('overview');
    expect(res.categoryToLoad).toBeNull();
  });
});

describe('discovery tools', () => {
  it('exposes exactly learn_about + list_my_resources', () => {
    expect(DISCOVERY_TOOLS.map((t) => t.name).sort()).toEqual([
      'learn_about',
      'list_my_resources',
    ]);
  });
  it('learn_about enum matches the supported topics', () => {
    const enumTopics = (DISCOVERY_TOOLS[0].inputSchema as {
      properties: { topic: { enum: string[] } };
    }).properties.topic.enum;
    expect(enumTopics).toEqual(LEARN_TOPICS);
  });
});

describe('listToolForResourceType', () => {
  it('maps resource types to their list tool', () => {
    expect(listToolForResourceType('apps')).toBe('list_apps');
    expect(listToolForResourceType('toolkits')).toBe('mcp__flowdot__list_installed_toolkits');
    expect(listToolForResourceType('knowledge_docs')).toBe('list_knowledge_documents');
    expect(listToolForResourceType('bogus')).toBeNull();
  });
});
