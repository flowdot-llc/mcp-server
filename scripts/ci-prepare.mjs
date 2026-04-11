#!/usr/bin/env node
/**
 * ci-prepare.mjs — CI version of the file: dep swap.
 *
 * mcp-server depends on @flowdot.ai/api via "file:../flowdot-api" for local
 * development. On CI, only the mcp-server repo is checked out — the sibling
 * flowdot-api directory doesn't exist — so `npm ci` would fail trying to
 * resolve the file: reference.
 *
 * This script is called by .github/workflows/ci.yml BEFORE `npm ci` runs.
 * It reads the latest published version of @flowdot.ai/api from npm, pins
 * the dep to it, and updates the lockfile. It does NOT restore the file:
 * reference afterward — CI runners are ephemeral, so no restore is needed
 * (unlike publish.mjs which must restore for local invocation safety).
 *
 * Usage: node scripts/ci-prepare.mjs
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PKG_PATH = path.resolve('package.json');

const SWAPS = [
  {
    field: 'dependencies',
    depName: '@flowdot.ai/api',
    fileRef: 'file:../flowdot-api',
  },
];

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function getLatestNpmVersion(pkgName) {
  const out = execSync(`npm view "${pkgName}" version`, { encoding: 'utf-8' }).trim();
  if (!/^\d+\.\d+\.\d+/.test(out)) {
    throw new Error(`unexpected npm view output for ${pkgName}: "${out}"`);
  }
  return out;
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
  for (const swap of SWAPS) {
    const current = pkg[swap.field]?.[swap.depName];
    if (current === undefined) {
      throw new Error(`Expected ${swap.field}.${swap.depName} to exist in package.json`);
    }
    const version = getLatestNpmVersion(swap.depName);
    const pinned = `^${version}`;
    pkg[swap.field][swap.depName] = pinned;
    console.log(`[ci-prepare] ${swap.depName}: ${current} -> ${pinned}`);
  }
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
  run('npm install --package-lock-only --ignore-scripts');
  console.log('[ci-prepare] OK');
}

main();
