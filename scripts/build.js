#!/usr/bin/env node

const { build } = require('esbuild');
const { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, rmSync, copyFileSync, chmodSync } = require('fs');
const { resolve, join } = require('path');
const { execSync } = require('child_process');


async function buildPackage() {
  console.log('  Building standalone tree-sitter-fish package...');
  
  // Clean dist
  if (existsSync('dist')) {
    rmSync('dist', { recursive: true, force: true });
  }
  mkdirSync('dist', { recursive: true });

  // Verify required files exist
  const wasmPath = resolve('tree-sitter-fish.wasm');
  if (!existsSync(wasmPath)) {
    throw new Error('WASM file not found. Please ensure tree-sitter-fish.wasm exists in the root directory.');
  }

  const highlightsPath = resolve('queries/highlights.scm');
  if (!existsSync(highlightsPath)) {
    throw new Error('Highlights file not found. Please ensure queries/highlights.scm exists.');
  }

  // Build main ESM bundle
  await build({
    entryPoints: [resolve('src/index.ts')],
    bundle: true,
    platform: 'neutral',
    format: 'esm',
    outfile: resolve('dist/index.mjs'),
    minify: false, // Keep readable for debugging
    sourcemap: true,
    target: 'es2018',
    loader: {
      '.wasm': 'binary',
      '.scm': 'text',
    },
    banner: {
      js: '// @ndonfris/tree-sitter-fish - Standalone ESM bundle'
    }
  });

  // Build main CommonJS bundle
  await build({
    entryPoints: [resolve('src/index.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: resolve('dist/index.js'),
    minify: false,
    sourcemap: true,
    target: 'node18',
    loader: {
      '.wasm': 'binary',
      '.scm': 'text',
    },
    banner: {
      js: '// @ndonfris/tree-sitter-fish - Standalone CommonJS bundle'
    },
    footer: {
      js: 'module.exports = Object.assign(module.exports.default || {}, module.exports);'
    }
  });

// Build CLI
  await build({
    entryPoints: [resolve('src/cli.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: resolve('dist/cli.mjs'),
    minify: false,
    sourcemap: true,
    target: 'node14',
    loader: {
      '.wasm': 'binary',
      '.scm': 'text',
    },
    external: ['./index.mjs'], // Reference the main bundle
    banner: {
      js: '#!/usr/bin/env node\n// @ndonfris/tree-sitter-fish CLI'
    }
  });

  // Make CLI executable
  chmodSync(resolve('dist/cli.mjs'), 0o755);

  // Generate TypeScript declarations
  execSync('yarn build:types', { encoding: 'utf-8' });

  // writeFileSync(resolve('dist/index.d.ts'), dtsContent);
  // writeFileSync(resolve('dist/index.d.mts'), dtsContent);

  console.log('✅ Build complete! Generated files:');
  console.log('  📦 dist/index.js (CommonJS bundle)');
  console.log('  📦 dist/index.mjs (ESM bundle)');
  console.log('  📦 dist/cli.mjs (CLI tool)');
  console.log('  📦 dist/index.d.ts (TypeScript definitions)');
  console.log('  ✅ All assets embedded - no external dependencies!');
}

buildPackage().catch(console.error);
