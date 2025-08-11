#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('🧪 Testing Auto Build System...\n');

const tests = [
  {
    name: 'Check Node.js script exists',
    test: () => existsSync('scripts/auto-build.mjs'),
    message: '✅ Node.js script exists'
  },
  {
    name: 'Check Windows script exists',
    test: () => existsSync('scripts/auto-build.cmd'),
    message: '✅ Windows script exists'
  },
  {
    name: 'Check Unix script exists',
    test: () => existsSync('scripts/auto-build.sh'),
    message: '✅ Unix script exists'
  },
  {
    name: 'Check package.json scripts',
    test: () => {
      try {
        const packageJson = JSON.parse(execSync('npm run --silent', { encoding: 'utf8' }));
        return packageJson.includes('auto:build');
      } catch {
        return false;
      }
    },
    message: '✅ Package.json scripts configured'
  },
  {
    name: 'Test help command',
    test: () => {
      try {
        execSync('node scripts/auto-build.mjs --help', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    message: '✅ Help command works'
  }
];

let passed = 0;
let total = tests.length;

tests.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`);
  
  try {
    if (test.test()) {
      console.log(test.message);
      passed++;
    } else {
      console.log('❌ Test failed');
    }
  } catch (error) {
    console.log(`❌ Test error: ${error.message}`);
  }
  
  console.log('');
});

console.log(`📊 Test Results: ${passed}/${total} passed`);

if (passed === total) {
  console.log('🎉 All tests passed! Auto build system is ready.');
  console.log('\n🚀 Quick Start:');
  console.log('  npm run auto:build:watch          # Build with watch mode');
  console.log('  npm run auto:build:admin:watch    # Admin build with watch');
  console.log('  npm run auto:build:user:watch     # User build with watch');
  console.log('\n📖 For more options, see: docs/auto-build-guide.md');
} else {
  console.log('⚠️  Some tests failed. Please check the configuration.');
  process.exit(1);
}
