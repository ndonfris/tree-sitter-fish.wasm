# @ndonfris/tree-sitter-fish

A [WebAssembly](https://webassembly.org/) build of [tree-sitter-fish](https://github.com/ram02z/tree-sitter-fish) grammar for parsing [fish shell](https://fishshell.com/) syntax in web browsers and Node.js environments.

Inspired by [@esdmr/tree-sitter-fish](https://github.com/esdmr/tree-sitter-fish) for providing WASM builds.

## Installation

### WASM file only

```bash
npm install @ndonfris/tree-sitter-fish
```

### With web-tree-sitter (recommended)

```bash
npm install @ndonfris/tree-sitter-fish web-tree-sitter
```

## Usage

### With web-tree-sitter

```typescript
import Parser from 'web-tree-sitter';
import { getWasm } from '@ndonfris/tree-sitter-fish';

async function parseFishCode(): Promise<void> {
  await Parser.init();
  const parser = new Parser();
  
  // Load the WASM grammar
  const wasmBinary = await getWasm();
  const Language = await Parser.Language.load(wasmBinary);
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

### With web-tree-sitter and inside bundle

```typescript
import Parser from 'web-tree-sitter';
import tsWasm from 'web-tree-sitter/tree-sitter.wasm?url';
import tsFishWasm from '@esdmr/tree-sitter-fish?url';

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
import { wasmPath, languageName } from '@ndonfris/tree-sitter-fish';

// Get file path
console.log('WASM file location:', wasmPath);
console.log('Language:', languageName);

// Or import the WASM file directly
const wasmModulePath = require.resolve('@ndonfris/tree-sitter-fish/tree-sitter-fish.wasm');
```

## API

### `getWasm(): Promise<ArrayBuffer>`

Returns the WebAssembly binary data for the tree-sitter-fish grammar.

- **Returns**: Promise that resolves to ArrayBuffer containing the WASM binary
- **Environment**: Works in both Node.js and browser environments

### `wasmPath: string`

Path to the tree-sitter-fish.wasm file.

### `languageName: string`

The language identifier ('fish').

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
- **Dependencies**: Requires `web-tree-sitter` as a peer dependency

## Version Sync

This package automatically tracks releases from the upstream [tree-sitter-fish](https://github.com/ram02z/tree-sitter-fish) repository. Version numbers correspond to upstream release tags.

## License

[MIT](LICENSE) - This package is a redistribution of [tree-sitter-fish](https://github.com/ram02z/tree-sitter-fish) grammar in [WebAssembly](https://webassembly.org/) format.

## Related Projects

- [tree-sitter](https://tree-sitter.github.io/tree-sitter/) - Incremental parsing system
- [web-tree-sitter](https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web) - Tree-sitter WebAssembly bindings
- [tree-sitter-fish](https://github.com/ram02z/tree-sitter-fish) - Original tree-sitter grammar for Fish shell
- [@esdmr/tree-sitter-fish](https://github.com/esdmr/tree-sitter-fish) - Inspiration for WASM builds
