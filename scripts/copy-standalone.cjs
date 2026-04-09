#!/usr/bin/env node
/**
 * copy-standalone.cjs
 * Post-build script to assemble a publishable standalone bundle.
 * Run via: node scripts/copy-standalone.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STANDALONE = path.join(ROOT, '.next', 'standalone');
const PUBLIC_SRC = path.join(ROOT, 'public');
const PUBLIC_DST = path.join(STANDALONE, 'public');
const STATIC_SRC = path.join(ROOT, '.next', 'static');
const STATIC_DST = path.join(STANDALONE, '.next', 'static');

function copyDir(src, dst) {
  if (!fs.existsSync(src)) {
    console.warn(`[copy-standalone] Skipping (not found): ${src}`);
    return;
  }
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

if (!fs.existsSync(STANDALONE)) {
  console.error('[copy-standalone] ERROR: .next/standalone does not exist. Run: bun run build first.');
  process.exit(1);
}

console.log('[copy-standalone] Copying public/ → standalone/public/');
copyDir(PUBLIC_SRC, PUBLIC_DST);

console.log('[copy-standalone] Copying .next/static/ → standalone/.next/static/');
copyDir(STATIC_SRC, STATIC_DST);

console.log('[copy-standalone] ✓ Standalone bundle ready at .next/standalone/');
