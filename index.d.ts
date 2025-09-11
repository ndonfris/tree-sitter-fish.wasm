/**
 * Tree-sitter grammar for Fish shell with WebAssembly support
 */

declare module '@ndonfris/tree-sitter-fish' {
  /**
   * Path to the compiled tree-sitter-fish WebAssembly binary
   */
  export const wasmPath: string;

  /**
   * Raw WebAssembly binary data for tree-sitter-fish
   */
  export function getWasm(): Promise<ArrayBuffer>;

  /**
   * Language name identifier
   */
  export const languageName: string;
}

declare module '@ndonfris/tree-sitter-fish/tree-sitter-fish.wasm' {
  const wasmBinary: ArrayBuffer;
  export default wasmBinary;
}