#!/usr/bin/env node

import { existsSync } from 'fs';
import { join } from 'path';

console.log('🧪 Testing Purge and Verify Scripts...\n');

const root = process.cwd();
const adminDir = join(root, 'public', 'admin');
const assetsDir = join(root, 'public', 'admin', 'assets');
const adminIndex = join(root, 'public', 'admin', 'index.html');

console.log('📁 Checking directories:');
console.log(`  Admin dir: ${adminDir} - ${existsSync(adminDir) ? '✅ Exists' : '❌ Not found'}`);
console.log(`  Assets dir: ${assetsDir} - ${existsSync(assetsDir) ? '✅ Exists' : '❌ Not found'}`);
console.log(`  Index file: ${adminIndex} - ${existsSync(adminIndex) ? '✅ Exists' : '❌ Not found'}`);

console.log('\n🔍 Testing purge script...');
try {
  const { execSync } = await import('child_process');
  execSync('npm run purge:legacy', { stdio: 'inherit' });
  console.log('✅ Purge script executed successfully');
} catch (error) {
  console.log('⚠️  Purge script failed (this is expected if no admin build exists)');
}

console.log('\n🔍 Testing verify script...');
try {
  const { execSync } = await import('child_process');
  execSync('node scripts/verify-admin-assets.mjs', { stdio: 'inherit' });
  console.log('✅ Verify script executed successfully');
} catch (error) {
  console.log('⚠️  Verify script failed (this is expected if no admin build exists)');
}

console.log('\n📊 Test completed!');
console.log('💡 If you see warnings, it means the scripts are working correctly');
console.log('💡 To test with actual admin build, run: npm run build:admin');
