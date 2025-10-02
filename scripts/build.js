#!/usr/bin/env node

const { build } = require('esbuild');
const { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, copyFileSync } = require('fs');
const { resolve, join } = require('path');

async function buildPackage() {
  console.log('🚀 Building standalone tree-sitter-fish package...');
  
  // Clean dist
  if (existsSync('dist')) {
    rmSync('dist', { recursive: true, force: true });
  }
  mkdirSync('dist', { recursive: true });

  // Copy WASM and queries for the build process
  if (existsSync('tree-sitter-fish.wasm')) {
    copyFileSync('tree-sitter-fish.wasm', 'dist/tree-sitter-fish.wasm');
  }
  
  if (existsSync('queries')) {
    mkdirSync('dist/queries', { recursive: true });
    const files = require('fs').readdirSync('queries');
    for (const file of files) {
      copyFileSync(join('queries', file), join('dist/queries', file));
    }
  }

  // Read WASM file as base64
  const wasmPath = resolve('tree-sitter-fish.wasm');
  if (!existsSync(wasmPath)) {
    throw new Error('WASM file not found. Please ensure tree-sitter-fish.wasm exists in the root directory.');
  }
  
  const wasmBuffer = readFileSync(wasmPath);
  const wasmBase64 = wasmBuffer.toString('base64');
  
  // Read highlights file
  const highlightsPath = resolve('queries/highlights.scm');
  const highlightsContent = existsSync(highlightsPath) 
    ? readFileSync(highlightsPath, 'utf8')
    : '';

  // Create the main entry point with embedded assets
  const mainEntry = `
// Tree-sitter Fish WebAssembly Grammar Package
// All assets embedded - no external dependencies

// Embedded WASM as base64
const EMBEDDED_WASM = '${wasmBase64}';

// Embedded highlights content
const EMBEDDED_HIGHLIGHTS = \`${highlightsContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;

/**
 * Language name identifier
 */
export const languageName = 'fish';

/**
 * Package version
 */
export const version = '${require('../package.json').version}';

/**
 * Get the content of the highlights.scm file
 */
export function getHighlightsContent() {
  return EMBEDDED_HIGHLIGHTS;
}

/**
 * Raw WebAssembly binary data for tree-sitter-fish
 */
export async function getWasm() {
  // Convert base64 back to ArrayBuffer
  const binaryString = typeof atob !== 'undefined' 
    ? atob(EMBEDDED_WASM)
    : Buffer.from(EMBEDDED_WASM, 'base64').toString('binary');
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Get WASM as Uint8Array for tree-sitter
 */
export async function getWasmUint8Array() {
  const buffer = await getWasm();
  return new Uint8Array(buffer);
}

/**
 * Highlights object containing content
 */
export const highlights = {
  get path() {
    return 'embedded://highlights.scm';
  },
  get text() {
    return EMBEDDED_HIGHLIGHTS;
  }
};

/**
 * For compatibility - these point to embedded resources
 */
export const wasmPath = 'embedded://tree-sitter-fish.wasm';
export const highlightsPath = 'embedded://highlights.scm';

/**
 * Default export function for tree-sitter compatibility
 */
export default async function fishLanguage() {
  return getWasmUint8Array();
}

// Node.js compatibility
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  // In Node.js, provide atob if not available
  if (typeof atob === 'undefined') {
    global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
  }
}
`;

  // Create CLI entry point
  const cliEntry = `
// CLI Entry Point - Import the main package functions
import { getWasm, wasmPath, languageName, highlights, version } from './index.mjs';
import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, rmSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Execute command using spawn for better CLI output visibility
 */
function spawnAsync(command, options = {}) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(\`Command failed with exit code \${code}: \${command}\`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

const logger = {
  stdout: (msg) => process.stdout.write(\`\${msg}\\n\`),
  stderr: (msg) => process.stderr.write(\`\${msg}\\n\`)
};

async function showPath() {
  process.stdout.write(wasmPath + "\\n");
}

async function copyToTarget(targetPath) {
  const wasmData = await getWasm();
  writeFileSync(targetPath, Buffer.from(wasmData));
}

function printHelp() {
  logger.stdout(\`Usage: tree-sitter-fish.wasm [options]\`);
  logger.stdout('');
  logger.stdout('Options:');
  logger.stdout('  --path, -p            Show the path to the embedded WASM (embedded://tree-sitter-fish.wasm)');
  logger.stdout('  --copy, -c            Extract and copy the WASM file to the specified target path');
  logger.stdout('  --to, -t <target-path> Specify the target path for copying (required with --copy)');
  logger.stdout('  --version, -v         Show package version');
  logger.stdout('  --help, -h            Show this help message');
  logger.stdout('');
  logger.stdout('Examples:');
  logger.stdout('  npx tree-sitter-fish.wasm --path');
  logger.stdout('  npx tree-sitter-fish.wasm --copy --to ./tree-sitter-fish.wasm');
  logger.stdout('  npx tree-sitter-fish.wasm --version');
  process.exit(0);
}

async function main() {
  const shouldCopy = process.argv.some((arg) => arg === '--copy' || arg === '-c');
  const shouldShowPath = process.argv.some((arg) => arg === '--path' || arg === '-p');
  const shouldShowVersion = process.argv.some((arg) => arg === '--version' || arg === '-v');
  const shouldTarget = process.argv.some((arg) => arg === '--to' || arg === '-t');
  const targetIndex = process.argv.findIndex((arg) => arg === '--to' || arg === '-t');
  const hasHelpArg = process.argv.some((arg) => arg === '--help' || arg === '-h');

  // Handle help first
  if (hasHelpArg) {
    printHelp();
    return;
  }

  // Handle version
  if (shouldShowVersion) {
    logger.stdout(\`v\${version}\`);
    return;
  }

  // Validate argument combinations
  if (shouldTarget && !shouldCopy) {
    logger.stderr('Error: --to requires --copy');
    process.exit(1);
  }

  if (shouldCopy && targetIndex !== -1 && process.argv.length <= targetIndex + 1) {
    logger.stderr('Error: --copy requires a target path with --to');
    process.exit(1);
  }

  // If no arguments provided, show help
  if (!shouldCopy && !shouldShowPath && !shouldShowVersion) {
    printHelp();
    return;
  }

  try {
    // Copy if requested
    if (shouldCopy && targetIndex !== -1) {
      const targetPath = process.argv[targetIndex + 1];
      await copyToTarget(targetPath);
      logger.stdout(\`Extracted WASM to \${targetPath}\`);
    }

    // Show path if requested
    if (shouldShowPath) {
      await showPath();
    }
  } catch (error) {
    logger.stderr(\`Error: \${error.message}\`);
    process.exit(1);
  }
}

// Run CLI if this module is executed directly
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  main().catch(console.error);
}
`;

  // Write entry files
  writeFileSync(resolve('dist/main-entry.js'), mainEntry);
  writeFileSync(resolve('dist/cli-entry.js'), cliEntry);

  // Build main ESM bundle
  await build({
    entryPoints: [resolve('dist/main-entry.js')],
    bundle: true,
    platform: 'neutral',
    format: 'esm',
    outfile: resolve('dist/index.mjs'),
    minify: false, // Keep readable for debugging
    sourcemap: true,
    target: 'es2018',
    banner: {
      js: '// @ndonfris/tree-sitter-fish - Standalone ESM bundle'
    }
  });

  // Build main CommonJS bundle
  await build({
    entryPoints: [resolve('dist/main-entry.js')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: resolve('dist/index.js'),
    minify: false,
    sourcemap: true,
    target: 'node14',
    banner: {
      js: '// @ndonfris/tree-sitter-fish - Standalone CommonJS bundle'
    }
  });

  // Build CLI
  await build({
    entryPoints: [resolve('dist/cli-entry.js')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: resolve('dist/cli.mjs'),
    minify: false,
    sourcemap: true,
    target: 'node14',
    external: ['./index.mjs'], // Reference the main bundle
    banner: {
      js: '#!/usr/bin/env node\n// @ndonfris/tree-sitter-fish CLI'
    }
  });

  // Generate TypeScript declarations
  const dtsContent = `/**
 * Tree-sitter grammar for Fish shell with WebAssembly support
 * All assets are embedded in the bundle - no external files needed
 */

export interface HighlightsInfo {
  /** Path identifier for embedded highlights */
  readonly path: string;
  /** Raw string content of the highlights.scm file */
  readonly text: string;
}

/**
 * Language name identifier
 */
export declare const languageName: 'fish';

/**
 * Package version
 */
export declare const version: string;

/**
 * Path identifier for embedded WASM (embedded://tree-sitter-fish.wasm)
 */
export declare const wasmPath: string;

/**
 * Path identifier for embedded highlights (embedded://highlights.scm)
 */
export declare const highlightsPath: string;

/**
 * Get the content of the highlights.scm file
 */
export declare function getHighlightsContent(): string;

/**
 * Raw WebAssembly binary data for tree-sitter-fish
 */
export declare function getWasm(): Promise<ArrayBuffer>;

/**
 * Get WASM as Uint8Array for tree-sitter
 */
export declare function getWasmUint8Array(): Promise<Uint8Array>;

/**
 * Highlights object containing embedded content
 */
export declare const highlights: HighlightsInfo;

/**
 * Default export function for tree-sitter compatibility
 * @returns Promise resolving to the WASM binary as Uint8Array
 */
export default function fishLanguage(): Promise<Uint8Array>;
`;

  writeFileSync(resolve('dist/index.d.ts'), dtsContent);
  writeFileSync(resolve('dist/index.d.mts'), dtsContent);

  // Clean up temporary files
  rmSync(resolve('dist/main-entry.js'));
  rmSync(resolve('dist/cli-entry.js'));
  if (existsSync('dist/tree-sitter-fish.wasm')) {
    rmSync('dist/tree-sitter-fish.wasm');
  }
  if (existsSync('dist/queries')) {
    rmSync('dist/queries', { recursive: true });
  }

  console.log('✅ Build complete! Generated files:');
  console.log('  📦 dist/index.js (CommonJS bundle)');
  console.log('  📦 dist/index.mjs (ESM bundle)');
  console.log('  🔧 dist/cli.mjs (CLI tool)');
  console.log('  📝 dist/index.d.ts (TypeScript definitions)');
  console.log('  🎯 All assets embedded - no external dependencies!');
}

buildPackage().catch(console.error);