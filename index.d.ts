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

  /**
   * default export to be passed to `parser.setLanguage()` from `web-tree-sitter`
   *
   * @example
   * ```
   * import Parser from 'web-tree-sitter';
   * import fishLanguage from '@ndonfris/tree-sitter-fish';
   *
   * let parser: Parser | null = null;
   *
   * async function parseFishCode(code: string) {
   *    if (!parser) {
   *       await Parser.init();               
   *       const parser = new Parser();       
   *       const lang = await fishLanguage(); 
   *       parser.setLanguage(lang);          
   *    }
   *    return parser.parse('echo "Hello, World!"');
   * }
   *
   * parseFishCode('echo "Hello, World!"').then(tree => {
   *   console.log(tree.rootNode.toString());
   * });
   *
   * parseFishCode('for i in (seq 1 5); echo $i; end').then(tree => {
   *  console.log(tree.rootNode.toString());
   * })
   * ```
   */
  export default function fishLanguage(): Promise<Uint8Array>;
}

declare module '@ndonfris/tree-sitter-fish/tree-sitter-fish.wasm' {
  const wasmBinary: ArrayBuffer;
  export default wasmBinary;
}
