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
    'a change token, and the first outline nodes (stable ids to use with edits). ' +
    'For a PDF this also surfaces, under each page node, its AcroForm fields ' +
    '(kind:"form-field", label=field name, text="<type>=<value>", with page + box) so you can ' +
    'fill them with edit_document `fill_form`, and positioned text spans (kind:"span", with page + box, ' +
    'origin bottom-left in PDF points) so you can place text on a FLAT form with edit_document `overlay_text`. ' +
    'summary.formFields is the field count when the PDF has a form.',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: { type: 'string', description: 'Absolute path to the document.' },
    },
    required: ['file_path'],
  },
};

/** Map an engine OutlineNode → the tool's JSON, preserving PDF discovery data
 * (page + box + nested form-field/span children) that a caller needs to fill forms. */
function mapOutlineNode(n: {
  id: string;
  kind: string;
  label?: string;
  text?: string;
  page?: number;
  box?: { x: number; y: number; w: number; h: number };
  children?: unknown[];
}): Record<string, unknown> {
  const out: Record<string, unknown> = { id: n.id, kind: n.kind, label: n.label, text: n.text?.slice(0, 80) };
  if (n.page !== undefined) out.page = n.page;
  if (n.box) out.box = n.box;
  if (Array.isArray(n.children) && n.children.length > 0) {
    out.children = n.children.map((c) => mapOutlineNode(c as Parameters<typeof mapOutlineNode>[0]));
  }
  return out;
}

export async function handleGetDocumentInfo(args: { file_path: string }): Promise<CallToolResult> {
  try {
    const doc = await FlowDocument.open(args.file_path);
    const outline = await doc.inspect();
    await doc.close();
    const nodes = outline.nodes.slice(0, 50).map(mapOutlineNode);
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
      coverLetter: {
        type: 'object',
        description:
          'PDF only: a structured cover letter. `paragraphs[].lead` is a bold opening phrase drawn ' +
          'inline with its text (do not repeat it in `text`). Margins, styles and the per-page ' +
          'header banner follow the letter layout.',
        properties: {
          header: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              contactLines: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'role'],
          },
          date: { type: 'string' },
          greeting: { type: 'string' },
          paragraphs: {
            type: 'array',
            items: {
              type: 'object',
              properties: { text: { type: 'string' }, lead: { type: 'string' } },
              required: ['text'],
            },
          },
          signOff: { type: 'string' },
          signature: { type: 'string' },
          pageSize: { type: 'string', enum: ['letter', 'a4'] },
          palette: { type: 'object', description: '#rrggbb overrides: navy, gray, body, rule.' },
        },
        required: ['header', 'date', 'greeting', 'paragraphs', 'signOff', 'signature'],
      },
      layout: {
        type: 'object',
        description:
          'PDF résumé only: override any layout value — page size, margins, column edges, the 18 ' +
          'type sizes, vertical rhythm, section labels, bullet glyph, joiners. Anything omitted ' +
          'keeps its default, so a caller that passes nothing gets the standard design.',
      },
      resume: {
        type: 'object',
        description:
          'PDF only: a structured résumé. `layout: "single-column"` flows skills, certifications ' +
          'and education into the main column instead of a sidebar; `page_size` accepts letter or ' +
          'a4. snake_case keys (contact_lines, flagship_projects, page_size) are accepted.',
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
                description: 'Each item is a plain string, or an object with title and optional issuer.',
                items: {
                  oneOf: [
                    { type: 'string' },
                    { type: 'object', properties: { title: { type: 'string' }, issuer: { type: 'string' } }, required: ['title'] },
                  ],
                },
              },
              extraSections: {
                type: 'array',
                description: 'Extra named sections, rendered after education in single-column.',
                items: {
                  type: 'object',
                  properties: { title: { type: 'string' }, bullets: { type: 'array', items: { type: 'string' } } },
                  required: ['title'],
                },
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
      coverLetter: args.coverLetter,
      layout: args.layout,
    });
    await doc.save(args.file_path);
    await doc.close();
    if (format !== 'pdf') return ok(`Created ${format} document at ${args.file_path}`);
    const { inspectPdf } = await import('@flowdot.ai/documents');
    const info = await inspectPdf(args.file_path);
    return ok(
      JSON.stringify({ path: info.path, pages: info.pages, page_size: info.pageSizes[0] }, null, 2),
    );
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
    'append_text also appends paragraphs to docx). ' +
    'PDF form filling: fill_form {fields:{name:value…}, flatten?} fills AcroForm fields ' +
    '(text=string, checkbox=boolean, radio/dropdown=string) — get the field names from ' +
    'get_document_info; a PDF with no form is refused. For a FLAT form (no AcroForm fields), ' +
    'overlay_text {page,x,y,text,size?,color?,font?,fontPath?} draws text at a coordinate ' +
    '(origin BOTTOM-LEFT, PDF points; use the page box + spans from get_document_info to place it). ' +
    'PDF signatures: overlay_text with font:"signature" types a name in a bundled cursive font ' +
    '(font also accepts standard names like "times-italic"; fontPath embeds a custom TTF), and ' +
    'overlay_image {page,x,y,width,height,imagePath|imageBase64,format?,opacity?} stamps a ' +
    'drawn/scanned signature image (PNG/JPG). Returns per-op results with counts, skipped, and notes.',
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

// ------------------------------------------------------- merge_documents

export const mergeDocumentsTool: Tool = {
  name: 'merge_documents',
  description:
    'Concatenate PDFs into a single file, in the order given. Page content only — ' +
    'bookmarks, form fields and the sources\u2019 metadata are not carried across. ' +
    'Returns the output path, the total page count, and each source with its page count.',
  inputSchema: {
    type: 'object',
    properties: {
      input_paths: {
        type: 'array',
        items: { type: 'string' },
        description: 'Absolute paths to the PDFs to merge, in order. At least one.',
      },
      output_path: { type: 'string', description: 'Absolute path for the merged PDF.' },
    },
    required: ['input_paths', 'output_path'],
  },
};

export async function handleMergeDocuments(args: {
  input_paths: string[];
  output_path: string;
}): Promise<CallToolResult> {
  try {
    const { mergePdfs } = await import('@flowdot.ai/documents');
    return ok(JSON.stringify(await mergePdfs(args.input_paths, args.output_path), null, 2));
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------- inspect_document

export const inspectDocumentTool: Tool = {
  name: 'inspect_document',
  description:
    'File-level PDF detail an outline cannot carry: byte size on disk, page count, every ' +
    'page\u2019s size in points, and the complete Info dictionary including non-standard keys.',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: { type: 'string', description: 'Absolute path to the PDF.' },
    },
    required: ['file_path'],
  },
};

export async function handleInspectDocument(args: { file_path: string }): Promise<CallToolResult> {
  try {
    const { inspectPdf } = await import('@flowdot.ai/documents');
    return ok(JSON.stringify(await inspectPdf(args.file_path), null, 2));
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------- document_template

export const documentTemplateTool: Tool = {
  name: 'document_template',
  description:
    'Manage saved document templates: a named spec you build from repeatedly, with per-use ' +
    'overrides merged over it. Actions: save, load, list, delete, build. On `build`, overrides ' +
    'are deep-merged over the template — objects merge key by key, arrays REPLACE wholesale — ' +
    'and the result is rendered to `output_path` using the template\u2019s kind ' +
    '(`resume` or `cover_letter`). Templates saved by the older Python server are readable.',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['save', 'load', 'list', 'delete', 'build'] },
      name: { type: 'string', description: 'Template name; [A-Za-z0-9._-], up to 64 chars.' },
      kind: { type: 'string', description: 'save: what the template holds, e.g. resume or cover_letter.' },
      spec: { type: 'object', description: 'save: the spec to store. Stored verbatim and not validated.' },
      overrides: { type: 'object', description: 'build: deep-merged over the stored spec.' },
      output_path: { type: 'string', description: 'build: where to write the rendered document.' },
    },
    required: ['action'],
  },
};

export async function handleDocumentTemplate(args: {
  action: 'save' | 'load' | 'list' | 'delete' | 'build';
  name?: string;
  kind?: string;
  spec?: unknown;
  overrides?: unknown;
  output_path?: string;
}): Promise<CallToolResult> {
  try {
    const engine = await import('@flowdot.ai/documents');
    const need = (v: string | undefined, what: string): string => {
      if (v === undefined || v.trim() === '') throw new Error(`\`${what}\` is required for action '${args.action}'.`);
      return v;
    };

    switch (args.action) {
      case 'save':
        return ok(JSON.stringify(await engine.saveTemplate(need(args.name, 'name'), need(args.kind, 'kind'), args.spec), null, 2));
      case 'load':
        return ok(JSON.stringify(await engine.loadTemplate(need(args.name, 'name')), null, 2));
      case 'list':
        return ok(JSON.stringify(await engine.listTemplates(args.kind), null, 2));
      case 'delete':
        return ok(JSON.stringify(await engine.deleteTemplate(need(args.name, 'name')), null, 2));
      case 'build': {
        const outputPath = need(args.output_path, 'output_path');
        const resolved = await engine.resolveTemplate(need(args.name, 'name'), args.overrides);
        const doc =
          resolved.kind === 'cover_letter'
            ? await engine.FlowDocument.createCoverLetter(resolved.spec as never)
            : await engine.FlowDocument.createResume(resolved.spec as never);
        await doc.save(outputPath);
        await doc.close();
        const info = await engine.inspectPdf(outputPath);
        return ok(
          JSON.stringify(
            { path: info.path, pages: info.pages, page_size: info.pageSizes[0], template: resolved.template, kind: resolved.kind },
            null,
            2,
          ),
        );
      }
      default:
        return fail(new Error(`Unknown action '${String(args.action)}'.`));
    }
  } catch (error) {
    return fail(error);
  }
}
