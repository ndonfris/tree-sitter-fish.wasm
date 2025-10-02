#!/usr/bin/env node

const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

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

function restoreVersion() {
  try {
    // Get the original version from git
    const originalVersion = execSync('git show HEAD:package.json', { encoding: 'utf8' });
    const originalPkg = JSON.parse(originalVersion);
    
    const packagePath = resolve('package.json');
    const currentPkg = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    currentPkg.version = originalPkg.version;
    writeFileSync(packagePath, JSON.stringify(currentPkg, null, 2) + '\n');
    
    console.log(`Restored version to ${originalPkg.version}`);
  } catch (error) {
    console.warn('Could not restore original version from git');
  }
}

function main() {
  const command = process.argv[2];
  
  if (command === 'pack') {
    console.log('Building and packing for development...');
    
    // Update version with timestamp
    const newVersion = updateVersionForDev();
    
    try {
      // Build and pack
      execSync('yarn build', { stdio: 'inherit' });
      execSync('yarn pack', { stdio: 'inherit' });
      
      console.log('\\n🎉 Development package created!');
      console.log(`📦 File: ndonfris-tree-sitter-fish-v${newVersion}.tgz`);
      console.log('\\n📋 To install in another project:');
      console.log(`   cd /path/to/other/project`);
      console.log(`   yarn remove @ndonfris/tree-sitter-fish  # Remove old version`);
      console.log(`   yarn add file:/path/to/this/project/ndonfris-tree-sitter-fish-v${newVersion}.tgz`);
      console.log('\\n💡 Or use the convenience script:');
      console.log(`   yarn dev:install /path/to/other/project`);
      
    } finally {
      // Always restore the original version
      restoreVersion();
    }
  } else if (command === 'install') {
    const targetDir = process.argv[3];
    if (!targetDir) {
      console.error('Please provide target directory: yarn dev:install /path/to/project');
      process.exit(1);
    }
    
    // Find the most recent dev package
    const { readdirSync } = require('fs');
    const files = readdirSync('.');
    const devPackages = files.filter(f => f.startsWith('ndonfris-tree-sitter-fish-v') && f.endsWith('.tgz'));
    
    if (devPackages.length === 0) {
      console.error('No dev packages found. Run: yarn dev:pack first');
      process.exit(1);
    }
    
    // Sort by modification time to get the newest
    const newest = devPackages.sort((a, b) => {
      const { statSync } = require('fs');
      return statSync(b).mtime - statSync(a).mtime;
    })[0];
    
    const packagePath = resolve(newest);
    
    console.log(`Installing ${newest} to ${targetDir}...`);
    
    try {
      // Remove old version and install new one
      execSync(`cd "${targetDir}" && yarn remove @ndonfris/tree-sitter-fish`, { stdio: 'inherit' });
      execSync(`cd "${targetDir}" && yarn add "file:${packagePath}"`, { stdio: 'inherit' });
      
      console.log('\\n✅ Package installed successfully!');
      console.log('\\n🔄 The package has a unique version to avoid caching issues.');
      
    } catch (error) {
      console.error('Failed to install package:', error.message);
      process.exit(1);
    }
  } else {
    console.log('Usage:');
    console.log('  yarn dev:pack                    # Build and pack for development');
    console.log('  yarn dev:install /path/to/project # Install latest dev package');
  }
}

main();