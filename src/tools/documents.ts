/**
 * Document tools — read / inspect / create / edit / convert real documents
 * (pdf, docx, pptx, xlsx, md, txt, csv) on the local filesystem, backed by the
 * `@flowdot.ai/documents` engine. These supersede the standalone
 * `document-mcp-server` (see Docs/DevGuides/FLOWDOT_DOCUMENT_EDITOR.md).
 *
 * Unlike the rest of this server (Hub HTTP calls), these tools operate on local
 * files on the user's machine — the same model document-mcp-server used.
 */

import { writeFile } from 'node:fs/promises';
import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDocument, detectFormat, type CreateSpec, type DocOp } from '@flowdot.ai/documents';

function ok(text: string): CallToolResult {
  return { content: [{ type: 'text', text }] };
}

function fail(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

// ---------------------------------------------------------------- read_document

export const readDocumentTool: Tool = {
  name: 'read_document',
  description:
    'Read the full text of a local document (pdf, docx, pptx, xlsx, md, txt, csv) by file path. ' +
    'Returns the format, a structural summary, and the extracted text.',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: { type: 'string', description: 'Absolute path to the document.' },
    },
    required: ['file_path'],
  },
};

export async function handleReadDocument(args: { file_path: string }): Promise<CallToolResult> {
  try {
    const doc = await FlowDocument.open(args.file_path);
    const text = await doc.readText();
    const outline = await doc.inspect();
    await doc.close();
    return ok(`Format: ${doc.format}\nSummary: ${JSON.stringify(outline.summary)}\n\n${text}`);
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------------ get_document_info

export const getDocumentInfoTool: Tool = {
  name: 'get_document_info',
  description:
    "Get a document's structured outline: format, per-format summary (counts of slides/pages/sheets/paragraphs), " +
    'a change token, and the first outline nodes (stable ids to use with edits).',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: { type: 'string', description: 'Absolute path to the document.' },
    },
    required: ['file_path'],
  },
};

export async function handleGetDocumentInfo(args: { file_path: string }): Promise<CallToolResult> {
  try {
    const doc = await FlowDocument.open(args.file_path);
    const outline = await doc.inspect();
    await doc.close();
    const nodes = outline.nodes.slice(0, 50).map((n) => ({
      id: n.id,
      kind: n.kind,
      label: n.label,
      text: n.text?.slice(0, 80),
    }));
    return ok(JSON.stringify({ format: outline.format, rev: outline.rev, summary: outline.summary, nodes }, null, 2));
  } catch (error) {
    return fail(error);
  }
}

// -------------------------------------------------------------- create_document

export const createDocumentTool: Tool = {
  name: 'create_document',
  description:
    'Create a new document at a local path; the file extension sets the format ' +
    '(.docx/.pptx/.xlsx/.pdf/.md/.txt/.csv). Supersedes create_docx/pdf/pptx/xlsx.\n\n' +
    '**Styled résumé (PDF only):** pass a `resume` object (with `.pdf` file_path) to author a ' +
    'polished two-column résumé — a full-height dark navy sidebar (summary / skills / certifications / ' +
    'education) with an optional photo at the top, and a main column of experience, then flagship ' +
    'projects and publications. Bad input is refused with a clear error (missing name, invalid palette ' +
    'hex, or a non-RGB/CMYK/progressive photo) — never a silently-wrong document.',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: { type: 'string', description: 'Output path; extension selects the format.' },
      title: { type: 'string', description: 'Document title / first heading (docx, pdf) or title slide (pptx).' },
      content: {
        type: 'string',
        description: 'Body text. Lines starting with "# " are headings and "- "/"* " are bullets (docx/pdf/md).',
      },
      slides: {
        type: 'array',
        description: 'pptx slides; each becomes a Title-and-Content slide.',
        items: {
          type: 'object',
          properties: { title: { type: 'string' }, content: { type: 'string' } },
        },
      },
      sheets: {
        type: 'array',
        description: 'xlsx sheets; each has a name and a 2-D array of row values.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            data: { type: 'array', items: { type: 'array' } },
          },
        },
      },
      resume: {
        type: 'object',
        description: 'PDF only: a structured résumé → styled two-column + dark sidebar + photo layout.',
        properties: {
          header: {
            type: 'object',
            description: 'Required. name + role (both non-empty); contactLines are drawn left-aligned under the name.',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              contactLines: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'role'],
          },
          sidebar: {
            type: 'object',
            description: 'The dark navy sidebar (page 1). Overflows past one page are refused, not clipped.',
            properties: {
              summary: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              certifications: {
                type: 'array',
                items: { type: 'object', properties: { title: { type: 'string' }, issuer: { type: 'string' } }, required: ['title'] },
              },
              education: {
                type: 'array',
                items: { type: 'object', properties: { degree: { type: 'string' }, school: { type: 'string' }, dates: { type: 'string' } }, required: ['degree'] },
              },
            },
          },
          experience: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                dates: { type: 'string' },
                company: { type: 'string' },
                location: { type: 'string' },
                bullets: { type: 'array', items: { type: 'string' } },
              },
              required: ['title'],
            },
          },
          flagshipProjects: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string' }, where: { type: 'string' }, description: { type: 'string' } }, required: ['name'] },
          },
          publications: {
            type: 'array',
            items: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, url: { type: 'string' } }, required: ['title'] },
          },
          photo: {
            type: 'object',
            description: 'Headshot for the top of the sidebar. Provide a `path` to a baseline-RGB JPEG or a PNG.',
            properties: { path: { type: 'string' } },
          },
          palette: {
            type: 'object',
            description: 'Optional #rrggbb overrides (ink/accent/gray/sidebarText/sidebarBg/sidebarRule/headerRule).',
          },
        },
        required: ['header'],
      },
    },
    required: ['file_path'],
  },
};

export async function handleCreateDocument(
  args: { file_path: string } & CreateSpec,
): Promise<CallToolResult> {
  try {
    const format = detectFormat(args.file_path);
    const doc = await FlowDocument.create(format, {
      title: args.title,
      content: args.content,
      slides: args.slides,
      sheets: args.sheets,
      resume: args.resume,
    });
    await doc.save(args.file_path);
    await doc.close();
    return ok(`Created ${format} document at ${args.file_path}`);
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------- edit_document

export const editDocumentTool: Tool = {
  name: 'edit_document',
  description:
    'Apply structured edits to a document in place and save it. Ops: ' +
    'replace_text {search, replace, all?} (all formats; run-aware for docx/pptx); ' +
    'set_cell {sheet?, ref, value} (xlsx); set_text {text} and append_text {text} (md/txt/csv; ' +
    'append_text also appends paragraphs to docx). Returns per-op results with counts, skipped, and notes.',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: { type: 'string', description: 'Absolute path to the document to edit.' },
      ops: {
        type: 'array',
        description: 'An array of edit-op objects, each with an "op" field and its parameters.',
        items: { type: 'object' },
      },
    },
    required: ['file_path', 'ops'],
  },
};

export async function handleEditDocument(args: { file_path: string; ops: DocOp[] }): Promise<CallToolResult> {
  try {
    if (!Array.isArray(args.ops)) {
      return fail(new Error('`ops` must be an array of edit-op objects.'));
    }
    const doc = await FlowDocument.open(args.file_path);
    const report = await doc.applyOps(args.ops);
    await doc.save(args.file_path);
    await doc.close();
    return ok(JSON.stringify(report, null, 2));
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------------- convert_document

export const convertDocumentTool: Tool = {
  name: 'convert_document',
  description:
    'Convert a document to another format; the output extension sets the target. Supported: ' +
    'any → txt/md/csv (text extraction); md/txt/csv → docx/pdf (authoring); same-format copy. ' +
    'Faithful binary→binary conversion (e.g. docx→pdf) is refused rather than done lossily.',
  inputSchema: {
    type: 'object',
    properties: {
      input_path: { type: 'string', description: 'Path to the source document.' },
      output_path: { type: 'string', description: 'Path to write the converted document; extension = target format.' },
    },
    required: ['input_path', 'output_path'],
  },
};

export async function handleConvertDocument(args: { input_path: string; output_path: string }): Promise<CallToolResult> {
  try {
    const target = detectFormat(args.output_path);
    const doc = await FlowDocument.open(args.input_path);
    const bytes = await doc.convert(target);
    await doc.close();
    await writeFile(args.output_path, bytes);
    return ok(`Converted to ${target} at ${args.output_path}`);
  } catch (error) {
    return fail(error);
  }
}
