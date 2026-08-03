/**
 * inline-engine.mjs — runs AFTER `tsc`. Bundles the private FlowDot workspace
 * libraries into self-contained files under `dist/vendor/`, then rewrites their
 * runtime import specifiers in the compiled dist to the vendored files.
 *
 * The engines inlined here:
 *   1. `@flowdot.ai/documents` → `dist/vendor/documents.js` (ts-* / pdf-lib stay EXTERNAL).
 *   2. `@flowdot.ai/browser-driver` → `dist/vendor/browser-driver.js`
 *      (`playwright` / `playwright-core` stay EXTERNAL — they are optional runtime
 *      deps, loaded lazily; bundling native browser drivers is impossible).
 *   3. `@flowdot.ai/cli-qa-engine` → `dist/vendor/cli-qa-engine.js`.
 *   4. `@flowdot.ai/platform-learn` → `dist/vendor/platform-learn.js`.
 *   5. `@flowdot.ai/api` → `dist/vendor/api.js`.
 *
 * Effect: both engines ship COMPILED INSIDE this package's dist — never published
 * npm dependencies, never separate public packages. They stay devDependencies
 * (types + bundling input for dev/build/tests); NOT runtime deps of the tarball.
 * Modular dist is preserved so scripts/emit-manifest.mjs still works.
 */
import { build } from "esbuild";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/** Bundle one workspace engine into dist/vendor and return its out path. */
async function bundleEngine(specifier, outFile, externalPkgs) {
  const entry = fileURLToPath(import.meta.resolve(specifier));
  const external = externalPkgs.flatMap((e) => [e, `${e}/*`]);
  await build({
    entryPoints: [entry],
    outfile: outFile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    legalComments: "none",
    minify: true,
    external,
    logLevel: "warning",
  });
  return outFile;
}

const DOCUMENTS_OUT = await bundleEngine(
  "@flowdot.ai/documents",
  "dist/vendor/documents.js",
  // Public companion libs (+ their pdfjs worker) resolve from real node_modules.
  ["ts-pptx", "ts-pdf-edit", "ts-docx", "ts-xlsx-edit", "pdf-lib"],
);

const BROWSER_OUT = await bundleEngine(
  "@flowdot.ai/browser-driver",
  "dist/vendor/browser-driver.js",
  // Playwright is an optional runtime dep, lazily loaded via a dynamic import.
  ["playwright", "playwright-core"],
);

const CLI_QA_OUT = await bundleEngine(
  "@flowdot.ai/cli-qa-engine",
  "dist/vendor/cli-qa-engine.js",
  // `ws` stays a real runtime dep; node-pty is INJECTED from the launch CWD and is
  // never imported by the engine (TERMINAL_EYES.md Part E).
  ["ws"],
);

const LEARN_OUT = await bundleEngine(
  // The shared tool-learning source (taxonomy + concise prose). Pure data + light
  // logic, no external deps → vendored whole so the published tarball carries it.
  "@flowdot.ai/platform-learn",
  "dist/vendor/platform-learn.js",
  [],
);

const API_OUT = await bundleEngine(
  // The Hub REST client + every wire type. It WAS published as @flowdot.ai/api
  // and shipped readable `tsc` output — 1,354 legible lines plus a .d.ts
  // exposing 228 method signatures and 224 types, i.e. the whole private Hub
  // contract, downloadable by anyone. It is proprietary and has no external
  // consumers, so it is now `private: true` and vendored here like the rest.
  // Zero runtime deps of its own (it uses global `fetch`), so nothing is external.
  "@flowdot.ai/api",
  "dist/vendor/api.js",
  [],
);

// Map each runtime import specifier → its vendored bundle.
const REWRITES = [
  { specifier: "@flowdot.ai/documents", out: DOCUMENTS_OUT },
  { specifier: "@flowdot.ai/browser-driver", out: BROWSER_OUT },
  { specifier: "@flowdot.ai/cli-qa-engine", out: CLI_QA_OUT },
  { specifier: "@flowdot.ai/platform-learn", out: LEARN_OUT },
  { specifier: "@flowdot.ai/api", out: API_OUT },
];

async function walkJs(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkJs(p)));
    else if (e.name.endsWith(".js")) out.push(p);
  }
  return out;
}

let rewritten = 0;
for (const file of await walkJs("dist")) {
  if (file.replace(/\\/g, "/").includes("dist/vendor/")) continue;
  let src = await readFile(file, "utf8");
  let changed = false;
  for (const { specifier, out } of REWRITES) {
    if (!src.includes(specifier)) continue;
    let rel = relative(dirname(file), out).replace(/\\/g, "/");
    if (!rel.startsWith(".")) rel = `./${rel}`;
    // Only rewrite real `from '<specifier>'` import/export clauses — never string
    // occurrences inside learn-resource markdown content.
    const re = new RegExp(`(\\bfrom\\s*)(['"])${specifier.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}\\2`, "g");
    const next = src.replace(re, `$1"${rel}"`);
    if (next !== src) {
      src = next;
      changed = true;
    }
  }
  if (changed) {
    await writeFile(file, src);
    rewritten++;
  }
}
console.log(`inline-engine: bundled engines → dist/vendor/; rewrote ${rewritten} dist file(s).`);
