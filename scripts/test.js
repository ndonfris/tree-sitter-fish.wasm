#!/usr/bin/env node

import * as pkg from '../dist/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json
const packageJsonPath = resolve(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

// Load last-version.txt
const lastVersionPath = resolve(__dirname, '../last-version.txt');
const lastVersion = readFileSync(lastVersionPath, 'utf8').trim();

console.log('\n  Begin Testing ');

console.log('\n  Testing version consistency...');
if (pkg.version === packageJson.version) {
  console.log('✓ Version matches package.json:', pkg.version);
} else {
  console.error('❌ Version mismatch! package.json:', packageJson.version, 'pkg.version:', pkg.version);
  process.exit(1);
}

console.log('\n  Testing version against last-version.txt...');
console.log('✓ Last version (last-version.txt):', lastVersion);
console.log('✓ Current version (package.json):', packageJson.version);
if (packageJson.version === lastVersion) {
  console.log('✓ Version unchanged from last-version.txt');
} else {
  console.log('⚠ Version different than last version:', lastVersion, '→', packageJson.version);
}

console.log('\n  General package tests...');
console.log('✓ Package loads correctly');
console.log('✓ Exports:', Object.keys(pkg));
console.log('✓ Language:', pkg.languageName);
console.log('✓ Version:', pkg.version);

// Test default export
import defaultExport from '../dist/index.js';
console.log('\n  Testing default import...');
console.log('✓ Default export type:', defaultExport.constructor.name);
console.log('✓ Default export length:', defaultExport.length, 'bytes');
console.log('✓ Default export first 10 bytes:', defaultExport.slice(0, 10).toString());

// Test highlights
console.log('\n  Testing highlights file...');
console.log('✓ Highlights content length:', pkg.highlights.length, 'characters');
console.log('✓ Highlights content:', pkg.highlights);

// Test async functions
// (async () => {
//   try {
//     console.log('\n  Testing async functions...');
//
//     const wasm = await pkg.getWasm();
//     console.log('✓ getWasm() returns ArrayBuffer:', wasm instanceof ArrayBuffer);
//     console.log('✓ WASM size:', wasm.byteLength, 'bytes');
//
//     const wasmArray = await pkg.getWasmUint8Array();
//     console.log('✓ getWasmUint8Array() returns Uint8Array:', wasmArray instanceof Uint8Array);
//
//     console.log('\n✅ All tests passed!');
//   } catch (error) {
//     console.error('\n❌ Test failed:', error.message);
//     console.error('Stack:', error.stack);
//     process.exit(1);
//   }
// })();
