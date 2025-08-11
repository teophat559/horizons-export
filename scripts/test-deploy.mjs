#!/usr/bin/env node

import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

console.log('🧪 Testing Netlify Deployment Configuration...\n');

const root = join(__dirname, '..');
const netlifyConfigPath = join(root, 'netlify.toml');

// Test 1: Check netlify.toml
console.log('📁 Test 1: Checking netlify.toml');
if (existsSync(netlifyConfigPath)) {
  console.log('✅ netlify.toml exists');
} else {
  console.log('❌ netlify.toml not found');
  console.log('💡 Run: npm run setup-netlify');
}

// Test 2: Check Netlify CLI
console.log('\n🔍 Test 2: Checking Netlify CLI');
try {
  const { execSync } = await import('child_process');
  const version = execSync('netlify --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Netlify CLI installed: ${version}`);
} catch (error) {
  console.log('❌ Netlify CLI not installed');
  console.log('💡 Install with: npm install -g netlify-cli');
}

// Test 3: Check authentication
console.log('\n🔐 Test 3: Checking authentication');
try {
  const { execSync } = await import('child_process');
  execSync('netlify status', { stdio: 'pipe' });
  console.log('✅ Authenticated with Netlify');
} catch (error) {
  console.log('❌ Not authenticated with Netlify');
  console.log('💡 Login with: netlify login');
}

// Test 4: Check build directories
console.log('\n📂 Test 4: Checking build directories');
const adminBuildPath = join(root, 'public', 'admin');
const userBuildPath = join(root, 'user', 'dist');

if (existsSync(adminBuildPath)) {
  console.log('✅ Admin build directory exists');
} else {
  console.log('⚠️  Admin build directory not found');
  console.log('💡 Build with: npm run build:admin');
}

if (existsSync(userBuildPath)) {
  console.log('✅ User build directory exists');
} else {
  console.log('⚠️  User build directory not found');
  console.log('💡 Build with: npm run build:user');
}

// Test 5: Check package.json scripts
console.log('\n📋 Test 5: Checking package.json scripts');
try {
  const { readFileSync } = await import('fs');
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const scripts = packageJson.scripts || {};

  const requiredScripts = [
    'build:admin',
    'build:user',
    'deploy:netlify:admin',
    'deploy:netlify:user'
  ];

  requiredScripts.forEach(script => {
    if (scripts[script]) {
      console.log(`✅ ${script} script exists`);
    } else {
      console.log(`❌ ${script} script missing`);
    }
  });
} catch (error) {
  console.log('❌ Could not read package.json');
}

console.log('\n📊 Test completed!');
console.log('\n🔧 To fix issues:');
console.log('1. Setup Netlify: npm run setup-netlify');
console.log('2. Install CLI: npm install -g netlify-cli');
console.log('3. Login: netlify login');
console.log('4. Build: npm run build:admin');
console.log('5. Deploy: npm run auto:build:admin:deploy');
