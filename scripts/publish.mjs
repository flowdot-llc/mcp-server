#!/usr/bin/env node
/**
 * publish.mjs — atomic publish with file: dependency swap.
 *
 * mcp-server depends on @flowdot.ai/api via "file:../flowdot-api" for local
 * development. On publish, we must temporarily swap that reference to the
 * latest published version on npm, run the full gate via prepublishOnly,
 * then publish, then restore the file: reference. The restore runs in a
 * finally block so local state is never left broken, even on failure.
 *
 * Usage (local):   npm run publish:safe
 * Usage (CI):      called by .github/workflows/publish.yml on v* tag push
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const PKG_PATH = path.resolve('package.json');
const LOCK_PATH = path.resolve('package-lock.json');

const SWAPS = [
  {
    pkgField: 'dependencies',
    depName: '@flowdot.ai/api',
    fileRef: 'file:../flowdot-api',
  },
  {
    pkgField: 'dependencies',
    depName: '@flowdot.ai/guardian-agent',
    fileRef: 'file:../guardian-agent-ts',
  },
];

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function getLatestNpmVersion(pkgName) {
  try {
    const out = execSync(`npm view "${pkgName}" version`, { encoding: 'utf-8' }).trim();
    if (!/^\d+\.\d+\.\d+/.test(out)) {
      throw new Error(`unexpected npm view output: "${out}"`);
    }
    return out;
  } catch (err) {
    throw new Error(`Could not resolve latest version of ${pkgName}: ${err.message}`);
  }
}

function main() {
  // Snapshot original files for restore
  const originalPkgJson = fs.readFileSync(PKG_PATH, 'utf-8');
  const originalLock = fs.existsSync(LOCK_PATH) ? fs.readFileSync(LOCK_PATH, 'utf-8') : null;

  try {
    const pkg = JSON.parse(originalPkgJson);

    // Apply all swaps
    for (const swap of SWAPS) {
      const current = pkg[swap.pkgField]?.[swap.depName];
      if (current === undefined) {
        throw new Error(
          `Expected ${swap.pkgField}.${swap.depName} to exist in package.json`,
        );
      }
      if (current !== swap.fileRef) {
        console.warn(
          `[publish] warning: ${swap.depName} is "${current}", expected "${swap.fileRef}". Proceeding.`,
        );
      }
      const version = getLatestNpmVersion(swap.depName);
      const pinned = `^${version}`;
      pkg[swap.pkgField][swap.depName] = pinned;
      console.log(`[publish] ${swap.depName}: ${current} -> ${pinned}`);
    }

    // Write swapped package.json
    fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');

    // Update lockfile to match new pinned versions
    run('npm install --package-lock-only --ignore-scripts');

    // Run the full publish gate via prepublishOnly (invoked automatically by npm publish)
    // then publish. No --provenance because the repo is private (npm provenance
    // requires public source for sigstore transparency log).
    run('npm publish --access public');

    console.log('\n[publish] SUCCESS');
  } catch (err) {
    console.error(`\n[publish] FAILED: ${err.message}`);
    process.exitCode = 1;
  } finally {
    // Always restore, even on failure
    try {
      fs.writeFileSync(PKG_PATH, originalPkgJson);
      if (originalLock !== null) {
        fs.writeFileSync(LOCK_PATH, originalLock);
      }
      console.log('[publish] restored package.json and package-lock.json to file: references');
    } catch (restoreErr) {
      console.error(
        `\n[publish] CRITICAL: failed to restore package.json/lock: ${restoreErr.message}`,
      );
      console.error('[publish] your working tree may be in an inconsistent state — check git status.');
      process.exitCode = 2;
    }
  }
}

main();
