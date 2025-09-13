#!/usr/bin/env node

/**
 * TDD Story Update Script
 * Systematically updates all stories with TDD requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storiesDir = path.join(__dirname, '../docs/stories');
const stories = fs.readdirSync(storiesDir).filter(file => file.endsWith('.md'));

console.log('🎯 TDD Story Update Script');
console.log('========================');
console.log(`Found ${stories.length} stories to update:`);
console.log('');

stories.forEach((story, index) => {
  console.log(`${index + 1}. ${story}`);
});

console.log('');
console.log('📋 TDD Integration Requirements:');
console.log('- Add TDD acceptance criteria (6-9)');
console.log('- Add TDD implementation task');
console.log('- Update testing standards section');
console.log('- Add PWA testing requirements');
console.log('');

console.log('🚀 Ready to update stories with TDD requirements!');
console.log('Run this script to see which stories need updates.');
