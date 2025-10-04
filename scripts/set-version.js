#!/usr/bin/env node

const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');
const { execSync } = require('child_process');

function setVersion(version, isDev = false, updateLastVersion = false, createGitTag = false) {
  const pkgPath = resolve(__dirname, '../package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

  let newVersion = version;

  // Remove 'v' prefix if present
  if (newVersion.startsWith('v')) {
    newVersion = newVersion.slice(1);
  }

  // If dev flag is set, append dev timestamp
  if (isDev) {
    const timestamp = Date.now();
    newVersion = `${newVersion}-dev.${timestamp}`;
  }

  const oldVersion = pkg.version;
  pkg.version = newVersion;

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  console.log(`✅ Version updated: ${oldVersion} → ${newVersion}`);

  // Update last-version.txt if requested and not a dev version
  if (updateLastVersion && !isDev) {
    const lastVersionPath = resolve(__dirname, '../last-version.txt');
    writeFileSync(lastVersionPath, newVersion + '\n');
    console.log(`✅ Updated last-version.txt: ${newVersion}`);
  }

  // Create git tag if requested
  if (createGitTag) {
    try {
      execSync(`git tag ${newVersion}`, { stdio: 'inherit' });
      console.log(`✅ Created git tag: ${newVersion}`);
    } catch (error) {
      console.error(`❌ Failed to create git tag: ${error.message}`);
      process.exit(1);
    }
  }

  return newVersion;
}

function main() {
  const args = process.argv.slice(2);

  const isDev = args.includes('--dev') || args.includes('-d');
  const updateLastVersion = args.includes('--update-last-version') || args.includes('-u');
  const saveCurrentVersion = args.includes('--save-current') || args.includes('-s');
  const createGitTag = args.includes('--git-tag') || args.includes('-g');

  // Handle --save-current flag to update last-version.txt from package.json
  if (saveCurrentVersion) {
    const pkgPath = resolve(__dirname, '../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const lastVersionPath = resolve(__dirname, '../last-version.txt');

    // Remove -dev suffix if present
    const cleanVersion = pkg.version.split('-dev')[0];

    writeFileSync(lastVersionPath, cleanVersion + '\n');
    console.log(`✅ Updated last-version.txt with current package version: ${cleanVersion}`);
    return;
  }

  // Get version from args or last-version.txt if --dev is used without a version
  let version = args.find(arg => !arg.startsWith('-'));

  // Remove leading 'v' if present
  if (version && version.startsWith('v')) {
    version = version.slice(1);
  }

  if (!version && isDev) {
    // Read from last-version.txt when using --dev without version argument
    const lastVersionPath = resolve(__dirname, '../last-version.txt');
    try {
      version = readFileSync(lastVersionPath, 'utf8').trim();
      console.log(`📖 Using version from last-version.txt: ${version}`);
    } catch (error) {
      console.error('❌ Could not read last-version.txt and no version provided');
      process.exit(1);
    }
  }

  if (!version) {
    console.error('Usage: node set-version.js <version> [--dev] [--update-last-version] [--save-current] [--git-tag]');
    console.error('\nExamples:');
    console.error('  node set-version.js 3.6.0');
    console.error('  node set-version.js v3.6.0                         # Leading v is automatically stripped');
    console.error('  node set-version.js 3.6.0 --dev                    # Creates 3.6.0-dev.1234567890');
    console.error('  node set-version.js --dev                          # Uses last-version.txt with -dev suffix');
    console.error('  node set-version.js 3.6.0 --update-last-version    # Also updates last-version.txt');
    console.error('  node set-version.js 3.6.0 --git-tag                # Creates git tag v3.6.0');
    console.error('  node set-version.js --save-current                 # Updates last-version.txt from package.json');
    console.error('  node set-version.js 3.6.0 --dev --update-last-version  # Dev version, no last-version.txt update');
    process.exit(1);
  }

  setVersion(version, isDev, updateLastVersion, createGitTag);
}

if (require.main === module) {
  main();
}

module.exports = { setVersion };
