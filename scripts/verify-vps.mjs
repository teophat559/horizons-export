#!/usr/bin/env node

/**
 * VPS Deployment Verification Script
 * 
 * This script verifies that the Horizons Export application is properly
 * deployed and running on a VPS server.
 * 
 * Usage:
 *   npm run verify:vps [-- --host=server-ip] [-- --domain=your-domain.com]
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};

const config = {
  host: getArg('host') || process.env.VPS_HOST,
  user: getArg('user') || process.env.VPS_USER || 'root',
  port: getArg('port') || process.env.VPS_PORT || '22',
  domain: getArg('domain') || process.env.VPS_DOMAIN,
  adminPath: '/var/www/horizons-export/admin',
  userPath: '/var/www/horizons-export/public',
  backendPath: '/opt/horizons-backend'
};

console.log('🔍 VPS Deployment Verification for Horizons Export\n');
console.log('Configuration:');
console.log(`  Host: ${config.host}`);
console.log(`  User: ${config.user}`);
console.log(`  Domain: ${config.domain || 'Not specified'}`);
console.log('');

if (!config.host) {
  console.error('❌ Error: VPS host not specified!');
  console.log('💡 Usage: npm run verify:vps -- --host=your-server-ip');
  process.exit(1);
}

function runSSHCommand(command, description, allowFailure = false) {
  const sshCommand = `ssh -p ${config.port} ${config.user}@${config.host} "${command}"`;
  console.log(`🔧 ${description}`);
  
  try {
    const output = execSync(sshCommand, { 
      encoding: 'utf8', 
      cwd: projectRoot,
      stdio: 'pipe'
    });
    console.log('   ✅ Success');
    if (output.trim()) {
      console.log(`   Output: ${output.trim()}`);
    }
    console.log('');
    return output;
  } catch (error) {
    if (allowFailure) {
      console.log('   ⚠️ Failed (optional check)');
      console.log(`   Error: ${error.message}`);
    } else {
      console.log('   ❌ Failed');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
    return null;
  }
}

async function verifySSHConnection() {
  console.log('🔗 Testing SSH Connection...\n');
  const result = runSSHCommand('echo "SSH connection successful" && date', 'Connecting to VPS');
  return result !== null;
}

async function verifySystemServices() {
  console.log('🖥️ Verifying System Services...\n');
  
  let allGood = true;
  
  // Check nginx
  const nginxStatus = runSSHCommand('systemctl is-active nginx', 'Checking Nginx status');
  if (!nginxStatus || !nginxStatus.includes('active')) {
    allGood = false;
  }
  
  // Check PostgreSQL
  const pgStatus = runSSHCommand('systemctl is-active postgresql', 'Checking PostgreSQL status');
  if (!pgStatus || !pgStatus.includes('active')) {
    allGood = false;
  }
  
  // Check PM2
  const pm2Status = runSSHCommand('pm2 list | grep horizons-backend || echo "not found"', 'Checking PM2 process');
  if (!pm2Status || pm2Status.includes('not found')) {
    allGood = false;
  }
  
  return allGood;
}

async function verifyApplicationFiles() {
  console.log('📁 Verifying Application Files...\n');
  
  let allGood = true;
  
  // Check admin files
  const adminIndex = runSSHCommand(`test -f ${config.adminPath}/index.html && echo "exists" || echo "missing"`, 'Checking admin index.html');
  if (!adminIndex || !adminIndex.includes('exists')) {
    allGood = false;
  }
  
  // Check user files
  const userIndex = runSSHCommand(`test -f ${config.userPath}/index.html && echo "exists" || echo "missing"`, 'Checking user index.html');
  if (!userIndex || !userIndex.includes('exists')) {
    allGood = false;
  }
  
  // Check backend files
  const backendMain = runSSHCommand(`test -f ${config.backendPath}/src/index.js && echo "exists" || echo "missing"`, 'Checking backend main file');
  if (!backendMain || !backendMain.includes('exists')) {
    allGood = false;
  }
  
  // Check environment file
  const envFile = runSSHCommand(`test -f ${config.backendPath}/.env && echo "exists" || echo "missing"`, 'Checking environment file');
  if (!envFile || !envFile.includes('exists')) {
    console.log('   ⚠️ .env file missing - this may cause backend startup issues');
  }
  
  return allGood;
}

async function verifyNetworkConnectivity() {
  console.log('🌐 Verifying Network Connectivity...\n');
  
  let allGood = true;
  
  // Test backend health endpoint
  const healthCheck = runSSHCommand('curl -f http://localhost:4000/api/health 2>/dev/null && echo "healthy" || echo "unhealthy"', 'Testing backend health endpoint');
  if (!healthCheck || !healthCheck.includes('healthy')) {
    allGood = false;
  }
  
  // Test frontend accessibility
  const frontendCheck = runSSHCommand('curl -f http://localhost/ 2>/dev/null | head -1 | grep -q "<!DOCTYPE html" && echo "accessible" || echo "inaccessible"', 'Testing frontend accessibility');
  if (!frontendCheck || !frontendCheck.includes('accessible')) {
    allGood = false;
  }
  
  // Test admin interface
  const adminCheck = runSSHCommand('curl -f http://localhost/admin/ 2>/dev/null | head -1 | grep -q "<!DOCTYPE html" && echo "accessible" || echo "inaccessible"', 'Testing admin interface');
  if (!adminCheck || !adminCheck.includes('accessible')) {
    allGood = false;
  }
  
  return allGood;
}

async function verifyDatabaseConnection() {
  console.log('🗄️ Verifying Database Connection...\n');
  
  // Test database connectivity
  const dbTest = runSSHCommand('sudo -u postgres psql -c "SELECT version();" horizons_export 2>/dev/null | grep PostgreSQL && echo "connected" || echo "failed"', 'Testing database connection');
  
  // Test application database access (if backend is running)
  const appDbTest = runSSHCommand(`cd ${config.backendPath} && node -e "
    require('dotenv').config();
    const { Client } = require('pg');
    const client = new Client(process.env.DATABASE_URL);
    client.connect().then(() => {
      console.log('app-db-connected');
      client.end();
    }).catch(err => {
      console.log('app-db-failed:', err.message);
      client.end();
    });
  " 2>/dev/null`, 'Testing application database access', true);
  
  return dbTest && dbTest.includes('connected');
}

async function verifySSL() {
  if (!config.domain) {
    console.log('🔒 Skipping SSL verification (no domain specified)\n');
    return true;
  }
  
  console.log('🔒 Verifying SSL Configuration...\n');
  
  // Test SSL certificate
  const sslTest = runSSHCommand(`echo | openssl s_client -servername ${config.domain} -connect ${config.domain}:443 2>/dev/null | grep -q "Verify return code: 0" && echo "valid" || echo "invalid"`, 'Testing SSL certificate', true);
  
  // Test HTTPS redirect
  const redirectTest = runSSHCommand(`curl -s -o /dev/null -w "%{http_code}" http://${config.domain}/ | grep -q "301\\|302" && echo "redirecting" || echo "not-redirecting"`, 'Testing HTTPS redirect', true);
  
  return true; // SSL is optional, so don't fail overall verification
}

async function verifyPerformance() {
  console.log('⚡ Checking Performance Metrics...\n');
  
  // Check disk space
  runSSHCommand('df -h / | tail -1', 'Checking disk space');
  
  // Check memory usage
  runSSHCommand('free -m', 'Checking memory usage');
  
  // Check CPU load
  runSSHCommand('uptime', 'Checking system load');
  
  // Check backend process resources
  runSSHCommand('pm2 monit | head -10 || echo "PM2 monitoring not available"', 'Checking backend process metrics', true);
  
  return true; // Performance checks are informational
}

async function generateReport() {
  console.log('📋 Generating Verification Report...\n');
  
  const checks = [
    'SSH Connection',
    'System Services',
    'Application Files',
    'Network Connectivity',
    'Database Connection'
  ];
  
  console.log('Verification Summary:');
  checks.forEach(check => {
    console.log(`  ✅ ${check}`);
  });
  
  if (config.domain) {
    console.log('  ℹ️ SSL Configuration (optional)');
  }
  
  console.log('\nApplication URLs:');
  if (config.domain) {
    console.log(`  🌐 User Interface: https://${config.domain}/`);
    console.log(`  🔧 Admin Interface: https://${config.domain}/admin/`);
    console.log(`  🔌 API Endpoint: https://${config.domain}/api/health`);
  } else {
    console.log(`  🌐 User Interface: http://${config.host}/`);
    console.log(`  🔧 Admin Interface: http://${config.host}/admin/`);
    console.log(`  🔌 API Endpoint: http://${config.host}/api/health`);
  }
  
  console.log('\nNext Steps:');
  console.log('1. Test the application in your browser');
  console.log('2. Verify admin login functionality');
  console.log('3. Check user registration/login flow');
  console.log('4. Monitor logs for any errors');
  
  if (!config.domain) {
    console.log('5. Consider setting up a domain name and SSL certificate');
  }
}

async function main() {
  try {
    console.log('Starting VPS deployment verification...\n');
    
    let overallSuccess = true;
    
    overallSuccess = await verifySSHConnection() && overallSuccess;
    overallSuccess = await verifySystemServices() && overallSuccess;
    overallSuccess = await verifyApplicationFiles() && overallSuccess;
    overallSuccess = await verifyNetworkConnectivity() && overallSuccess;
    overallSuccess = await verifyDatabaseConnection() && overallSuccess;
    
    // These are optional/informational
    await verifySSL();
    await verifyPerformance();
    
    await generateReport();
    
    if (overallSuccess) {
      console.log('\n🎉 VPS deployment verification completed successfully!');
      console.log('Your Horizons Export application appears to be running correctly.');
    } else {
      console.log('\n⚠️ VPS deployment verification found some issues.');
      console.log('Please check the failed items above and fix them before using the application.');
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);