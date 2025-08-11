#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🔧 Quick Fix for Netlify Issues...\n');

console.log('📋 This script will help fix common Netlify deployment issues\n');

// Step 1: Check Netlify CLI
console.log('🔍 Step 1: Checking Netlify CLI...');
try {
  const version = execSync('netlify --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Netlify CLI: ${version}`);
} catch (error) {
  console.log('❌ Netlify CLI not found');
  console.log('📥 Installing Netlify CLI...');
  try {
    execSync('npm install -g netlify-cli', { stdio: 'inherit' });
    console.log('✅ Netlify CLI installed');
  } catch (installError) {
    console.log('❌ Failed to install. Please install manually: npm install -g netlify-cli');
    process.exit(1);
  }
}

// Step 2: Check authentication
console.log('\n🔐 Step 2: Checking authentication...');
try {
  execSync('netlify status', { stdio: 'pipe' });
  console.log('✅ Authenticated with Netlify');
  continueWithFix();
} catch (error) {
  console.log('❌ Not authenticated');
  console.log('🔑 Please login to Netlify:');
  console.log('   netlify login');
  console.log('\n⏳ Waiting for you to login...');
  console.log('💡 After login, press Enter to continue...');
  
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  
  process.stdin.once('data', () => {
    console.log('🔄 Checking authentication again...');
    try {
      execSync('netlify status', { stdio: 'pipe' });
      console.log('✅ Authentication verified');
      continueWithFix();
    } catch (authError) {
      console.log('❌ Still not authenticated. Please run: netlify login');
      process.exit(1);
    }
  });
}

async function continueWithFix() {
  // Step 3: Check site linking
  console.log('\n🔗 Step 3: Checking site linking...');
  try {
    const siteInfo = execSync('netlify status', { encoding: 'utf8' });
    
    if (siteInfo.includes('Site ID:') || siteInfo.includes('Site:')) {
      console.log('✅ Site is linked');
      console.log('📋 Site information:');
      console.log(siteInfo);
    } else {
      console.log('⚠️  No site linked');
      console.log('🔗 Linking with site...');
      
      try {
        execSync('netlify link', { stdio: 'inherit' });
        console.log('✅ Successfully linked with site');
      } catch (linkError) {
        console.log('❌ Failed to link automatically');
        console.log('💡 Please run manually: npm run link-netlify');
        process.exit(1);
      }
    }
  } catch (error) {
    console.log('❌ Could not check site status');
    console.log('💡 Please run: npm run link-netlify');
    process.exit(1);
  }

  // Step 4: Check netlify.toml
  console.log('\n📁 Step 4: Checking netlify.toml...');
  try {
    const { existsSync } = await import('fs');
    const { join } = await import('path');
    
    const netlifyConfigPath = join(process.cwd(), 'netlify.toml');
    if (existsSync(netlifyConfigPath)) {
      console.log('✅ netlify.toml exists');
    } else {
      console.log('⚠️  netlify.toml not found');
      console.log('📝 Creating netlify.toml...');
      execSync('npm run setup-netlify', { stdio: 'inherit' });
    }
  } catch (error) {
    console.log('❌ Could not check/create netlify.toml');
    console.log('💡 Please run: npm run setup-netlify');
  }

  // Step 5: Test deployment
  console.log('\n🧪 Step 5: Testing deployment configuration...');
  try {
    execSync('npm run test-deploy', { stdio: 'inherit' });
    console.log('✅ Deployment configuration test passed');
  } catch (error) {
    console.log('⚠️  Deployment configuration test failed');
    console.log('💡 Please check the errors above');
  }

  console.log('\n🎉 Fix completed!');
  console.log('\n🚀 You can now try deploying:');
  console.log('   npm run auto:build:admin:deploy');
  console.log('   npm run auto:build:user:deploy');
}
