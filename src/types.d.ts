// Type declarations for non-TypeScript imports

// WASM files are loaded as base64 strings by esbuild's binary loader
declare module '*.wasm' {
  const content: string;
  export default content;
}

// SCM files are loaded as text by esbuild's text loader
declare module '*.scm' {
  const content: string;
  export default content;
}

// JSON module for package.json
declare module '*.json' {
  const content: JSON & {
    version: string;
    [key: string]: unknown;
  };
  export default content;
}
