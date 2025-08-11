#!/usr/bin/env node

import { spawn } from 'child_process';
import { execSync } from 'child_process';

console.log('🔗 Linking with Netlify site...\n');

// Check authentication first
console.log('🔐 Checking authentication...');
try {
  execSync('netlify status', { stdio: 'pipe' });
  console.log('✅ Authenticated with Netlify');
} catch (error) {
  console.error('❌ Not authenticated with Netlify');
  console.log('💡 Please login first: netlify login');
  process.exit(1);
}

// Check if already linked
console.log('\n🔍 Checking current site status...');
try {
  const status = execSync('netlify status', { encoding: 'utf8' });

  if (status.includes('Site ID:') || status.includes('Site:')) {
    console.log('✅ Already linked to a site');
    console.log('📋 Current site info:');
    console.log(status);

    console.log('\n🔄 Do you want to link to a different site? (y/n)');
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (data) => {
      const input = data.trim().toLowerCase();
      if (input === 'y' || input === 'yes') {
        console.log('🔗 Unlinking current site...');
        try {
          execSync('netlify unlink', { stdio: 'inherit' });
          console.log('✅ Unlinked successfully');
          linkToSite();
        } catch (error) {
          console.log('⚠️  Could not unlink, continuing...');
          linkToSite();
        }
      } else {
        console.log('✅ Keeping current site link');
        process.exit(0);
      }
    });
  } else {
    console.log('⚠️  No site currently linked');
    linkToSite();
  }
} catch (error) {
  console.log('⚠️  Could not check status, proceeding with linking...');
  linkToSite();
}

function linkToSite() {
  console.log('\n🔗 Linking options:');
  console.log('1. Link with existing site');
  console.log('2. Create new site');
  console.log('3. List available sites');

  console.log('\n📝 Enter your choice (1, 2, or 3):');
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', (data) => {
    const choice = data.trim();

    switch (choice) {
      case '1':
        console.log('\n🔗 Linking with existing site...');
        console.log('💡 This will prompt you to select from your sites');
        const linkProcess = spawn('netlify', ['link'], { stdio: 'inherit' });

        linkProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Successfully linked with existing site');
            showNextSteps();
          } else {
            console.log('❌ Failed to link with existing site');
            process.exit(code);
          }
        });
        break;

      case '2':
        console.log('\n🚀 Creating new site...');
        console.log('💡 Enter a name for your new site:');

        process.stdin.once('data', (siteName) => {
          const name = siteName.trim();
          if (name) {
            console.log(`🚀 Creating site: ${name}`);
            const createProcess = spawn('netlify', ['sites:create', '--name', name], { stdio: 'inherit' });

            createProcess.on('close', (code) => {
              if (code === 0) {
                console.log('✅ Successfully created and linked new site');
                showNextSteps();
              } else {
                console.log('❌ Failed to create new site');
                process.exit(code);
              }
            });
          } else {
            console.log('❌ Invalid site name');
            process.exit(1);
          }
        });
        break;

      case '3':
        console.log('\n📋 Listing available sites...');
        try {
          execSync('netlify sites:list', { stdio: 'inherit' });
          console.log('\n💡 Now you can choose option 1 to link with one of these sites');
        } catch (error) {
          console.log('❌ Could not list sites');
        }
        process.exit(0);
        break;

      default:
        console.log('❌ Invalid choice. Please enter 1, 2, or 3');
        process.exit(1);
    }
  });
}

function showNextSteps() {
  console.log('\n🎉 Successfully linked with Netlify!');
  console.log('\n🚀 Next steps:');
  console.log('1. Build your project: npm run build:admin');
  console.log('2. Deploy: npm run auto:build:admin:deploy');
  console.log('\n💡 You can also test deployment with: npm run test-deploy');
}
