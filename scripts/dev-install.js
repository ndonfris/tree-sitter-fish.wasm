#!/usr/bin/env node

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, readdirSync, statSync, existsSync } = require('fs');
const { resolve } = require('path');

function ensureFilesExist() {
  const execBuildDeps = () => {
    try {
      execSync('yarn install', { stdio: 'inherit' });
      execSync('yarn deps:build', { stdio: 'inherit' });
      execSync('yarn build', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to build dependencies:', error.message);
    }
  }

  const requiredFiles = ['package.json', 'yarn.lock', 'tree-sitter-fish.wasm', 'queries/highlights.scm'];
  let allExist = true;
  for (const file of requiredFiles) {
    if (!existsSync(resolve(file))) {
      console.log(`${file} is missing.`);
      allExist = false;
      break;
    }
  }
  if (!allExist) {
    console.log('Required files missing. Installing dependencies and building...');
    execBuildDeps();
  }
}


function updateVersionForDev() {
  const packagePath = resolve('package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));

  // Add timestamp to version to force cache invalidation
  const timestamp = Date.now();
  const baseVersion = pkg.version.split('-dev')[0]; // Remove any existing -dev suffix
  const newVersion = `${baseVersion}-dev.${timestamp}`;

  pkg.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');

  console.log(`Updated version to ${newVersion} for development`);
  return newVersion;
}

function main() {
  const command = process.argv[2];

  if (command === 'pack') {
    console.log(' Building and packing for development...');

    // Update version with timestamp
    const newVersion = updateVersionForDev();

    // Build and pack
    ensureFilesExist();
    execSync('yarn pack', { stdio: 'inherit' });

    console.log('\n  Development package created!');
    console.log(`📦 File: ndonfris-tree-sitter-fish-v${newVersion}.tgz`);
    console.log(`  Dev version ${newVersion} kept in package.json`);
    console.log('\n📋 To install in another project:');
    console.log(`   >_ cd /path/to/other/project`);
    console.log(`   >_ yarn remove @ndonfris/tree-sitter-fish  # Remove old version`);
    console.log(`   >_ yarn add file:/path/to/this/project/ndonfris-tree-sitter-fish-v${newVersion}.tgz`);
    console.log('  Or use the convenience script:');
    console.log(`   >_ yarn dev:install /path/to/other/project`)
  } else if (command === 'install') {
    const targetDir = process.argv[3];
    if (!targetDir) {
      console.error('Please provide target directory: yarn dev:install /path/to/project');
      process.exit(1);
    }

    // Find the most recent dev package
    const files = readdirSync('.');
    const devPackages = files.filter(f => f.startsWith('ndonfris-tree-sitter-fish-v') && f.endsWith('.tgz'));

    if (devPackages.length === 0) {
      console.error('No dev packages found. Run: yarn dev:pack first');
      process.exit(1);
    }

    // Sort by modification time to get the newest
    const newest = devPackages.sort((a, b) => {
      return statSync(b).mtime - statSync(a).mtime;
    })[0];

    const packagePath = resolve(newest);

    console.log(`Installing ${newest} to ${targetDir}...`);

    try {
      // Remove old version and install new one
      execSync(`cd "${targetDir}" && yarn remove @ndonfris/tree-sitter-fish`, { stdio: 'inherit' });
      execSync(`cd "${targetDir}" && yarn add "file:${packagePath}"`, { stdio: 'inherit' });

      console.log('\n✅ Package installed successfully!');
      console.log('\n✅ The package has a unique version to avoid caching issues.');

    } catch (error) {
      console.error('Failed to install package:', error.message);
      process.exit(1);
    }
  } else {
    console.log('Usage:');
    console.log('  >_ yarn dev:pack                     # Build and pack for development');
    console.log('  >_ yarn dev:install /path/to/project # Install latest dev package');
  }
}

main();
