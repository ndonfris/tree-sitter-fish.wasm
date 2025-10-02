# @ndonfris/tree-sitter-fish

A [WebAssembly](https://webassembly.org/) build of [tree-sitter-fish](https://github.com/ram02z/tree-sitter-fish) grammar for parsing [fish shell](https://fishshell.com/) syntax in web browsers and Node.js environments.

This package provides standalone bundles with all assets embedded - no external WASM or query files needed!

Inspired by [@esdmr/tree-sitter-fish](https://github.com/esdmr/tree-sitter-fish) for providing WASM builds.

## Installation

### WASM file only

```bash
npm install @ndonfris/tree-sitter-fish
# or
yarn add @ndonfris/tree-sitter-fish
```

### With web-tree-sitter (recommended)

```bash
npm install @ndonfris/tree-sitter-fish web-tree-sitter
# or
yarn add @ndonfris/tree-sitter-fish web-tree-sitter
```

## Usage

### Basic usage with web-tree-sitter

```typescript
import Parser from 'web-tree-sitter';
import fishLanguage from '@ndonfris/tree-sitter-fish';

async function parseFishCode(): Promise<void> {
  await Parser.init();
  const parser = new Parser();
  
  // Load the WASM grammar using the default export
  const Language = await Parser.Language.load(await fishLanguage());
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
import { getWasm } from '@ndonfris/tree-sitter-fish';

async function parseFishCode(): Promise<void> {
  await Parser.init();
  const parser = new Parser();
  
  // Load the WASM grammar using getWasm function
  const wasmBinary = await getWasm();
  const Language = await Parser.Language.load(wasmBinary);
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
  const Language = await Parser.Language.load(await fishLanguage());
  parser.setLanguage(Language);
  
  // Access highlights file
  console.log('Highlights file path:', highlights.path);
  console.log('Highlights content:', highlights.text);
  
  // Parse and highlight
  const tree = parser.parse('echo "Hello, World!"');
  // Use tree and highlights.text for syntax highlighting
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
  const Language = await Parser.Language.load(await fishLanguage());
  parser.setLanguage(Language);
  
  const tree = parser.parse('echo "Hello, World!"');
  console.log(tree.rootNode.toString());
}
```

**Bundle Benefits:**
- 🎯 **Single file** - no external .wasm dependencies  
- ⚡ **No bundler configuration** - works out of the box
- 💾 **Cache-friendly** - everything embedded as base64
- 🔄 **Same API** - familiar tree-sitter interface

### With bundlers

```typescript
import Parser from 'web-tree-sitter';
import tsWasm from 'web-tree-sitter/tree-sitter.wasm?url';
import tsFishWasm from '@ndonfris/tree-sitter-fish/tree-sitter-fish.wasm?url';

// The parser will need to locate the wasm file to resolve correctly inside a bundled environment
await Parser.init({
    locateFile() {
        return tsWasm;
    },
});
const fish = await Parser.Language.load(tsFishWasm);
```

### Direct WASM Access

```typescript
import { wasmPath, languageName, highlights, getHighlightsContent } from '@ndonfris/tree-sitter-fish';

// Get file paths and metadata
console.log('WASM file location:', wasmPath);
console.log('Language:', languageName);
console.log('Highlights file location:', highlights.path);

// Get highlights content
const highlightsContent = getHighlightsContent();
// or
const highlightsContent2 = highlights.text;

// Import files directly via package exports
import highlightsFile from '@ndonfris/tree-sitter-fish/highlights.scm';
import wasmFile from '@ndonfris/tree-sitter-fish/tree-sitter-fish.wasm';
```

### CommonJS Usage

```javascript
const { 
  getWasm, 
  wasmPath, 
  languageName, 
  highlights,
  getHighlightsContent 
} = require('@ndonfris/tree-sitter-fish');

// All functions work the same in CommonJS
async function example() {
  const wasmBinary = await getWasm();
  console.log('Language:', languageName);
  console.log('Highlights:', highlights.text);
}
```

## API

### Default Export

#### `fishLanguage(): Promise<Uint8Array>`

The default export function that returns the WASM binary as a Uint8Array for tree-sitter.

- **Returns**: Promise that resolves to Uint8Array containing the WASM binary
- **Environment**: Works in both Node.js and browser environments
- **Usage**: `import fishLanguage from '@ndonfris/tree-sitter-fish'`

### Named Exports

#### `getWasm(): Promise<ArrayBuffer>`

Returns the WebAssembly binary data for the tree-sitter-fish grammar.

- **Returns**: Promise that resolves to ArrayBuffer containing the WASM binary
- **Environment**: Works in both Node.js and browser environments

#### `wasmPath: string`

Path to the tree-sitter-fish.wasm file in the package.

#### `languageName: string`

The language identifier ('fish').

#### `highlights: { path: string; text: string }`

Object containing highlights information:
- `path`: Absolute path to the highlights.scm file
- `text`: Raw content of the highlights.scm file

#### `getHighlightsContent(): string`

Function that returns the raw content of the highlights.scm file.

#### `highlightsPath: string`

Path to the highlights.scm file in the package.

### File Exports

#### `@ndonfris/tree-sitter-fish/tree-sitter-fish.wasm`

Direct access to the WASM file.

#### `@ndonfris/tree-sitter-fish/highlights.scm`

Direct access to the highlights file.

#### `@ndonfris/tree-sitter-fish/queries/*`

Direct access to any file in the queries directory.

### Additional Exports

#### `version: string`

Package version for debugging and compatibility checks.

#### `getWasmUint8Array(): Promise<Uint8Array>`

Optimized function that returns WASM as Uint8Array (preferred for tree-sitter).

```javascript
// All exports are now bundled by default:
import fishLanguage, { 
  getWasm, 
  getWasmUint8Array, 
  highlights, 
  languageName, 
  version 
} from '@ndonfris/tree-sitter-fish';
```

## CLI Usage

This package includes a CLI tool for building and managing the WASM file:

```bash
# Show the embedded WASM path
npx tree-sitter-fish.wasm --path

# Extract the embedded WASM to a file
npx tree-sitter-fish.wasm --copy --to ./tree-sitter-fish.wasm

# Show package version
npx tree-sitter-fish.wasm --version

# Show help
npx tree-sitter-fish.wasm --help
```

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

## Bundler Examples

For browser environments, you may need to configure your bundler to handle `.wasm` files or serve them statically.

<table>
<tr>
<td>

### Webpack

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: 'asset/resource',
      },
    ],
  },
};
```

</td>
<td>

### ESBuild

```javascript
// esbuild.config.js
import { build } from 'esbuild';

build({
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/bundle.js',
  loader: {
    '.wasm': 'file'
  },
});
```

</td>
</tr>
<tr>
<td>

### Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.wasm'],
});
```

</td>
<td>

### Bun

```javascript
// Bun handles .wasm files automatically
// No additional configuration needed
import { getWasm } from '@ndonfris/tree-sitter-fish';

// Just use it directly
const wasmBinary = await getWasm();
```

</td>
</tr>
</table>

## Compatibility

- **Node.js**: >= 14.0.0
- **Browsers**: Modern browsers with WebAssembly support
- **TypeScript**: Full TypeScript support with generated type definitions
- **Module Systems**: Supports both ESM and CommonJS
- **Dependencies**: Requires `web-tree-sitter` as a peer dependency for parsing

## Version Sync

This package automatically tracks releases from the upstream [tree-sitter-fish](https://github.com/ram02z/tree-sitter-fish) repository. Version numbers correspond to upstream release tags.

## License

[MIT](LICENSE) - This package is a redistribution of [tree-sitter-fish](https://github.com/ram02z/tree-sitter-fish) grammar in [WebAssembly](https://webassembly.org/) format.

## Related Projects

- [tree-sitter](https://tree-sitter.github.io/tree-sitter/) - Incremental parsing system
- [web-tree-sitter](https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web) - Tree-sitter WebAssembly bindings
- [tree-sitter-fish](https://github.com/ram02z/tree-sitter-fish) - Original tree-sitter grammar for Fish shell
- [@esdmr/tree-sitter-fish](https://github.com/esdmr/tree-sitter-fish) - Inspiration for WASM builds
