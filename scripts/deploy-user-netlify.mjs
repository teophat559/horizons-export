#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

console.log('🚀 Deploying User to Netlify...');

// Check if user build exists
const userBuildPath = join(__dirname, '..', 'user', 'dist');
if (!existsSync(userBuildPath)) {
  console.log('⚠️  User build not found. Creating directory...');
  try {
    mkdirSync(userBuildPath, { recursive: true });
    console.log('✅ Created user/dist directory');
  } catch (error) {
    console.error('❌ Failed to create user/dist directory:', error.message);
    process.exit(1);
  }
}

// Check if netlify CLI is installed
try {
  const { execSync } = await import('child_process');
  execSync('netlify --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Netlify CLI not found. Please install it first:');
  console.error('   npm install -g netlify-cli');
  process.exit(1);
}

// Check Netlify authentication status
try {
  const { execSync } = await import('child_process');
  console.log('🔐 Checking Netlify authentication...');
  execSync('netlify status', { stdio: 'pipe' });
  console.log('✅ Netlify authentication verified');
} catch (error) {
  console.error('❌ Netlify authentication failed. Please login first:');
  console.error('   netlify login');
  process.exit(1);
}

// Check if netlify.toml exists and has proper configuration
const netlifyConfigPath = join(__dirname, '..', 'netlify.toml');
if (!existsSync(netlifyConfigPath)) {
  console.log('⚠️  netlify.toml not found. Creating basic configuration...');
  try {
    const { writeFileSync } = await import('fs');
    const basicConfig = `[build]
  publish = "user/dist"
  command = "npm run build:user"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`;
    writeFileSync(netlifyConfigPath, basicConfig);
    console.log('✅ Created netlify.toml with basic configuration');
  } catch (error) {
    console.error('❌ Failed to create netlify.toml:', error.message);
  }
}

// Check if site is linked
console.log('\n🔗 Checking site linking...');
try {
  const { execSync } = await import('child_process');
  const siteInfo = execSync('netlify status', { encoding: 'utf8' });

  if (siteInfo.includes('Site ID:') || siteInfo.includes('Site:')) {
    console.log('✅ Site is linked');
    console.log('📋 Site information:');
    console.log(siteInfo);
  } else {
    console.error('❌ No site linked to Netlify');
    console.log('\n🔧 To fix this issue:');
    console.log('1. Run: npm run link-netlify');
    console.log('2. Or manually: netlify link');
    console.log('3. Or create new site: netlify sites:create --name your-site-name');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Could not check site linking status');
  console.log('\n🔧 Please check your Netlify configuration:');
  console.log('   npm run setup-netlify');
  process.exit(1);
}

// Deploy to Netlify
console.log('🚀 Starting deployment...');
const deployProcess = spawn('netlify', ['deploy', '--dir=user/dist', '--prod'], {
  stdio: 'inherit',
  shell: true
});

deployProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ User deployed to Netlify successfully!');
  } else {
    console.error(`❌ Deploy failed with code ${code}`);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check Netlify authentication: netlify status');
    console.log('2. Login to Netlify: netlify login');
    console.log('3. Check site configuration: netlify sites:list');
    console.log('4. Verify netlify.toml configuration');
    process.exit(code);
  }
});

deployProcess.on('error', (error) => {
  console.error('❌ Deploy error:', error.message);
  process.exit(1);
});
