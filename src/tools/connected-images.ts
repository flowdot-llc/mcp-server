/**
 * Images through a connected AI-provider account
 *
 * generate_image / edit_image / read_image use the account the user connected in the
 * FlowDot web app (Settings → Your Keys → Connections). Generated and edited images are
 * stored in the user's FlowDot bucket and returned as public URLs + ids, like upload_image.
 * Input images are bucket image ids (upload a local file first with upload_image).
 * Docs/OAUTH_IMAGES.md.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import type {
  GenerateImageInput,
  EditImageInput,
  ReadImageInput,
  ImageGenerationResult,
} from '@flowdot.ai/api';

const PROVIDER = {
  type: 'string',
  description: 'The connected account to use, e.g. "openai". It must be connected in the FlowDot web app: Settings → Your Keys → Connections.',
} as const;
const MODEL = {
  type: 'string',
  description: "The provider's image model id. Required; there is no default.",
} as const;
const IMAGE_OPTIONS = {
  background: { type: 'string', enum: ['transparent', 'opaque', 'auto'], description: 'Background. "transparent" for assets such as sprites and icons.' },
  quality: { type: 'string', enum: ['low', 'medium', 'high', 'auto'], description: 'Quality (higher is slower).' },
  size: { type: 'string', description: '"auto" or WIDTHxHEIGHT, e.g. "1024x1024". The provider may answer with another size; the result reports what was stored.' },
  gif: {
    type: 'object',
    description: 'Ask for a short looping animated GIF instead of a still image ({} uses the provider defaults). The provider may refuse it for your account; the refusal is returned as the error.',
    properties: {
      frame_count: { type: 'number', description: 'Frames, 2 to 16.' },
      frame_duration_ms: { type: 'number', description: 'Milliseconds per frame, 20 to 2000.' },
    },
    additionalProperties: false,
  },
  label: { type: 'string', description: 'Optional label stored with the image for your own reference.' },
} as const;
const IMAGE_IDS = {
  type: 'array',
  items: { type: 'number' },
  description: 'Ids of your own FlowDot bucket images (png, jpeg or webp; from upload_image, list_files, or an earlier generate_image / edit_image), 1 to 5, in the order your prompt refers to them.',
} as const;

export const generateImageToolDef: Tool = {
  name: 'generate_image',
  description:
    'Generate an image from a text prompt with your connected AI-provider account (billed to that subscription, not FlowDot credits). The image is stored in your FlowDot bucket and returned as a public URL and id (usable as input to edit_image / read_image). Requires the account to be connected in the FlowDot web app: Settings → Your Keys → Connections.',
  inputSchema: {
    type: 'object',
    properties: {
      provider: PROVIDER,
      model: MODEL,
      prompt: { type: 'string', description: 'What to draw. Be specific about subject, style, composition and any text.' },
      ...IMAGE_OPTIONS,
    },
    required: ['provider', 'model', 'prompt'],
    additionalProperties: false,
  },
};

export const editImageToolDef: Tool = {
  name: 'edit_image',
  description:
    'Edit or combine one or more of your FlowDot bucket images with your connected AI-provider account, following a text prompt. The result is stored in your bucket and returned as a public URL and id. To edit a file on your machine, upload it first with upload_image and pass its id.',
  inputSchema: {
    type: 'object',
    properties: {
      provider: PROVIDER,
      model: MODEL,
      image_ids: IMAGE_IDS,
      prompt: { type: 'string', description: 'The change to make. Refer to several images by their order, e.g. "put the object from the second image into the first".' },
      ...IMAGE_OPTIONS,
    },
    required: ['provider', 'model', 'image_ids', 'prompt'],
    additionalProperties: false,
  },
};

export const readImageToolDef: Tool = {
  name: 'read_image',
  description:
    "Ask your connected AI-provider account's model about one or more of your FlowDot bucket images: describe them, read their text, compare them, check a generated asset. Returns the model's answer as text. Upload a local file first with upload_image and pass its id.",
  inputSchema: {
    type: 'object',
    properties: {
      provider: PROVIDER,
      image_ids: IMAGE_IDS,
      prompt: { type: 'string', description: 'The question or instruction about the images.' },
      model: { type: 'string', description: 'A chat model of the connection. Default: the model chosen for the connection.' },
    },
    required: ['provider', 'image_ids', 'prompt'],
    additionalProperties: false,
  },
};

export const connectedImageTools: Tool[] = [generateImageToolDef, editImageToolDef, readImageToolDef];

function formatImages(title: string, result: ImageGenerationResult): CallToolResult {
  const lines = [`## ${title}`, '', `**Provider:** ${result.provider} · **Model:** ${result.model}`, ''];
  for (const img of result.images) {
    lines.push(`- **URL:** ${img.url}`, `  **ID:** ${img.id} · **Type:** ${img.mime_type} · **Size:** ${img.size_bytes} bytes`);
  }
  lines.push('', 'Stored in your FlowDot bucket. The URL is a public direct link; the id can be passed to edit_image or read_image.');
  return { content: [{ type: 'text', text: lines.join('\n') }] };
}

function failure(action: string, error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return { content: [{ type: 'text', text: `Error ${action}: ${message}` }], isError: true };
}

export async function handleGenerateImage(api: FlowDotApiClient, args: GenerateImageInput): Promise<CallToolResult> {
  try {
    return formatImages('Image Generated', await api.generateImage(args));
  } catch (error) {
    return failure('generating image', error);
  }
}

export async function handleEditImage(api: FlowDotApiClient, args: EditImageInput): Promise<CallToolResult> {
  try {
    return formatImages('Image Edited', await api.editImage(args));
  } catch (error) {
    return failure('editing image', error);
  }
}

export async function handleReadImage(api: FlowDotApiClient, args: ReadImageInput): Promise<CallToolResult> {
  try {
    const result = await api.readImage(args);
    return { content: [{ type: 'text', text: `${result.text}\n\n(${result.provider} · ${result.model})` }] };
  } catch (error) {
    return failure('reading image', error);
  }
}
