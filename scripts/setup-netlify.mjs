#!/usr/bin/env node

import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

console.log('🔧 Setting up Netlify for deployment...\n');

const root = join(__dirname, '..');
const netlifyConfigPath = join(root, 'netlify.toml');

// Check if netlify.toml exists
if (existsSync(netlifyConfigPath)) {
  console.log('📁 netlify.toml already exists');
  try {
    const content = readFileSync(netlifyConfigPath, 'utf8');
    console.log('📋 Current configuration:');
    console.log(content);
  } catch (error) {
    console.log('⚠️  Could not read existing netlify.toml');
  }
} else {
  console.log('📁 Creating netlify.toml...');
  
  const config = `# Netlify configuration for BVOTE project
[build]
  # Build command for admin
  command = "npm run build:admin"
  # Publish directory for admin
  publish = "public/admin"

[build.environment]
  NODE_VERSION = "18"

# Redirects for SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Headers for security
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"

# Admin-specific redirects
[[redirects]]
  from = "/admin/*"
  to = "/admin/index.html"
  status = 200

# API redirects (if needed)
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

# User build configuration (separate)
[context.user]
  command = "npm run build:user"
  publish = "user/dist"

[context.user.redirects]
  from = "/*"
  to = "/index.html"
  status = 200`;

  try {
    writeFileSync(netlifyConfigPath, config);
    console.log('✅ Created netlify.toml with comprehensive configuration');
  } catch (error) {
    console.error('❌ Failed to create netlify.toml:', error.message);
    process.exit(1);
  }
}

// Check Netlify CLI installation
console.log('\n🔍 Checking Netlify CLI...');
try {
  const { execSync } = await import('child_process');
  const version = execSync('netlify --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Netlify CLI installed: ${version}`);
} catch (error) {
  console.log('❌ Netlify CLI not installed');
  console.log('\n📥 Installing Netlify CLI...');
  try {
    execSync('npm install -g netlify-cli', { stdio: 'inherit' });
    console.log('✅ Netlify CLI installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install Netlify CLI:', installError.message);
    console.log('\n💡 Please install manually: npm install -g netlify-cli');
  }
}

// Check authentication status
console.log('\n🔐 Checking authentication...');
try {
  const { execSync } = await import('child_process');
  execSync('netlify status', { stdio: 'pipe' });
  console.log('✅ Already authenticated with Netlify');
} catch (error) {
  console.log('❌ Not authenticated with Netlify');
  console.log('\n🔑 Please login to Netlify:');
  console.log('   netlify login');
}

// Check if site is linked
console.log('\n🔗 Checking site linking...');
try {
  const { execSync } = await import('child_process');
  const siteInfo = execSync('netlify status', { encoding: 'utf8' });
  
  if (siteInfo.includes('Site ID:') || siteInfo.includes('Site:')) {
    console.log('✅ Site is already linked');
    console.log('📋 Site information:');
    console.log(siteInfo);
  } else {
    console.log('⚠️  No site linked');
    console.log('\n🔗 To link with existing site:');
    console.log('   netlify link');
    console.log('\n🚀 To create new site:');
    console.log('   netlify sites:create --name your-site-name');
  }
} catch (error) {
  console.log('❌ Could not check site status');
  console.log('\n🔗 Please link or create a site:');
  console.log('   netlify link          # Link with existing site');
  console.log('   netlify sites:create  # Create new site');
}

// Show next steps
console.log('\n🚀 Next steps:');
console.log('1. Login to Netlify: netlify login');
console.log('2. Link with site: netlify link (or create new: netlify sites:create)');
console.log('3. Build your project: npm run build:admin');
console.log('4. Deploy: npm run auto:build:admin:deploy');
console.log('\n📖 For more information, see: https://docs.netlify.com/');
