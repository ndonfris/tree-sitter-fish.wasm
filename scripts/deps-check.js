#!/usr/bin/env node

const { execSync } = require('child_process');

function getUpstreamLatest() {
  try {
    const response = execSync(
      'curl -s https://api.github.com/repos/ram02z/tree-sitter-fish/releases/latest',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    const data = JSON.parse(response);
    return data.tag_name || null;
  } catch (error) {
    console.error('Failed to fetch upstream release');
    return null;
  }
}

// finds most recent local `git tag -l` entry (for dev releases)
function getLocalGitTaggedLatest() {
  try {
    const tag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    return tag || null;
  } catch (error) {
    return null;
  }
}

function getCurrentVersion() {
  try {
    const pkg = require('../package.json');
    return pkg.version;
  } catch (error) {
    return null;
  }
}

function main() {
  const command = process.argv[2];

  switch (command) {
    case 'upstream':
      const upstream = getUpstreamLatest();
      if (upstream) {
        console.log(upstream);
      } else {
        process.exit(1);
      }
      break;

    case 'local':
      const local = getLocalGitTaggedLatest();
      if (local) {
        console.log(local);
      } else {
        console.log('No tags found');
        process.exit(1);
      }
      break;

    case 'current':
      const current = getCurrentVersion();
      if (current) {
        console.log(current);
      } else {
        process.exit(1);
      }
      break;

    case 'compare':
      const upstreamVer = getUpstreamLatest();
      const currentVer = getCurrentVersion();

      if (!upstreamVer || !currentVer) {
        console.error('Could not fetch versions for comparison');
        process.exit(1);
      }

      console.log(`Current local version:   ${currentVer}`);
      console.log(`Upstream latest version: ${upstreamVer}`);
      console.log(`Released latest version: ${getLocalGitTaggedLatest() || 'N/A'}`);

      if (upstreamVer === currentVer || upstreamVer === `v${currentVer}`) {
        console.log('✅ Up to date');
      } else if (currentVer.startsWith(upstreamVer)) {
        console.log(`✅ Current dev release ahead of ${upstreamVer}`);
      } else {
        console.log('⚠️  Update available');
        process.exit(2); // Exit code 2 means update available
      }
      break;

    default:
      console.log('Usage: node scripts/deps-check.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  upstream   Get latest upstream release tag');
      console.log('  local      Get latest local git tag');
      console.log('  current    Get current package version');
      console.log('  compare    Compare current version with upstream');
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getUpstreamLatest, getLocalLatest: getLocalGitTaggedLatest, getCurrentVersion };
