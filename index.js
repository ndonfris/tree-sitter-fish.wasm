const path = require('path');
const fs = require('fs');

/**
 * Path to the compiled tree-sitter-fish WebAssembly binary
 */
const wasmPath = path.join(__dirname, 'tree-sitter-fish.wasm');

/**
 * Raw WebAssembly binary data for tree-sitter-fish
 * @returns {Promise<ArrayBuffer>} The WASM binary data
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

module.exports = {
  wasmPath,
  getWasm,
  languageName
};

// ES Module compatibility
module.exports.default = module.exports;