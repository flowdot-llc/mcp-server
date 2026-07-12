/**
 * inline-engine.mjs — runs AFTER `tsc`. Bundles `@flowdot.ai/documents` (and its
 * ts-* / pdf-lib deps) into a single self-contained `dist/vendor/documents.js`,
 * then rewrites the one runtime import specifier (`@flowdot.ai/documents`) in the
 * compiled dist to that vendored file.
 *
 * Effect: the FlowDot document engine ships COMPILED INSIDE this package's dist —
 * it is never a published npm dependency and never a separate public package
 * (the CLI already inlines it the same way). `@flowdot.ai/documents` stays a
 * devDependency (types + bundling input for dev/build/tests); it is NOT a runtime
 * dependency of the published tarball. Modular dist is preserved so
 * scripts/emit-manifest.mjs (which imports dist/tools/index.js) still works.
 */
import { build } from "esbuild";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// The engine's package.json exposes only an `import` condition, so resolve it
// with the ESM resolver (createRequire's `require`-condition resolve fails).
const engineEntry = fileURLToPath(import.meta.resolve("@flowdot.ai/documents"));
const OUT = "dist/vendor/documents.js";

// Inline ONLY the proprietary flowdot-documents glue. The public companion libs
// (ts-*, pdf-lib — and their transitive deps incl. pdfjs-dist + its worker) stay
// EXTERNAL and are declared as normal npm dependencies of this package. This is
// what keeps read/inspect working: ts-pdf-edit resolves pdfjs-dist + its
// pdf.worker.mjs from real node_modules (bundling pdfjs breaks its worker with
// "Setting up fake worker failed"). It also keeps the vendored bundle tiny.
const EXTERNAL = ["ts-pptx", "ts-pdf-edit", "ts-docx", "ts-xlsx-edit", "pdf-lib"];
const external = EXTERNAL.flatMap((e) => [e, `${e}/*`]);

await build({
  entryPoints: [engineEntry],
  outfile: OUT,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  legalComments: "none",
  // minify: keep the proprietary engine glue (résumé layout constants, fidelity
  // spec, source-path comments) OUT of the readable published tarball — mirrors
  // the CLI's `minify: true`. verify-pack additionally sentinels for leaks.
  minify: true,
  external,
  logLevel: "warning",
});

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
  const src = await readFile(file, "utf8");
  if (!src.includes("@flowdot.ai/documents")) continue;
  let rel = relative(dirname(file), OUT).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  // Only rewrite real import/export `from '@flowdot.ai/documents'` clauses — never
  // the string occurrences inside the learn-resource markdown content.
  const next = src.replace(/(\bfrom\s*)(['"])@flowdot\.ai\/documents\2/g, `$1"${rel}"`);
  if (next !== src) {
    await writeFile(file, next);
    rewritten++;
  }
}
console.log(`inline-engine: bundled engine → ${OUT}; rewrote ${rewritten} dist import(s).`);
