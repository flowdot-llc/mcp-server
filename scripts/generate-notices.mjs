/**
 * generate-notices.mjs — emits THIRD-PARTY-NOTICES.md from esbuild metafiles.
 *
 * WHY THIS EXISTS
 * ---------------
 * The published CLI is a single minified bundle built with `legalComments: 'none'`,
 * which strips every copyright header from the 100+ third-party packages compiled
 * into it. MIT, ISC, BSD-3-Clause and Apache-2.0 all require the copyright notice
 * and licence text to be reproduced in BINARY distributions, not just source. Before
 * this script existed the tarball shipped none of them, under a LICENSE reading
 * "FlowDot Proprietary Software License ... All Rights Reserved".
 *
 * `legalComments: 'none'` is kept deliberately — inlining every licence header into a
 * minified bundle would bloat it and is not what the licences ask for. They ask that
 * the notices ACCOMPANY the distribution. A notices file in the tarball does that.
 *
 * HOW IT DERIVES THE LIST
 * -----------------------
 * From the esbuild METAFILE, not from package.json. package.json tells you what COULD
 * be bundled; the metafile tells you what actually WAS. Those differ sharply here,
 * because `cliExternalsPlugin` externalizes only ROOT dependencies — so `ink` and
 * `react` (root deps) are NOT bundled and travel with their own npm tarballs, while
 * `axios`, `chalk`, `zod` and friends (workspace deps) ARE bundled and would otherwise
 * go unattributed.
 *
 * Package ownership is resolved by walking UP from each input file to the nearest
 * package.json. Do NOT try to guess from a list of candidate node_modules roots: two
 * packages here (`layerr`, `ulidx`) resolve out of `guardian-agent-ts/node_modules`,
 * and a guessing approach silently reported them as licence "?".
 *
 * FAILS THE BUILD on any package whose licence cannot be determined. A missing notice
 * is a licence violation, so it must never degrade quietly.
 */
import { readFileSync, existsSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const LICENSE_FILE_RE = /^(LICENSE|LICENCE|COPYING|LICENSE\.md|LICENSE\.txt|LICENCE\.md|LICENCE\.txt)$/i;

/** Walk up from an input file to the package.json that owns it. */
function owningPackageDir(inputPath) {
  let dir = dirname(resolve(inputPath));
  for (let i = 0; i < 40; i++) {
    if (existsSync(join(dir, "package.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function readLicenseText(pkgDir) {
  let entries;
  try {
    entries = readdirSync(pkgDir, { withFileTypes: true });
  } catch {
    return null;
  }
  const f = entries.find((e) => e.isFile() && LICENSE_FILE_RE.test(e.name));
  if (!f) return null;
  try {
    return readFileSync(join(pkgDir, f.name), "utf8").trim();
  } catch {
    return null;
  }
}

function licenseId(manifest) {
  const l = manifest.license;
  if (typeof l === "string") return l;
  if (l && typeof l === "object" && l.type) return l.type;
  if (Array.isArray(manifest.licenses) && manifest.licenses[0]?.type) {
    return manifest.licenses.map((x) => x.type).join(" OR ");
  }
  return null;
}

/**
 * @param {object[]} metafiles  esbuild metafile objects
 * @param {object}   opts       { outFile, productName, ownScope }
 */
export function generateNotices(metafiles, { outFile, productName, ownScope = "@flowdot.ai/" }) {
  /** @type {Map<string, {name:string,version:string,license:string,text:string|null,dir:string}>} */
  const found = new Map();

  for (const mf of metafiles) {
    for (const inputPath of Object.keys(mf.inputs)) {
      if (!inputPath.replace(/\\/g, "/").includes("node_modules/")) continue;
      const dir = owningPackageDir(inputPath);
      if (!dir) continue;
      let manifest;
      try {
        manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
      } catch {
        continue;
      }
      // Nested files can resolve to a package.json without a name (some builds ship
      // stub manifests to flip "type"). Walk further up in that case.
      let pkgDir = dir;
      let m = manifest;
      let guard = 0;
      while ((!m.name || !m.version) && guard++ < 10) {
        const up = owningPackageDir(dirname(pkgDir));
        if (!up || up === pkgDir) break;
        pkgDir = up;
        try {
          m = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
        } catch {
          break;
        }
      }
      if (!m.name) continue;
      if (m.name.startsWith(ownScope)) continue; // first-party, covered by our own LICENSE
      const key = `${m.name}@${m.version ?? "0.0.0"}`;
      if (found.has(key)) continue;
      found.set(key, {
        name: m.name,
        version: m.version ?? "unknown",
        license: licenseId(m) ?? "UNKNOWN",
        text: readLicenseText(pkgDir),
        dir: pkgDir,
      });
    }
  }

  const pkgs = [...found.values()].sort((a, b) => a.name.localeCompare(b.name));

  // Hard gate. A package we cannot attribute is a licence violation, not a warning.
  const unknown = pkgs.filter((p) => p.license === "UNKNOWN" && !p.text);
  if (unknown.length) {
    console.error(
      `\n[generate-notices] FAILED: ${unknown.length} bundled package(s) have no resolvable licence:\n` +
        unknown.map((p) => `  - ${p.name}@${p.version}  (${p.dir})`).join("\n") +
        `\n\nEvery package compiled into the shipped bundle must be attributable.\n` +
        `Resolve the licence or remove the dependency. Do not bypass this check.\n`,
    );
    process.exit(1);
  }

  // Nothing third-party was compiled in. Do NOT emit an empty notices file: an
  // attribution document listing zero packages reads like an oversight. This is the
  // expected result for a bundle whose only third-party dependencies are declared
  // `external` and therefore install from npm with their own LICENSE files intact.
  // Keeping THIRD-PARTY-NOTICES.md in package.json `files[]` is still correct - npm
  // ignores absent entries, and the file appears automatically the day something
  // third-party does get bundled.
  if (pkgs.length === 0) {
    console.log(
      `generate-notices: 0 third-party packages compiled into ${productName} - ` +
        `no notices file needed (all third-party deps are external).`,
    );
    return 0;
  }

  const byLicense = new Map();
  for (const p of pkgs) byLicense.set(p.license, (byLicense.get(p.license) ?? 0) + 1);

  const lines = [];
  lines.push(`# Third-Party Notices for ${productName}`);
  lines.push("");
  lines.push(
    `${productName} is distributed as a compiled bundle. The following ${pkgs.length} ` +
      `open-source packages are compiled into it, and their licences require that these ` +
      `notices accompany the distribution.`,
  );
  lines.push("");
  lines.push(
    "FlowDot's own code remains subject to the `LICENSE` file distributed alongside this " +
      "one. Nothing here grants rights to FlowDot's proprietary code; equally, the " +
      "proprietary licence does not override the terms below, which govern the " +
      "third-party portions.",
  );
  lines.push("");
  lines.push("This file is GENERATED by `scripts/generate-notices.mjs` from the esbuild");
  lines.push("metafile at build time. Do not edit it by hand.");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Licence | Packages |");
  lines.push("|---|---|");
  for (const [l, n] of [...byLicense.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${l} | ${n} |`);
  }
  lines.push("");
  lines.push("## Packages");
  lines.push("");
  // ASCII only in the emitted list. This is a compliance document read by licence
  // scanners, package viewers and plain terminals; a non-ASCII dash renders as
  // mojibake anywhere the reader assumes CP1252 and adds nothing.
  for (const p of pkgs) lines.push(`- ${p.name}@${p.version} (${p.license})`);
  lines.push("");
  lines.push("## Full licence texts");
  lines.push("");
  for (const p of pkgs) {
    lines.push(`### ${p.name}@${p.version}`);
    lines.push("");
    lines.push(`SPDX: ${p.license}`);
    lines.push("");
    if (p.text) {
      lines.push("```");
      lines.push(p.text);
      lines.push("```");
    } else {
      lines.push(
        `_This package ships no licence file. It declares \`${p.license}\`; the standard ` +
          `text of that licence applies._`,
      );
    }
    lines.push("");
  }

  writeFileSync(outFile, lines.join("\n"));
  console.log(
    `generate-notices: ${pkgs.length} third-party packages -> ${outFile} ` +
      `(${[...byLicense.entries()].map(([l, n]) => `${l}:${n}`).join(", ")})`,
  );
  return pkgs.length;
}
