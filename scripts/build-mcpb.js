#!/usr/bin/env node
/**
 * Build script for FlowDot MCPB (Desktop Extension) package
 *
 * Creates a .mcpb file that can be double-clicked to install in Claude Desktop
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, cpSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const mcpbDir = join(rootDir, 'mcpb');
const outputFile = join(rootDir, 'flowdot.mcpb');

console.log('Building FlowDot MCPB package...\n');

// Step 1: Build TypeScript
console.log('1. Building TypeScript...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  console.error('Failed to build TypeScript');
  process.exit(1);
}

// Step 2: Clean mcpb directory
console.log('\n2. Cleaning mcpb directory...');
if (existsSync(mcpbDir)) {
  rmSync(mcpbDir, { recursive: true });
}
mkdirSync(mcpbDir);
mkdirSync(join(mcpbDir, 'server'));

// Step 3: Copy files
console.log('3. Copying files...');

// Copy manifest.json from root
const manifestSrc = join(rootDir, 'manifest.json');
const manifestDest = join(mcpbDir, 'manifest.json');
if (existsSync(manifestSrc)) {
  cpSync(manifestSrc, manifestDest);
  console.log('   - manifest.json');
} else {
  console.error('   ERROR: manifest.json not found in package root');
  process.exit(1);
}

// Copy icon
const iconSrc = join(rootDir, 'icon.png');
if (existsSync(iconSrc)) {
  cpSync(iconSrc, join(mcpbDir, 'icon.png'));
  console.log('   - icon.png');
}

// Copy server files
console.log('   - server/dist/');
cpSync(join(rootDir, 'dist'), join(mcpbDir, 'server', 'dist'), { recursive: true });

console.log('   - server/bin/');
cpSync(join(rootDir, 'bin'), join(mcpbDir, 'server', 'bin'), { recursive: true });

console.log('   - server/node_modules/ (this may take a moment)');
cpSync(join(rootDir, 'node_modules'), join(mcpbDir, 'server', 'node_modules'), { recursive: true });

// Step 4: Create ZIP archive
console.log('\n4. Creating .mcpb package...');

// Remove old package if exists
if (existsSync(outputFile)) {
  rmSync(outputFile);
}

// Use PowerShell on Windows, zip on Unix
const isWindows = process.platform === 'win32';
if (isWindows) {
  const zipFile = join(rootDir, 'flowdot.zip');
  execSync(`powershell -Command "Compress-Archive -Path '${mcpbDir}\\*' -DestinationPath '${zipFile}' -Force"`, { stdio: 'inherit' });
  execSync(`powershell -Command "Rename-Item '${zipFile}' 'flowdot.mcpb'"`, { stdio: 'inherit' });
} else {
  execSync(`cd "${mcpbDir}" && zip -r "${outputFile}" .`, { stdio: 'inherit' });
}

// Step 5: Report results
console.log('\n5. Done!\n');

if (existsSync(outputFile)) {
  const stats = execSync(isWindows
    ? `powershell -Command "(Get-Item '${outputFile}').Length"`
    : `stat -f%z "${outputFile}"`
  ).toString().trim();
  const sizeMB = (parseInt(stats) / 1024 / 1024).toFixed(2);

  console.log(`   Package created: ${outputFile}`);
  console.log(`   Size: ${sizeMB} MB`);
  console.log('\n   To install: Double-click flowdot.mcpb or use Claude Desktop > Settings > Extensions');
} else {
  console.error('   ERROR: Package was not created');
  process.exit(1);
}
