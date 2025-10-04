// CLI Entry Point - Import the main package functions
import fishLanguage, { version } from './index.js';
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
// This works for both npx and direct bin execution
const isMainModule = process.argv[1] && (
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1])
);

if (isMainModule) {
  main();
}
