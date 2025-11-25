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
export const uint8ArrayWasmBuffer: Uint8Array = Uint8Array.from(EMBEDDED_WASM, c => c.charCodeAt(0));

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
const fishLanguage = uint8ArrayWasmBuffer;
export default fishLanguage;
