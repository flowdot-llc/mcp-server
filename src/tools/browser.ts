/**
 * Browser + Electron-QA driving tools for the FlowDot MCP server.
 *
 * These let an MCP client (Claude) drive a REAL web browser or QA an Electron app
 * via Playwright, using the shared @flowdot.ai/browser-driver engine. Unlike the
 * rest of this server (Hub HTTP calls), they are PURELY LOCAL — no api client, no
 * Hub route (see LOCAL_ONLY in scripts/emit-manifest.mjs), same model as the
 * document tools.
 *
 * Playwright is an OPTIONAL dependency: this module imports the driver (which does
 * NOT load Playwright until a browser is actually launched), so the server starts
 * fine WITHOUT playwright installed — a browser tool then returns an actionable
 * install message rather than crashing the server.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createBrowserEngine, type BrowserEngine, type ActionParams, type FillFormEntry } from '@flowdot.ai/browser-driver';

// ---- shared engine singleton (persists browser sessions across tool calls) ----

let engine: BrowserEngine | null = null;
let cleanupRegistered = false;

function getEngine(): BrowserEngine {
  if (!engine) {
    engine = createBrowserEngine();
    if (!cleanupRegistered) {
      cleanupRegistered = true;
      process.once('beforeExit', () => void closeBrowserSessions());
      process.once('exit', () => void closeBrowserSessions());
    }
  }
  return engine;
}

/** Tear down all browser sessions (called on shutdown). */
export async function closeBrowserSessions(): Promise<void> {
  const e = engine;
  engine = null;
  if (e) {
    try {
      await e.closeAll();
    } catch {
      /* best-effort */
    }
  }
}

// ---- result helpers ----------------------------------------------------------

function ok(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function fail(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

function needSession(args: Record<string, unknown> | undefined): string {
  const id = (args?.session_id ?? args?.sessionId) as string | undefined;
  if (!id) throw new Error('session_id is required (get one from browser_launch)');
  return id;
}

// ---- tool definitions --------------------------------------------------------

export const browserLaunchTool: Tool = {
  name: 'browser_launch',
  description:
    'Open a web page in a real browser, OR launch an Electron app to QA it. Returns a session_id used by every other browser_* tool. Prefers your system Chrome/Edge (no download). Requires Playwright (optional dependency); returns an install hint if unavailable. Read the `learn://browser-driving` resource first for the observe→act loop and limits.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Web page URL to open (browser mode).' },
      app_path: { type: 'string', description: 'Path to an Electron app dir or executable to QA (Electron mode).' },
      headless: { type: 'boolean', description: 'Run without a visible window (default false).' },
      executable_path: { type: 'string', description: 'Explicit Electron executable path (Electron mode).' },
    },
  },
};

export const browserNavigateTool: Tool = {
  name: 'browser_navigate',
  description: 'Navigate a browser session to a new URL. Blocked from reaching the internal FlowDot node server (hub-mode).',
  inputSchema: {
    type: 'object',
    properties: { session_id: { type: 'string' }, url: { type: 'string' } },
    required: ['session_id', 'url'],
  },
};

export const browserDescribeTool: Tool = {
  name: 'browser_describe',
  description:
    'Read the current page: title, url, headings, interactive elements (with selectors), visible text, forms, modals, and errors. The primary observation channel — use before acting.',
  inputSchema: { type: 'object', properties: { session_id: { type: 'string' } }, required: ['session_id'] },
};

export const browserFindTool: Tool = {
  name: 'browser_find',
  description: 'Find candidate elements matching a natural-language description or text. Returns ranked selectors.',
  inputSchema: {
    type: 'object',
    properties: { session_id: { type: 'string' }, query: { type: 'string' } },
    required: ['session_id', 'query'],
  },
};

export const browserActTool: Tool = {
  name: 'browser_act',
  description:
    'Perform one UI action. action ∈ click | double_click | right_click | type | clear | press_key | scroll | hover | wait | upload_file | select_option | navigate. target = element text/selector/coords; value = text/key/url/file-path.',
  inputSchema: {
    type: 'object',
    properties: {
      session_id: { type: 'string' },
      action: { type: 'string', description: 'The action to perform.' },
      target: { type: 'string', description: 'Element text, CSS selector, or "x,y" coords.' },
      value: { type: 'string', description: 'Text to type / key / url / file path / option.' },
      options: { type: 'object', description: '{ button?, modifiers?, force? }' },
    },
    required: ['session_id', 'action'],
  },
};

export const browserSequenceTool: Tool = {
  name: 'browser_sequence',
  description: 'Run several actions in one call (fast, fewer round-trips). Each item is { action, target?, value? }.',
  inputSchema: {
    type: 'object',
    properties: {
      session_id: { type: 'string' },
      actions: { type: 'array', items: { type: 'object' }, description: 'Array of { action, target?, value? }.' },
      stop_on_error: { type: 'boolean', description: 'Stop at first failure (default true).' },
    },
    required: ['session_id', 'actions'],
  },
};

export const browserReadFormTool: Tool = {
  name: 'browser_read_form',
  description:
    "Return a schema of the page's main form: each field's label, ref, type (text|native-select|react-select|autocomplete|file|radio|checkbox|...), required flag, value, and dropdown options. Reads the TOP document only (iframed boards not covered). Use before browser_fill_form.",
  inputSchema: {
    type: 'object',
    properties: { session_id: { type: 'string' }, include_options: { type: 'boolean', description: 'Open dropdowns to enumerate options (default true).' } },
    required: ['session_id'],
  },
};

export const browserFillFormTool: Tool = {
  name: 'browser_fill_form',
  description:
    'Fill many form fields in one call, each with the correct interaction for its type (react-select, autocomplete, file upload, radio, checkbox). Autocomplete fields with no matching suggestion are left blank and reported failed — never filled with a wrong value.',
  inputSchema: {
    type: 'object',
    properties: {
      session_id: { type: 'string' },
      fields: { type: 'array', items: { type: 'object' }, description: 'Array of { field, value, option? }.' },
      delay: { type: 'number', description: 'ms between fields (default 450).' },
    },
    required: ['session_id', 'fields'],
  },
};

export const browserScreenshotTool: Tool = {
  name: 'browser_screenshot',
  description: 'Capture a PNG of the current page. Returns a base64 image (or writes to save_path if given).',
  inputSchema: {
    type: 'object',
    properties: {
      session_id: { type: 'string' },
      full_page: { type: 'boolean', description: 'Capture the full scrollable page (default false).' },
      save_path: { type: 'string', description: 'If set, write the PNG here and return the path instead of base64.' },
    },
    required: ['session_id'],
  },
};

export const browserWaitForTool: Tool = {
  name: 'browser_wait_for',
  description: 'Wait until a selector or text appears (up to a timeout).',
  inputSchema: {
    type: 'object',
    properties: {
      session_id: { type: 'string' },
      selector: { type: 'string' },
      text: { type: 'string' },
      timeout: { type: 'number', description: 'ms (default 5000).' },
    },
    required: ['session_id'],
  },
};

export const browserCloseTool: Tool = {
  name: 'browser_close',
  description: 'Close one browser/Electron session and free its resources.',
  inputSchema: { type: 'object', properties: { session_id: { type: 'string' } }, required: ['session_id'] },
};

export const browserListSessionsTool: Tool = {
  name: 'browser_list_sessions',
  description: 'List all open browser/Electron sessions.',
  inputSchema: { type: 'object', properties: {} },
};

/** All browser tool definitions, in registration order. */
export const browserTools: Tool[] = [
  browserLaunchTool,
  browserNavigateTool,
  browserDescribeTool,
  browserFindTool,
  browserActTool,
  browserSequenceTool,
  browserReadFormTool,
  browserFillFormTool,
  browserScreenshotTool,
  browserWaitForTool,
  browserCloseTool,
  browserListSessionsTool,
];

// ---- handlers ----------------------------------------------------------------

export async function handleBrowserLaunch(args: Record<string, unknown> = {}): Promise<CallToolResult> {
  const url = args.url as string | undefined;
  const appPath = (args.app_path ?? args.appPath) as string | undefined;
  if (!url && !appPath) return fail(new Error('Provide either `url` (web page) or `app_path` (Electron app to QA)'));
  try {
    return ok(
      await getEngine().launch({
        url,
        appPath,
        headless: args.headless as boolean | undefined,
        executablePath: (args.executable_path ?? args.executablePath) as string | undefined,
      }),
    );
  } catch (e) {
    return fail(e);
  }
}

export async function handleBrowserNavigate(args: Record<string, unknown> = {}): Promise<CallToolResult> {
  try {
    const url = args.url as string | undefined;
    if (!url) return fail(new Error('url is required'));
    return ok(await getEngine().navigate(needSession(args), url));
  } catch (e) {
    return fail(e);
  }
}

export async function handleBrowserDescribe(args: Record<string, unknown> = {}): Promise<CallToolResult> {
  try {
    return ok(await getEngine().describe(needSession(args)));
  } catch (e) {
    return fail(e);
  }
}

export async function handleBrowserFind(args: Record<string, unknown> = {}): Promise<CallToolResult> {
  try {
    const query = args.query as string | undefined;
    if (!query) return fail(new Error('query is required'));
    return ok(await getEngine().find(needSession(args), query));
  } catch (e) {
    return fail(e);
  }
}

export async function handleBrowserAct(args: Record<string, unknown> = {}): Promise<CallToolResult> {
  try {
    const action = args.action as ActionParams['action'] | undefined;
    if (!action) return fail(new Error('action is required'));
    const params: ActionParams = {
      action,
      target: args.target as string | undefined,
      value: args.value as string | undefined,
      options: args.options as ActionParams['options'],
    };
    return ok(await getEngine().act(needSession(args), params));
  } catch (e) {
    return fail(e);
  }
}

export async function handleBrowserSequence(args: Record<string, unknown> = {}): Promise<CallToolResult> {
  try {
    const actions = args.actions as ActionParams[] | undefined;
    if (!Array.isArray(actions) || actions.length === 0) return fail(new Error('actions must be a non-empty array'));
    return ok(await getEngine().sequence(needSession(args), actions, args.stop_on_error !== false));
  } catch (e) {
    return fail(e);
  }
}

export async function handleBrowserReadForm(args: Record<string, unknown> = {}): Promise<CallToolResult> {
  try {
    return ok(await getEngine().readForm(needSession(args), args.include_options !== false));
  } catch (e) {
    return fail(e);
  }
}

export async function handleBrowserFillForm(args: Record<string, unknown> = {}): Promise<CallToolResult> {
  try {
    const fields = args.fields as FillFormEntry[] | undefined;
    if (!Array.isArray(fields) || fields.length === 0) return fail(new Error('fields must be a non-empty array'));
    const delay = args.delay;
    return ok(await getEngine().fillForm(needSession(args), fields, typeof delay === 'number' ? delay : 450));
  } catch (e) {
    return fail(e);
  }
}

export async function handleBrowserScreenshot(args: Record<string, unknown> = {}): Promise<CallToolResult> {
  try {
    return ok(
      await getEngine().screenshot(needSession(args), {
        savePath: (args.save_path ?? args.savePath) as string | undefined,
        fullPage: (args.full_page ?? args.fullPage) === true,
      }),
    );
  } catch (e) {
    return fail(e);
  }
}

export async function handleBrowserWaitFor(args: Record<string, unknown> = {}): Promise<CallToolResult> {
  try {
    return ok(
      await getEngine().waitFor(needSession(args), {
        selector: args.selector as string | undefined,
        text: args.text as string | undefined,
        timeoutMs: (args.timeout ?? args.timeout_ms ?? args.timeoutMs) as number | undefined,
      }),
    );
  } catch (e) {
    return fail(e);
  }
}

export async function handleBrowserClose(args: Record<string, unknown> = {}): Promise<CallToolResult> {
  try {
    const id = needSession(args);
    await getEngine().close(id);
    return ok({ closed: id });
  } catch (e) {
    return fail(e);
  }
}

export async function handleBrowserListSessions(): Promise<CallToolResult> {
  try {
    return ok({ sessions: getEngine().listSessions() });
  } catch (e) {
    return fail(e);
  }
}
