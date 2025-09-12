#! /usr/bin/env node

const path = require('path');
const fs = require('fs');
const process = require('process');
const { spawn } = require('child_process');

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
        reject(new Error(`Command failed with exit code ${code}: ${command}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// function _logger() {
//   return {
//     stdout: (msg) => process.stdout.write(`${msg}\n`),
//     stderr: (msg) => process.stderr.write(`${msg}\n`)
//   }
// }
const logger = {
  stdout: (msg) => process.stdout.write(`${msg}\n`),
  stderr: (msg) => process.stderr.write(`${msg}\n`)
}

/**
 * Path to the compiled tree-sitter-fish WebAssembly binary
 */
const wasmPath = path.join(__dirname, 'tree-sitter-fish.wasm');

/**
 * Raw WebAssembly binary data for tree-sitter-fish
 * @returns {Promise<Uint8Array>} The WASM binary data
 */
async function getWasm() {
  if (typeof window !== 'undefined' && window.fetch) {
    // Browser environment
    const response = await fetch(wasmPath);
    return response.arrayBuffer();
  } else {
    // Node.js environment
    const buffer = fs.readFileSync(wasmPath);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }
}

/**
 * Language name identifier
 */
const languageName = 'fish';

async function showPath() {
  process.stdout.write(wasmPath + '\n');
}

async function copyToTarget(targetPath) {
  const wasmData = await getWasm();
  fs.writeFileSync(targetPath, Buffer.from(wasmData));
}

async function buildWasm() {
  const builtWasmPath = path.join(__dirname, 'node_modules', 'tree-sitter-fish', 'tree-sitter-fish.wasm');
  const cloneDir = path.join(__dirname, 'node_modules', 'tree-sitter-fish');
  try {
    if (fs.existsSync(cloneDir)) {
      fs.rmSync(cloneDir, { recursive: true, force: true });
    }
    await spawnAsync('git clone https://github.com/ram02z/tree-sitter-fish node_modules/tree-sitter-fish', {
      cwd: __dirname
    });
    await spawnAsync('npm i', {
      cwd: path.join(__dirname, 'node_modules', 'tree-sitter-fish')
    });
    await spawnAsync('npm run build:wasm', {
      cwd: path.join(__dirname, 'node_modules', 'tree-sitter-fish')
    });
    if (fs.existsSync(wasmPath) && fs.existsSync(builtWasmPath)) {
      fs.rmSync(wasmPath);
    }
    fs.copyFileSync(builtWasmPath, wasmPath);
    if (!fs.existsSync(wasmPath)) {
      throw new Error('WASM file not found after build');
    }

    // Get and save the version info
    const packageJsonPath = path.join(__dirname, 'node_modules', 'tree-sitter-fish', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const version = packageJson.version || 'unknown';
      const versionFilePath = path.join(__dirname, 'last-version.txt');
      fs.writeFileSync(versionFilePath, `${version}\n`);
      logger.stdout(`Saved version info: ${version}`);
    }

    fs.rmSync(path.dirname(builtWasmPath), { recursive: true, force: true });
  } catch (error) {
    console.error('Error building WASM:', error);
    return false;
  }
  return true
}

function cleanup(shouldRemoveWasm) {
  const cloneDir = path.join(__dirname, 'node_modules', 'tree-sitter-fish');
  if (fs.existsSync(cloneDir)) {
    fs.rmSync(cloneDir, { recursive: true, force: true });
  }
  if (!shouldRemoveWasm && fs.existsSync(wasmPath)) {
    fs.rmSync(wasmPath);
  }
  if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
    fs.rmSync(path.join(__dirname, 'node_modules'), { recursive: true, force: true });
  }
}

function printHelp() {
  logger.stdout(`Usage: ./index.cjs [options]`);
  logger.stdout('       tree-sitter-fish.wasm [options]');
  logger.stdout('       node index.cjs [options]');
  logger.stdout('');
  logger.stdout('Options:');
  logger.stdout('  --path, -p            Show the path to the tree-sitter WASM file');
  logger.stdout('  --copy, -c            Copy the WASM file to the specified target path');
  logger.stdout('  --to, -t <target-path> Specify the target path for copying (required with --copy)');
  logger.stdout('  --build-wasm, -b      Build the WebAssembly binary from source');
  logger.stdout('  --clean, -C           Remove cloned repositories and built files');
  logger.stdout('  --help, -h            Show this help message');
  logger.stdout('');
  logger.stdout('Options can be combined when it makes sense:');
  logger.stdout('  --build-wasm --clean  Build WASM then cleanup');
  logger.stdout('  --build-wasm --copy --to <path>  Build then copy to target');
  logger.stdout('  --copy --to <path> --clean  Copy then cleanup');
  logger.stdout('');
  logger.stdout('Examples:');
  logger.stdout('  >_ node index.cjs --path');
  logger.stdout('  show the path of the wasm file');
  logger.stdout('');
  logger.stdout('  >_ node index.cjs --copy --to .');
  logger.stdout('  copy the wasm file to the current directory');
  logger.stdout('');
  logger.stdout('  >_ node index.cjs --build-wasm --clean');
  logger.stdout('  build the wasm file from source and clean up afterwards');
  logger.stdout('');
  logger.stdout('  >_ node index.cjs --build-wasm --copy --to ./dist --clean');
  logger.stdout('  build, copy to ./dist, then clean up');
  process.exit(0);
}

if (require.main === module) {
  const shouldCopy = process.argv.some((arg) => arg === '--copy' || arg === '-c');
  const shouldShowPath = process.argv.some((arg) => arg === '--path' || arg === '-p');
  const shouldTarget = process.argv.some((arg) => arg === '--to' || arg === '-t');
  const targetIndex = process.argv.findIndex((arg) => arg === '--to' || arg === '-t');
  const shouldBuildWasm = process.argv.some((arg) => arg === '--build-wasm' || arg === '-b');
  const shouldClean = process.argv.some((arg) => arg === '--clean' || arg === '-C');
  const hasHelpArg = process.argv.some((arg) => arg === '--help' || arg === '-h');

  // Handle help first - it overrides everything else
  if (hasHelpArg) {
    printHelp();
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
  if (!shouldCopy && !shouldShowPath && !shouldBuildWasm && !shouldClean) {
    printHelp();
    return;
  }

  // Execute actions in logical order: build -> copy -> show path -> clean
  async function executeActions() {
    try {
      // Step 1: Build WASM if requested
      if (shouldBuildWasm) {
        const success = await buildWasm();
        if (success) {
          logger.stdout('WASM build successful');
        } else {
          logger.stderr('WASM build failed');
          process.exit(1);
        }
      }

      // Step 2: Copy if requested
      if (shouldCopy && targetIndex !== -1) {
        const targetPath = process.argv[targetIndex + 1];
        await copyToTarget(targetPath);
        logger.stdout(`Copied to ${targetPath}`);
      }

      // Step 3: Show path if requested
      if (shouldShowPath) {
        await showPath();
      }

      // Step 4: Clean up if requested
      if (shouldClean) {
        cleanup(shouldBuildWasm || shouldCopy || shouldTarget);
        logger.stdout('Cleanup completed');
      }
    } catch (error) {
      logger.stderr(`Error: ${error.message}`);
      process.exit(1);
    }
  }

  executeActions();
}

module.exports = {
  wasmPath,
  getWasm,
  languageName
};

// ES Module compatibility
module.exports.default = getWasm;
