import { describe, it, expect, vi } from 'vitest';
import * as images from './connected-images.js';
import { tools, dispatchToolCall } from './index.js';
import { categoryForTool } from '../tool-categories.js';

const text = (r: { content: Array<unknown> }) => r.content.map((c) => (c as { text?: string }).text).join('\n');
const stored = { images: [{ id: 41, url: 'https://bucket/1/a.png', mime_type: 'image/png', size_bytes: 123 }], provider: 'openai', model: 'img-model' };

describe('connected-account image tools (Docs/OAUTH_IMAGES.md)', () => {
  it('registers generate_image, edit_image and read_image once each, with closed schemas, in the knowledge category', () => {
    for (const name of ['generate_image', 'edit_image', 'read_image']) {
      const registered = tools.filter((tool) => tool.name === name);
      expect(registered, name).toHaveLength(1);
      expect(registered[0].inputSchema.additionalProperties, name).toBe(false);
      expect(categoryForTool(name)).toBe('knowledge');
    }
    expect(images.generateImageToolDef.inputSchema.required).toEqual(['provider', 'model', 'prompt']);
    expect(images.editImageToolDef.inputSchema.required).toEqual(['provider', 'model', 'image_ids', 'prompt']);
    expect(images.readImageToolDef.inputSchema.required).toEqual(['provider', 'image_ids', 'prompt']);
  });

  it('generate_image dispatches to api.generateImage with the arguments unchanged and lists the stored image', async () => {
    const api = { generateImage: vi.fn(async () => stored) };
    const args = { provider: 'openai', model: 'img-model', prompt: 'a fox', background: 'transparent', gif: {} };
    const result = await dispatchToolCall(api as never, { params: { name: 'generate_image', arguments: args } } as never);
    expect(api.generateImage).toHaveBeenCalledExactlyOnceWith(args);
    expect(result.isError).toBeFalsy();
    expect(text(result)).toContain('https://bucket/1/a.png');
    expect(text(result)).toContain('**ID:** 41');
  });

  it('edit_image dispatches to api.editImage with the image ids in order', async () => {
    const api = { editImage: vi.fn(async () => stored) };
    const args = { provider: 'openai', model: 'img-model', prompt: 'combine', image_ids: [5, 3] };
    const result = await dispatchToolCall(api as never, { params: { name: 'edit_image', arguments: args } } as never);
    expect(api.editImage).toHaveBeenCalledExactlyOnceWith(args);
    expect(text(result)).toContain('Image Edited');
  });

  it('read_image dispatches to api.readImage and returns the text', async () => {
    const api = { readImage: vi.fn(async () => ({ text: 'A red circle.', provider: 'openai', model: 'chat-model' })) };
    const args = { provider: 'openai', prompt: 'what?', image_ids: [7] };
    const result = await dispatchToolCall(api as never, { params: { name: 'read_image', arguments: args } } as never);
    expect(api.readImage).toHaveBeenCalledExactlyOnceWith(args);
    expect(text(result)).toContain('A red circle.');
  });

  it('surfaces a Hub refusal as an error result', async () => {
    const api = { generateImage: vi.fn(async () => { throw new Error('Your OpenAI account is not connected.'); }) };
    const result = await images.handleGenerateImage(api as never, { provider: 'openai', model: 'm', prompt: 'x' });
    expect(result.isError).toBe(true);
    expect(text(result)).toContain('Your OpenAI account is not connected.');
  });
});
