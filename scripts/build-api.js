#!/usr/bin/env node

/**
 * Build script for Vercel API functions
 * Ensures TypeScript dependencies are properly bundled for serverless functions
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔧 Building API functions for Vercel...');

try {
  // Ensure the api directory exists
  const apiDir = path.join(projectRoot, 'api');
  if (!fs.existsSync(apiDir)) {
    console.error('❌ API directory not found');
    process.exit(1);
  }

  // Copy TypeScript source files to api directory for Vercel to process
  const srcTransformersDir = path.join(projectRoot, 'src', 'transformers');
  const apiTransformersDir = path.join(apiDir, 'transformers');

  // Create transformers directory in api if it doesn't exist
  if (!fs.existsSync(apiTransformersDir)) {
    fs.mkdirSync(apiTransformersDir, { recursive: true });
  }

  // Copy transformer files
  const transformerFiles = [
    'baseTransformer.ts',
    'attendeeTransformer.ts',
    'agendaTransformer.ts'
  ];

  transformerFiles.forEach(file => {
    const srcFile = path.join(srcTransformersDir, file);
    const destFile = path.join(apiTransformersDir, file);
    
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`✅ Copied ${file} to api/transformers/`);
    } else {
      console.warn(`⚠️  Source file not found: ${srcFile}`);
    }
  });

  // Copy types directory
  const srcTypesDir = path.join(projectRoot, 'src', 'types');
  const apiTypesDir = path.join(apiDir, 'types');

  if (fs.existsSync(srcTypesDir)) {
    if (!fs.existsSync(apiTypesDir)) {
      fs.mkdirSync(apiTypesDir, { recursive: true });
    }

    // Copy all type files
    const typeFiles = fs.readdirSync(srcTypesDir);
    typeFiles.forEach(file => {
      if (file.endsWith('.ts')) {
        const srcFile = path.join(srcTypesDir, file);
        const destFile = path.join(apiTypesDir, file);
        fs.copyFileSync(srcFile, destFile);
        console.log(`✅ Copied ${file} to api/types/`);
      }
    });
  }

  console.log('✅ API build preparation complete');
  console.log('📦 Vercel will now properly bundle TypeScript dependencies');

} catch (error) {
  console.error('❌ Build script failed:', error.message);
  process.exit(1);
}
