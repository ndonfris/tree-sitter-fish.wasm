// Tree-sitter Fish WebAssembly Grammar Package
// All assets embedded - no external dependencies

import EMBEDDED_WASM from '../tree-sitter-fish.wasm';
import EMBEDDED_HIGHLIGHTS from '../queries/highlights.scm';
import pkg from '../package.json';

/**
 * Language name identifier
 */
export const languageName = 'fish' as const;

/**
 * Embedded Wasm Buffer
 */
export const wasmBuffer: Uint8Array = Buffer.from(EMBEDDED_WASM, 'base64');

/**
 * Package version
 */
export const version: string = pkg.version;

/**
 * Highlights query content
 */
export const highlights: string = EMBEDDED_HIGHLIGHTS;


/**
 * Default export - the WASM binary as Uint8Array
 * Use with tree-sitter or web-tree-sitter
 */
const fishLanguage = wasmBuffer;
export default fishLanguage;

// ============================================================================
// CLI functionality
// ============================================================================

import { writeFileSync } from 'fs';

const logger = {
  stdout: (msg: string) => process.stdout.write(`${msg}\n`),
  stderr: (msg: string) => process.stderr.write(`${msg}\n`)
};

function showPath(): void {
  process.stdout.write("embedded://tree-sitter-fish.wasm\n");
}

function copyToTarget(targetPath: string): void {
  writeFileSync(targetPath, fishLanguage);
}

function printHelp(): void {
  logger.stdout(`Usage: tree-sitter.fish.wasm [options]`);
  logger.stdout('');
  logger.stdout('Options:');
  logger.stdout('  --path, -p            Show the path to the embedded WASM (embedded://tree-sitter-fish.wasm)');
  logger.stdout('  --copy, -c            Extract and copy the WASM file to the specified target path');
  logger.stdout('  --to, -t <target-path> Specify the target path for copying (required with --copy)');
  logger.stdout('  --version, -v         Show package version');
  logger.stdout('  --help, -h            Show this help message');
  logger.stdout('');
  logger.stdout('Examples:');
  logger.stdout('  npx tree-sitter.fish.wasm --path');
  logger.stdout('  npx tree-sitter.fish.wasm --copy --to ./tree-sitter-fish.wasm');
  logger.stdout('  npx tree-sitter.fish.wasm --version');
  process.exit(0);
}

function main(): void {
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
    logger.stdout(`v${version}`);
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
      copyToTarget(targetPath);
      logger.stdout(`Extracted WASM to ${targetPath}`);
    }

    // Show path if requested
    if (shouldShowPath) {
      showPath();
    }
  } catch (error) {
    logger.stderr(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run CLI if this module is executed directly
// Only run CLI when:
// 1. Not imported as a dependency (check if we're in node_modules)
// 2. Module is executed directly (not imported)
function isMainModule(): boolean {
  // Don't run CLI if we're inside node_modules
  // For CommonJS, use __filename; for ESM, we'll rely on the module check
  if (typeof __filename !== 'undefined' && __filename.includes('node_modules')) {
    return false;
  }
  
  // For ESM, check if current file URL contains node_modules
  // Use try-catch to avoid issues in different environments
  try {
    // Only access import.meta in ES module context
    if (typeof module === 'undefined') {
      // We're likely in an ES module
      const currentUrl = new Error().stack?.split('\n')[1];
      if (currentUrl && currentUrl.includes('node_modules')) {
        return false;
      }
    }
  } catch {
    // Ignore errors
  }
  
  // CommonJS check
  if (typeof require !== 'undefined' && typeof module !== 'undefined') {
    return require.main === module;
  }
  
  // For ES modules, we need a different approach since we can't use import.meta directly
  // Check if we're the main module by comparing process.argv[1]
  if (typeof module === 'undefined' && process.argv[1]) {
    // In ES modules, if we got this far, assume we're the main module
    // unless we detected node_modules above
    return true;
  }
  
  return false;
}

if (isMainModule()) {
  main();
}
