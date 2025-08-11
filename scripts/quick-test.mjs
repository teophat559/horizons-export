#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🧪 Quick Test - Testing Basic Scripts...\n');

const tests = [
  {
    name: 'Test build:user script',
    command: 'npm run build:user',
    description: 'Building user version'
  },
  {
    name: 'Test build:admin script',
    command: 'npm run build:admin',
    description: 'Building admin version'
  },
  {
    name: 'Test auto:build script',
    command: 'npm run auto:build',
    description: 'Testing auto build'
  }
];

async function runTest(test) {
  console.log(`\n🔍 ${test.name}`);
  console.log(`📝 ${test.description}`);

  try {
    console.log('⏳ Running...');
    execSync(test.command, { stdio: 'inherit' });
    console.log('✅ Test passed');
    return true;
  } catch (error) {
    console.log('❌ Test failed');
    return false;
  }
}

async function main() {
  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const result = await runTest(test);
    if (result) passed++;
  }

  console.log(`\n📊 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed! System is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch(console.error);
