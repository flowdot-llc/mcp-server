#!/usr/bin/env node
/**
 * verify-pack.mjs — hard gate that inspects `npm pack --dry-run --json`
 * and fails the publish if forbidden files appear in the tarball.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';

// Un-minified proprietary-engine tell-tales. The document engine glue is
// esbuild-INLINED + MINIFIED into the shipped bundle; if any of these appear in
// a shipped .js, minification regressed and the closed-source engine would ship
// human-readable.
//
// These are DECLARATION / COMMENT / SOURCE-PATH forms on purpose. Two bare
// identifier strings ('SIDEBAR_PANEL_X', 'P1_MAIN_RIGHT') were removed on
// 2026-08-22: the résumé geometry moved into an exported `DEFAULT_LAYOUT`
// object, so those names are now OBJECT PROPERTY KEYS, and esbuild never
// mangles property names (that needs `mangleProps`, which is unsafe here).
// They are also the parameter vocabulary of the published `create_document`
// `layout` override — an MCP client passes them BY NAME — so mangling them
// would silently break a shipped tool parameter. Surviving property names are
// irreducible in exactly the way bare literal coordinates already were, and are
// therefore not evidence of a minification regression. A genuine regression
// still shows up as a `const NAME =` declaration or a source comment/path,
// which is what these patterns match. Full rationale: PUBLISHING_GUIDE.md
// §"The un-minified-engine sentinel".
const PROPRIETARY_SENTINELS = [
  // A source comment or module path survived → not minified.
  /\/\/[^\n]*resume-layout/,
  /flowdot-documents\/(dist|src)\/authoring/,
  /decoded verbatim/,
  // Declaration forms: minification always renames a module-scope binding, so
  // seeing the real name on the left of a declaration means it did not run.
  /\b(?:const|let|var)\s+SIDEBAR_PANEL_X\b/,
  /\b(?:const|let|var)\s+P1_MAIN_RIGHT\b/,
  /\bfunction\s+layoutResume\b/,
];

const FORBIDDEN_PATTERNS = [
  { pattern: /\.ts$/, reason: 'TypeScript source', except: /\.d\.ts$/ },
  { pattern: /\.tsx$/, reason: 'TypeScript JSX source' },
  { pattern: /\.map$/, reason: 'Source map (leaks paths/content)' },
  { pattern: /(^|\/)src\//, reason: 'Source directory' },
  { pattern: /(^|\/)tsconfig.*\.json$/, reason: 'TypeScript build config' },
  { pattern: /(^|\/)vitest\.config\./, reason: 'Vitest config' },
  { pattern: /(^|\/)eslint\.config\./, reason: 'ESLint config' },
  { pattern: /(^|\/)\.eslintrc/, reason: 'Legacy ESLint config' },
  { pattern: /(^|\/)esbuild\.config\./, reason: 'esbuild config' },
  { pattern: /\.test\.(ts|tsx|js|jsx|mjs|cjs)$/, reason: 'Test file' },
  { pattern: /\.spec\.(ts|tsx|js|jsx|mjs|cjs)$/, reason: 'Spec file' },
  { pattern: /(^|\/)__tests__\//, reason: 'Test directory' },
  { pattern: /(^|\/)coverage\//, reason: 'Coverage output' },
  { pattern: /(^|\/)\.env($|\.)/, reason: 'Environment file (secrets)' },
  { pattern: /(^|\/)\.git\//, reason: 'Git metadata' },
  { pattern: /(^|\/)\.github\//, reason: 'GitHub metadata' },
  { pattern: /(^|\/)\.husky\//, reason: 'Husky hooks' },
  { pattern: /(^|\/)node_modules\//, reason: 'node_modules' },
  { pattern: /\.tsbuildinfo$/, reason: 'TypeScript incremental build info' },
];

const REQUIRED_FILES = ['LICENSE', 'README.md', 'package.json'];

function runNpmPackDryRun() {
  try {
    const output = execSync('npm pack --dry-run --json', {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
    });
    return JSON.parse(output);
  } catch (err) {
    console.error('[verify-pack] npm pack --dry-run failed:');
    console.error(err.stderr || err.message);
    process.exit(1);
  }
}

function main() {
  const result = runNpmPackDryRun();
  const packInfo = Array.isArray(result) ? result[0] : result;
  if (!packInfo || !Array.isArray(packInfo.files)) {
    console.error('[verify-pack] unexpected npm pack output (no files array)');
    process.exit(1);
  }

  const files = packInfo.files.map((f) => f.path);
  const violations = [];

  for (const file of files) {
    for (const rule of FORBIDDEN_PATTERNS) {
      if (rule.except && rule.except.test(file)) continue;
      if (rule.pattern.test(file)) {
        violations.push({ file, reason: rule.reason });
        break;
      }
    }
  }

  const missing = REQUIRED_FILES.filter((req) => !files.some((f) => f === req || f.endsWith(`/${req}`)));

  // Content sentinel: shipped .js must not contain un-minified proprietary-engine
  // source (identifiers / comments / source-path leaks).
  for (const file of files.filter((f) => f.endsWith('.js'))) {
    let text;
    try {
      text = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }
    for (const sentinel of PROPRIETARY_SENTINELS) {
      const hit = typeof sentinel === 'string' ? text.includes(sentinel) : sentinel.test(text);
      if (hit) {
        violations.push({ file, reason: `un-minified proprietary engine source (${sentinel}) — set minify:true` });
        break;
      }
    }
  }

  if (violations.length > 0 || missing.length > 0) {
    console.error('\n[verify-pack] FAILED — tarball does not meet publish standards\n');
    if (violations.length > 0) {
      console.error('Forbidden files in tarball:');
      for (const v of violations) {
        console.error(`  ✗ ${v.file}  (${v.reason})`);
      }
    }
    if (missing.length > 0) {
      console.error('\nRequired files missing from tarball:');
      for (const m of missing) {
        console.error(`  ✗ ${m}`);
      }
    }
    console.error(`\nPackage: ${packInfo.name}@${packInfo.version}`);
    console.error(`Total files: ${files.length}, tarball size: ${packInfo.size} bytes\n`);
    process.exit(1);
  }

  console.log(`[verify-pack] OK — ${packInfo.name}@${packInfo.version}`);
  console.log(`  files: ${files.length}`);
  console.log(`  size:  ${packInfo.size} bytes (unpacked: ${packInfo.unpackedSize})`);
  console.log(`  shasum: ${packInfo.shasum}`);
  console.log('\nFiles included:');
  for (const f of files.sort()) {
    console.log(`  ${f}`);
  }
}

main();
