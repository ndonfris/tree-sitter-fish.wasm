#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync, rmSync } = require('fs');
const { resolve } = require('path');

const UPSTREAM_REPO = 'https://github.com/ram02z/tree-sitter-fish.git';
const UPSTREAM_DIR = 'upstream-repo';

function exec(command, options = {}) {
  console.log(`\n🔧 ${command}`);
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options
    });
  } catch (error) {
    console.error(`\n❌ Command failed: ${command}`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const tag = args[0] || 'latest';

  console.log('🚀 Building tree-sitter-fish dependencies...');
  console.log(`📌 Target: ${tag === 'latest' ? 'Latest release' : tag}`);

  // Clean up existing upstream directory
  if (existsSync(UPSTREAM_DIR)) {
    console.log('\n🧹 Cleaning up existing upstream directory...');
    rmSync(UPSTREAM_DIR, { recursive: true, force: true });
  }

  // Clone upstream repo
  console.log(`\n📦 Cloning ${UPSTREAM_REPO}...`);
  exec(`git clone --depth 1 ${UPSTREAM_REPO} ${UPSTREAM_DIR}`);

  // Get the latest tag if needed
  let targetTag = tag;
  if (tag === 'latest') {
    console.log('\n🔍 Finding latest upstream release...');
    try {
      targetTag = execSync(
        'curl -s https://api.github.com/repos/ram02z/tree-sitter-fish/releases/latest | grep "tag_name" | cut -d\\" -f4',
        { encoding: 'utf-8' }
      ).trim();

      if (!targetTag) {
        throw new Error('Could not fetch latest tag');
      }

      console.log(`✅ Latest tag: ${targetTag}`);
    } catch (error) {
      console.error('❌ Failed to get latest tag, using main branch');
      targetTag = 'main';
    }
  }

  // Checkout the target tag/branch
  if (targetTag !== 'main') {
    console.log(`\n📍 Checking out ${targetTag}...`);
    exec(`git fetch --depth 1 origin tag ${targetTag}`, { cwd: UPSTREAM_DIR });
    exec(`git checkout ${targetTag}`, { cwd: UPSTREAM_DIR });
  }

  // Install dependencies
  console.log('\n📥 Installing upstream dependencies...');
  exec('npm install', { cwd: UPSTREAM_DIR });

  // Build WASM
  console.log('\n🏗️  Building WASM...');
  exec('npm run build:wasm', { cwd: UPSTREAM_DIR });

  // Copy WASM file
  console.log('\n📋 Copying tree-sitter-fish.wasm...');
  exec(`cp ${UPSTREAM_DIR}/tree-sitter-fish.wasm tree-sitter-fish.wasm`);

  // Copy queries directory
  console.log('\n📋 Copying queries/...');
  if (existsSync('queries')) {
    rmSync('queries', { recursive: true, force: true });
  }
  exec(`cp -r ${UPSTREAM_DIR}/queries queries`);

  // Clean up upstream directory
  console.log('\n🧹 Cleaning up...');
  rmSync(UPSTREAM_DIR, { recursive: true, force: true });

  console.log('\n✅ Dependencies built successfully!');
  console.log('\n📦 Files updated:');
  console.log('  - tree-sitter-fish.wasm');
  console.log('  - queries/');

  if (targetTag !== 'main') {
    console.log(`\n💡 Run 'yarn run set-version ${targetTag}' to update package.json version`);
  }
}

main().catch(error => {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
});
