# @ndonfris/tree-sitter-fish

A [WebAssembly](https://webassembly.org/) build of [tree-sitter-fish](https://github.com/ram02z/tree-sitter-fish) grammar for parsing [fish shell](https://fishshell.com/) syntax in web browsers and Node.js environments.

This is a **library-only package** with all assets embedded - no external WASM or query files needed! Perfect for bundlers and applications that need fish shell parsing capabilities.

Inspired by [@esdmr/tree-sitter-fish](https://github.com/esdmr/tree-sitter-fish) for providing WASM builds.

## Installation

```bash
npm install @ndonfris/tree-sitter-fish web-tree-sitter
# or
yarn add @ndonfris/tree-sitter-fish web-tree-sitter
```

> **Note**: `web-tree-sitter` is required as a peer dependency for parsing functionality.

## Usage

### Basic usage with web-tree-sitter

```typescript
import Parser from 'web-tree-sitter';
import fishLanguage from '@ndonfris/tree-sitter-fish';

async function parseFishCode(): Promise<void> {
  await Parser.init();
  const parser = new Parser();

  // Load the WASM grammar using the default export (Uint8Array)
  const Language = await Parser.Language.load(fishLanguage);
  parser.setLanguage(Language);

  // Parse Fish code
  const sourceCode = `
    function greet
        echo "Hello, $argv[1]!"
    end

    greet World
  `;

  const tree = parser.parse(sourceCode);
  console.log(tree.rootNode.toString());
}

parseFishCode();
```

### Alternative usage with named exports

```typescript
import Parser from 'web-tree-sitter';
import { wasmBuffer } from '@ndonfris/tree-sitter-fish';

async function parseFishCode(): Promise<void> {
  await Parser.init();
  const parser = new Parser();

  // Load the WASM grammar using wasmBuffer
  const Language = await Parser.Language.load(wasmBuffer);
  parser.setLanguage(Language);

  // Parse Fish code
  const sourceCode = `echo "Hello, World!"`;
  const tree = parser.parse(sourceCode);
  console.log(tree.rootNode.toString());
}

parseFishCode();
```

### With syntax highlighting

```typescript
import Parser from 'web-tree-sitter';
import fishLanguage, { highlights } from '@ndonfris/tree-sitter-fish';

async function highlightFishCode(): Promise<void> {
  await Parser.init();
  const parser = new Parser();
  const Language = await Parser.Language.load(fishLanguage);
  parser.setLanguage(Language);

  // Access highlights content
  console.log('Highlights content:', highlights);

  // Parse and highlight
  const tree = parser.parse('echo "Hello, World!"');
  // Use tree and highlights for syntax highlighting
}
```

### 🎯 **Standalone Bundle (Default!)**

Everything is embedded in the main package - no external files needed:

```typescript
import Parser from 'web-tree-sitter';
import fishLanguage from '@ndonfris/tree-sitter-fish';

async function parseWithBundle() {
  await Parser.init();
  const parser = new Parser();

  // Everything is embedded - no external WASM files needed!
  const Language = await Parser.Language.load(fishLanguage);
  parser.setLanguage(Language);

  const tree = parser.parse('echo "Hello, World!"');
  console.log(tree.rootNode.toString());
}
```

**Bundle Benefits:**
- 🎯 **Single file** - no external .wasm dependencies
- ⚡ **No bundler configuration** - works out of the box
- 💾 **Cache-friendly** - everything embedded as base64
- 🔄 **Simple API** - direct Uint8Array export

### CommonJS Usage

```javascript
const {
  wasmBuffer,
  languageName,
  highlights,
  version
} = require('@ndonfris/tree-sitter-fish');

// Use wasmBuffer with tree-sitter
const Parser = require('web-tree-sitter');

async function example() {
  await Parser.init();
  const parser = new Parser();
  const Language = await Parser.Language.load(wasmBuffer);
  parser.setLanguage(Language);

  console.log('Language:', languageName);
  console.log('Version:', version);
  console.log('Highlights:', highlights);
}
```

## API Reference

### Default Export

#### `fishLanguage: Uint8Array`

The default export is the embedded WASM binary as a Uint8Array, ready to use with tree-sitter.

- **Type**: `Uint8Array`
- **Environment**: Works in both Node.js and browser environments
- **Usage**: `import fishLanguage from '@ndonfris/tree-sitter-fish'`

### Named Exports

#### `wasmBuffer: Uint8Array`

The embedded WebAssembly binary data for the tree-sitter-fish grammar.

- **Type**: `Uint8Array`
- **Environment**: Works in both Node.js and browser environments

#### `languageName: string`

The language identifier constant.

- **Value**: `'fish'`

#### `highlights: string`

The embedded content of the highlights.scm file as a string.

- **Type**: `string`
- **Contains**: Tree-sitter query patterns for syntax highlighting

#### `version: string`

Package version for debugging and compatibility checks.

- **Type**: `string`
- **Source**: From package.json

```javascript
// All available exports:
import fishLanguage, {
  wasmBuffer,
  highlights,
  languageName,
  version
} from '@ndonfris/tree-sitter-fish'} from '@ndonfris/tree-sitter-fish';
```

## Utility Scripts

While this package doesn't include a CLI, it provides utility scripts that you can run directly if needed:

```bash
# Show package information
node node_modules/@ndonfris/tree-sitter-fish/bin/show-info.js

# Extract WASM file to a specific location
node node_modules/@ndonfris/tree-sitter-fish/bin/extract-wasm.js ./tree-sitter-fish.wasm

# Validate WASM integrity
node node_modules/@ndonfris/tree-sitter-fish/bin/validate-wasm.js

# Show syntax highlighting queries
node node_modules/@ndonfris/tree-sitter-fish/bin/show-highlights.js

# Show version only
node node_modules/@ndonfris/tree-sitter-fish/bin/show-version.js
```

> **Note**: These scripts are primarily for debugging and advanced use cases. For normal usage, just import the module directly.

## Build Process

This package uses a streamlined build process:

- **Build**: Uses [esbuild](https://esbuild.github.io/) for fast bundling
- **Output**: Generates standalone ESM and CommonJS bundles in `dist/`
- **Assets**: WASM and query files are embedded directly in the bundles
- **No external files**: Everything needed is included in the JavaScript bundles

### Development

```bash
# Install dependencies
yarn install

# Build the package (creates standalone bundles)
yarn build

# Development build (same as build - bundles are fast!)
yarn dev

# Clean build artifacts
yarn clean
```

### Development Workflow (Package Testing)

To solve the **module caching issue** when testing package changes:

```bash
# 1. Build and create a timestamped development package
yarn dev:pack

# 2. Install in another project (automatically removes old version)
yarn dev:install /path/to/target/project
```

**Why this works:**
- Creates a unique version with timestamp (e.g., `3.6.0-dev.1672531200000`)
- Forces npm/yarn to treat it as a completely new package
- Automatically removes the old cached version
- Restores original version after packing

## Bundler Support

**No bundler configuration needed!** Since the WASM binary is embedded as base64 in the JavaScript bundle, it works out of the box with all bundlers:

- ✅ **Webpack** - Works without configuration
- ✅ **Vite** - Works without configuration
- ✅ **ESBuild** - Works without configuration
- ✅ **Rollup** - Works without configuration
- ✅ **Bun** - Works without configuration
- ✅ **Parcel** - Works without configuration

Simply import and use - no special loaders or plugins required:

```typescript
import Parser from 'web-tree-sitter';
import fishLanguage from '@ndonfris/tree-sitter-fish';

// Works everywhere - bundlers see it as a regular JavaScript module
await Parser.init();
const parser = new Parser();
const Language = await Parser.Language.load(fishLanguage);
parser.setLanguage(Language);
```

## Compatibility

- **Node.js**: >= 14.0.0
- **Browsers**: Modern browsers with WebAssembly support
- **TypeScript**: Full TypeScript support with generated type definitions
- **Module Systems**: Supports both ESM and CommonJS
- **Peer Dependencies**: Requires `web-tree-sitter` for parsing functionality

## Library Focus

This package is designed as a **library-only** solution for integrating fish shell parsing into applications. It includes:

- ✅ **Embedded WASM binary** - No external file dependencies
- ✅ **Syntax highlighting queries** - Built-in highlighting support
- ✅ **TypeScript definitions** - Full type safety
- ✅ **Bundler compatibility** - Works with all major bundlers out of the box
- ✅ **Multiple formats** - ESM and CommonJS support
- ✅ **Utility scripts** - Optional tools for debugging and extraction

## Version Sync

This package automatically tracks releases from the upstream [tree-sitter-fish](https://github.com/ram02z/tree-sitter-fish) repository. Version numbers correspond to upstream release tags.

## License

[MIT](LICENSE) - This package is a redistribution of [tree-sitter-fish](https://github.com/ram02z/tree-sitter-fish) grammar in [WebAssembly](https://webassembly.org/) format.

## Related Projects

- [tree-sitter](https://tree-sitter.github.io/tree-sitter/) - Incremental parsing system
- [web-tree-sitter](https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web) - Tree-sitter WebAssembly bindings
- [tree-sitter-fish](https://github.com/ram02z/tree-sitter-fish) - Original tree-sitter grammar for Fish shell
- [@esdmr/tree-sitter-fish](https://github.com/esdmr/tree-sitter-fish) - Inspiration for WASM builds
