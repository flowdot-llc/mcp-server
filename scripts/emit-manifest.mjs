#!/usr/bin/env node
/**
 * emit-manifest.mjs
 *
 * Serializes the canonical FlowDot tool catalog and learning resources from
 * this package (the single source of truth) into JSON files the Laravel Hub
 * loads to drive its REMOTE MCP connector (the OAuth path Claude/ChatGPT use):
 *
 *   FlowDot-Hub/resources/mcp/tool-catalog.json    [{ name, description, inputSchema }]
 *   FlowDot-Hub/resources/mcp/learn-resources.json [{ uri, name, description, mimeType, content }]
 *   FlowDot-Hub/resources/agent-learning/<id>.md   web /agent learn_about prose (one file per web topic)
 *
 * The Hub never re-derives tool schemas; it consumes these files, so the
 * remote connector can never drift from the stdio server's tool definitions.
 * The agent-learning/*.md are served by GET /hub/agent/learn/{topic} to the
 * web /agent (Node toolHandlers.js), so its learn_about content is the SAME
 * authored prose as every other surface — no hand-maintained web copies.
 *
 * Usage:
 *   node scripts/emit-manifest.mjs            # build dist first, then write the JSON files
 *   node scripts/emit-manifest.mjs --check    # CI drift guard: fail if committed files are stale
 *
 * Requires `npm run build` to have produced dist/ (we import the compiled ESM).
 * Override the Hub location with FLOWDOT_HUB_DIR if the repo layout differs.
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '..');

const hubRoot =
  process.env.FLOWDOT_HUB_DIR
    ? resolve(process.env.FLOWDOT_HUB_DIR)
    : resolve(pkgRoot, '../FlowDot-Hub');

const hubMcpDir = resolve(hubRoot, 'resources/mcp');
const hubAgentLearningDir = resolve(hubRoot, 'resources/agent-learning');

const TOOL_CATALOG_PATH = resolve(hubMcpDir, 'tool-catalog.json');
const LEARN_RESOURCES_PATH = resolve(hubMcpDir, 'learn-resources.json');
const TOOL_ROUTES_PATH = resolve(hubMcpDir, 'tool-routes.json');

/**
 * The web /agent (Node toolHandlers.js `validTopics`) only unlocks its 7 Hub tool
 * categories, so it must NOT advertise a topic whose tools it can't dispatch. These
 * are exactly the shared web-surface topics that carry a category (+ overview). Each
 * emits resources/agent-learning/<id>.md from the shared prose. Keep in lockstep with
 * toolHandlers.js `validTopics` — the drift check compares these files too.
 */
const WEB_LEARN_TOPICS = ['overview', 'workflows', 'apps', 'recipes', 'custom-nodes', 'toolkits', 'knowledge'];

async function loadSources() {
  const distTools = resolve(pkgRoot, 'dist/tools/index.js');
  const distResources = resolve(pkgRoot, 'dist/resources/index.js');
  const distApi = resolve(pkgRoot, 'dist/api-client.js');
  if (!existsSync(distTools) || !existsSync(distResources) || !existsSync(distApi)) {
    console.error(
      'ERROR: dist/ not found. Run `npm run build` before emitting the manifest.',
    );
    process.exit(2);
  }
  const { tools, dispatchToolCall } = await import(pathToFileURL(distTools).href);
  // Sync the REMOTE resource set to the Hub OAuth connector — it is Hub-only, so
  // it must NOT carry local-only guides (browser/documents) whose tools it can't run.
  const { LEARN_RESOURCES_REMOTE } = await import(pathToFileURL(distResources).href);
  const { FlowDotApiClient } = await import(pathToFileURL(distApi).href);
  // The shared taxonomy (vendored into dist by inline-engine.mjs) — used to emit
  // the web /agent's agent-learning/*.md from the same authored prose.
  const distLearn = resolve(pkgRoot, 'dist/vendor/platform-learn.js');
  const { getTopic } = await import(pathToFileURL(distLearn).href);
  return { tools, dispatchToolCall, LEARN_RESOURCES: LEARN_RESOURCES_REMOTE, FlowDotApiClient, getTopic };
}

const SENTINEL_PREFIX = '__FDARG__';
const sentinel = (prop) => `${SENTINEL_PREFIX}${prop}__`;

/**
 * Authoritative REST bindings for tools the recorder can't capture because the
 * handler validates a numeric/object arg before issuing the request. Each entry
 * is transcribed directly from the @flowdot.ai/api client method cited; the
 * {param} names match the tool's input-schema arg names so the Hub can
 * substitute them into the path.
 */
const ROUTE_OVERRIDES = {
  // api-client.ts:2212 — async restoreRecipeVersion(hash, versionNumber)
  restore_recipe_version: { method: 'POST', path: '/agent-recipes/{hash}/versions/{version_number}/restore' },
  // api-client.ts:1310 — async createInputPreset(workflowId, input)
  create_input_preset: { method: 'POST', path: '/workflows/{workflow_id}/input-presets' },
  // api-client.ts:1875 — async testToolkitInstallation(installationId)
  mcp__flowdot__test_toolkit_installation: { method: 'POST', path: '/agent-toolkit-installations/{installation_id}/test' },
  // api-client.ts:2079 — async listRecipeSteps(hash). Pinned: the handler makes
  // a second context call, so the recorder flags it; this is the primary route.
  list_recipe_steps: { method: 'GET', path: '/agent-recipes/{hash}/steps' },
};

/**
 * Tools with NO single Hub REST route — intentionally excluded from the remote
 * connector's dispatchable surface (they remain available on the stdio CLI).
 */
const LOCAL_ONLY = {
  search: 'client-side fan-out across multiple search endpoints (no single mcp/v1 route)',
  get_app_template: 'local static templates — no API call',
  get_custom_node_template: 'local static templates — no API call',
  stream_execution: 'SSE stream — not dispatchable as a unary tool (use get_execution_status)',
  // Document tools operate on the user's LOCAL filesystem via @flowdot.ai/documents;
  // they have no Hub REST route and cannot run through the remote/OAuth connector.
  read_document: 'local filesystem document read via @flowdot.ai/documents — no Hub route',
  get_document_info: 'local filesystem document inspect via @flowdot.ai/documents — no Hub route',
  create_document: 'local filesystem document authoring via @flowdot.ai/documents — no Hub route',
  edit_document: 'local filesystem document edit via @flowdot.ai/documents — no Hub route',
  convert_document: 'local filesystem document conversion via @flowdot.ai/documents — no Hub route',
  // Browser + Electron-QA driving — local Playwright via @flowdot.ai/browser-driver;
  // no Hub route, not dispatchable through the remote/OAuth connector.
  browser_launch: 'local Playwright browser/Electron launch — no Hub route',
  browser_navigate: 'local Playwright navigation — no Hub route',
  browser_describe: 'local Playwright DOM summary — no Hub route',
  browser_find: 'local Playwright element search — no Hub route',
  browser_act: 'local Playwright UI action — no Hub route',
  browser_sequence: 'local Playwright batched actions — no Hub route',
  browser_read_form: 'local Playwright form schema — no Hub route',
  browser_fill_form: 'local Playwright form fill — no Hub route',
  browser_screenshot: 'local Playwright screenshot — no Hub route',
  browser_wait_for: 'local Playwright wait — no Hub route',
  browser_close: 'local Playwright session close — no Hub route',
  browser_list_sessions: 'local Playwright session list — no Hub route',
};

/**
 * Derive each tool's REST binding {method, path} by running its handler through
 * a recording api-client that captures the single request() call it makes.
 * Path params are always interpolated into the URL, so the path template is
 * captured reliably; query/body precision is intentionally NOT relied on (the
 * Hub dispatcher forwards non-path args as both query + body).
 *
 * Returns { routes: [{name, method, path}], skipped: [{name, reason}] }.
 */
async function buildToolRoutes(tools, dispatchToolCall, FlowDotApiClient) {
  const routes = [];
  const skipped = [];

  // Fake Response so direct-fetch handlers can proceed past response handling
  // (we only need the URL + method, captured at the fetch call site).
  const fakeResponse = () => ({
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: async () => ({ success: true, data: {} }),
    text: async () => '{}',
    body: null,
    clone() { return fakeResponse(); },
  });
  const stripPrefix = (url) => String(url).replace(/^.*\/api\/mcp\/v1/, '') || '/';
  const realFetch = globalThis.fetch;

  for (const tool of [...tools].sort((a, b) => a.name.localeCompare(b.name))) {
    if (LOCAL_ONLY[tool.name]) {
      skipped.push({ name: tool.name, reason: LOCAL_ONLY[tool.name], excluded: true });
      continue;
    }
    if (ROUTE_OVERRIDES[tool.name]) {
      routes.push({ name: tool.name, ...ROUTE_OVERRIDES[tool.name] });
      continue;
    }
    const captured = [];
    class RecordingClient extends FlowDotApiClient {
      async request(endpoint, options = {}) {
        captured.push({ method: (options.method || 'GET').toUpperCase(), endpoint });
        return {}; // permissive; handler may post-process but we already captured
      }
    }
    const api = new RecordingClient('http://localhost', 'recording');

    // Capture handlers that call fetch() directly (bypassing this.request).
    globalThis.fetch = async (url, options = {}) => {
      captured.push({ method: (options.method || 'GET').toUpperCase(), endpoint: stripPrefix(url) });
      return fakeResponse();
    };

    // Type-appropriate synthetic args: string sentinels (so path params are
    // recognizable in the captured URL), but real empty arrays/objects so
    // handlers that call .join()/.length on them before requesting don't throw.
    const args = {};
    const props = (tool.inputSchema && tool.inputSchema.properties) || {};
    for (const [prop, schema] of Object.entries(props)) {
      const t = schema && schema.type;
      args[prop] = t === 'array' ? [] : t === 'object' ? {} : sentinel(prop);
    }

    try {
      await dispatchToolCall(api, { params: { name: tool.name, arguments: args } });
    } catch {
      // handler threw before/after request() — capture state still inspected below
    } finally {
      globalThis.fetch = realFetch;
    }

    if (captured.length === 0) {
      skipped.push({ name: tool.name, reason: 'no REST request captured (local-only or pre-request throw)' });
      continue;
    }
    if (captured.length > 1) {
      // Multi-request tool: the first request is the primary one; flag for review.
      skipped.push({ name: tool.name, reason: `multiple requests captured (${captured.length}); using first`, soft: true });
    }

    const { method, endpoint } = captured[0];
    const pathOnly = endpoint.split('?')[0];
    // Replace each sentinel value in the path with a {prop} placeholder.
    const path = pathOnly.replace(
      new RegExp(`${SENTINEL_PREFIX}([A-Za-z0-9_]+)__`, 'g'),
      (_m, prop) => `{${prop}}`,
    );
    routes.push({ name: tool.name, method, path });
  }

  // Completeness guard: every tool must be either dispatchable (in routes) or
  // explicitly local-only. Anything else is an unhandled capture failure.
  const routed = new Set(routes.map((r) => r.name));
  const unhandled = tools
    .map((t) => t.name)
    .filter((n) => !routed.has(n) && !LOCAL_ONLY[n]);
  if (unhandled.length) {
    console.error('\nERROR: tools with no REST binding and not marked LOCAL_ONLY:');
    for (const n of unhandled) console.error(`  - ${n}`);
    console.error('Add a ROUTE_OVERRIDES entry (from the api-client) or a LOCAL_ONLY reason.');
    process.exit(3);
  }

  return { routes: routes.sort((a, b) => a.name.localeCompare(b.name)), skipped };
}

function buildToolCatalog(tools) {
  return [...tools]
    .map((t) => ({
      name: t.name,
      description: t.description ?? '',
      inputSchema: t.inputSchema ?? { type: 'object' },
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildLearnResources(learnResources) {
  return Object.entries(learnResources)
    .map(([uri, r]) => ({
      uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
      content: r.content,
    }))
    .sort((a, b) => a.uri.localeCompare(b.uri));
}

// Stable serialization for clean git diffs: 2-space indent + trailing newline.
function serialize(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

/**
 * The web /agent learn docs: one `<id>.md` per WEB_LEARN_TOPIC, content = the
 * shared authored prose. Returns [{ path, content, id }]. Fails loudly if a topic
 * id is unknown or not actually a web-surface topic (guards against drift between
 * this list and the shared taxonomy's `surfaces`).
 */
function buildWebLearnDocs(getTopic) {
  return WEB_LEARN_TOPICS.map((id) => {
    const topic = getTopic(id);
    if (!topic) {
      console.error(`ERROR: WEB_LEARN_TOPICS has unknown topic "${id}".`);
      process.exit(4);
    }
    if (!topic.surfaces.includes('web')) {
      console.error(`ERROR: WEB_LEARN_TOPICS topic "${id}" is not a web-surface topic.`);
      process.exit(4);
    }
    return { id, path: resolve(hubAgentLearningDir, `${id}.md`), content: topic.prose.trim() + '\n' };
  });
}

async function main() {
  const check = process.argv.includes('--check');
  const { tools, dispatchToolCall, LEARN_RESOURCES, FlowDotApiClient, getTopic } = await loadSources();

  const catalog = serialize(buildToolCatalog(tools));
  const learn = serialize(buildLearnResources(LEARN_RESOURCES));
  const { routes, skipped } = await buildToolRoutes(tools, dispatchToolCall, FlowDotApiClient);
  const routesJson = serialize(routes);
  const webDocs = buildWebLearnDocs(getTopic);

  if (check) {
    // Standalone (non-monorepo) context: the Hub isn't a sibling, so there's
    // nothing to drift-check. Skip cleanly rather than fail a publish.
    if (!existsSync(hubMcpDir)) {
      console.error(`Hub resources dir not found (${hubMcpDir}); skipping drift check.`);
      return;
    }
    let drifted = false;
    const checks = [
      [TOOL_CATALOG_PATH, catalog, 'tool-catalog.json'],
      [LEARN_RESOURCES_PATH, learn, 'learn-resources.json'],
      [TOOL_ROUTES_PATH, routesJson, 'tool-routes.json'],
      ...webDocs.map((d) => [d.path, d.content, `agent-learning/${d.id}.md`]),
    ];
    for (const [path, expected, label] of checks) {
      const actual = existsSync(path) ? readFileSync(path, 'utf8') : null;
      if (actual !== expected) {
        drifted = true;
        console.error(
          `DRIFT: ${label} is out of date. Run \`npm run emit-manifest\` and commit the result.`,
        );
      }
    }
    if (drifted) process.exit(1);
    console.error('Manifest is in sync.');
    return;
  }

  mkdirSync(hubMcpDir, { recursive: true });
  writeFileSync(TOOL_CATALOG_PATH, catalog);
  writeFileSync(LEARN_RESOURCES_PATH, learn);
  writeFileSync(TOOL_ROUTES_PATH, routesJson);

  mkdirSync(hubAgentLearningDir, { recursive: true });
  for (const d of webDocs) writeFileSync(d.path, d.content);

  console.error(`Wrote ${JSON.parse(catalog).length} tools  -> ${TOOL_CATALOG_PATH}`);
  console.error(`Wrote ${JSON.parse(learn).length} guides -> ${LEARN_RESOURCES_PATH}`);
  console.error(`Wrote ${routes.length} routes -> ${TOOL_ROUTES_PATH}`);
  console.error(`Wrote ${webDocs.length} web learn docs -> ${hubAgentLearningDir}`);
  if (skipped.length) {
    console.error(`\n${skipped.length} tool(s) without a clean single REST binding:`);
    for (const s of skipped) console.error(`  - ${s.name}: ${s.reason}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
