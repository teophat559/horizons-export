#!/usr/bin/env node

/**
 * VPS Deployment Script for Horizons Export
 * 
 * This script automates the deployment of both frontend and backend to a VPS server.
 * 
 * Usage:
 *   npm run deploy:vps [-- --target=admin|user] [-- --host=server-ip] [-- --dry-run]
 * 
 * Example:
 *   npm run deploy:vps -- --target=admin --host=192.168.1.100
 *   npm run deploy:vps -- --target=user --host=example.com --dry-run
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
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

const hasFlag = (name) => args.includes(`--${name}`);

const config = {
  target: getArg('target') || 'admin', // admin or user
  host: getArg('host') || process.env.VPS_HOST,
  user: getArg('user') || process.env.VPS_USER || 'root',
  port: getArg('port') || process.env.VPS_PORT || '22',
  deployPath: getArg('deploy-path') || process.env.VPS_DEPLOY_PATH || '/var/www/horizons-export',
  backendPath: getArg('backend-path') || process.env.VPS_BACKEND_PATH || '/opt/horizons-backend',
  dryRun: hasFlag('dry-run'),
  skipBackend: hasFlag('skip-backend'),
  skipFrontend: hasFlag('skip-frontend'),
  nginxReload: !hasFlag('skip-nginx'),
  pm2Restart: !hasFlag('skip-pm2')
};

console.log('🚀 VPS Deployment Script for Horizons Export\n');
console.log('Configuration:');
console.log(`  Target: ${config.target}`);
console.log(`  Host: ${config.host}`);
console.log(`  User: ${config.user}`);
console.log(`  Frontend Deploy Path: ${config.deployPath}`);
console.log(`  Backend Path: ${config.backendPath}`);
console.log(`  Dry Run: ${config.dryRun}`);
console.log('');

if (!config.host) {
  console.error('❌ Error: VPS host not specified!');
  console.log('💡 Usage: npm run deploy:vps -- --host=your-server-ip');
  console.log('💡 Or set VPS_HOST environment variable');
  process.exit(1);
}

function runCommand(command, description) {
  console.log(`🔧 ${description}`);
  console.log(`   Command: ${command}`);
  
  if (config.dryRun) {
    console.log('   (Dry run - command not executed)');
    return;
  }
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      cwd: projectRoot,
      stdio: 'inherit'
    });
    console.log('   ✅ Success\n');
    return output;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    throw error;
  }
}

function runSSHCommand(command, description) {
  const sshCommand = `ssh -p ${config.port} ${config.user}@${config.host} "${command}"`;
  runCommand(sshCommand, description);
}

function uploadFile(localPath, remotePath, description) {
  const scpCommand = `scp -P ${config.port} -r "${localPath}" ${config.user}@${config.host}:"${remotePath}"`;
  runCommand(scpCommand, description);
}

async function deployFrontend() {
  console.log('📦 Deploying Frontend...\n');
  
  // Build frontend
  const buildScript = config.target === 'admin' ? 'build:admin:nix' : 'build:user:nix';
  runCommand(`npm run ${buildScript}`, `Building ${config.target} frontend`);
  
  // Determine build output directory
  const buildDir = config.target === 'admin' ? 'dist' : 'user/dist';
  const localBuildPath = join(projectRoot, buildDir);
  
  if (!existsSync(localBuildPath)) {
    throw new Error(`Build directory not found: ${localBuildPath}`);
  }
  
  // Create remote directory structure
  const remoteTargetPath = config.target === 'admin' 
    ? `${config.deployPath}/admin` 
    : `${config.deployPath}/public`;
    
  runSSHCommand(`mkdir -p ${remoteTargetPath}`, 'Creating remote directory');
  
  // Upload built files
  uploadFile(`${localBuildPath}/*`, remoteTargetPath, `Uploading ${config.target} files`);
  
  // Copy nginx configuration if exists
  const nginxConfigPath = join(projectRoot, 'nginx');
  if (existsSync(nginxConfigPath)) {
    runSSHCommand('mkdir -p /tmp/horizons-nginx', 'Creating nginx temp directory');
    uploadFile(`${nginxConfigPath}/*`, '/tmp/horizons-nginx/', 'Uploading nginx configuration');
    
    if (config.nginxReload) {
      runSSHCommand('cp /tmp/horizons-nginx/*.conf /etc/nginx/sites-available/ 2>/dev/null || true', 'Copying nginx config');
      runSSHCommand('nginx -t && systemctl reload nginx || echo "Nginx reload skipped"', 'Reloading nginx');
    }
  }
}

async function deployBackend() {
  console.log('🖥️  Deploying Backend...\n');
  
  // Create backend directory
  runSSHCommand(`mkdir -p ${config.backendPath}`, 'Creating backend directory');
  
  // Upload backend files (excluding node_modules)
  const backendLocalPath = join(projectRoot, 'backend');
  
  // Create temporary archive excluding node_modules
  runCommand(
    `cd ${backendLocalPath} && tar --exclude='node_modules' --exclude='.env' -czf /tmp/backend.tar.gz .`,
    'Creating backend archive'
  );
  
  // Upload and extract
  uploadFile('/tmp/backend.tar.gz', `${config.backendPath}/`, 'Uploading backend archive');
  runSSHCommand(`cd ${config.backendPath} && tar -xzf backend.tar.gz && rm backend.tar.gz`, 'Extracting backend');
  
  // Install dependencies
  runSSHCommand(`cd ${config.backendPath} && npm ci --production`, 'Installing backend dependencies');
  
  // Copy environment file if exists
  const envLocalPath = join(projectRoot, '.env.production');
  const envExamplePath = join(projectRoot, '.env.production.example');
  
  if (existsSync(envLocalPath)) {
    uploadFile(envLocalPath, `${config.backendPath}/.env`, 'Uploading production environment file');
  } else if (existsSync(envExamplePath)) {
    console.log('⚠️  Production .env not found, uploading example file');
    uploadFile(envExamplePath, `${config.backendPath}/.env.example`, 'Uploading environment example');
    console.log('💡 Remember to configure .env file on the server!');
  }
  
  // Upload PM2 configuration
  const pm2ConfigPath = join(projectRoot, 'backend/ecosystem.config.cjs');
  if (existsSync(pm2ConfigPath)) {
    uploadFile(pm2ConfigPath, `${config.backendPath}/ecosystem.config.cjs`, 'Uploading PM2 configuration');
    
    if (config.pm2Restart) {
      // Start/restart with PM2
      runSSHCommand(`cd ${config.backendPath} && pm2 start ecosystem.config.cjs || pm2 restart horizons-backend`, 'Starting/restarting backend with PM2');
      runSSHCommand('pm2 save', 'Saving PM2 configuration');
    }
  }
  
  // Run database migrations if needed
  runSSHCommand(`cd ${config.backendPath} && npm run migrate 2>/dev/null || echo "Migration skipped"`, 'Running database migrations');
}

async function verifyDeployment() {
  console.log('🔍 Verifying Deployment...\n');
  
  // Check if frontend files exist
  const frontendPath = config.target === 'admin' 
    ? `${config.deployPath}/admin/index.html`
    : `${config.deployPath}/public/index.html`;
    
  runSSHCommand(`test -f ${frontendPath} && echo "Frontend deployed successfully" || echo "Frontend deployment may have failed"`, 'Checking frontend deployment');
  
  if (!config.skipBackend) {
    // Check if backend is running
    runSSHCommand(`pm2 list | grep horizons-backend || echo "Backend not found in PM2"`, 'Checking backend status');
    
    // Check if backend responds to health check
    runSSHCommand(`curl -f http://localhost:4000/api/health 2>/dev/null && echo "Backend health check passed" || echo "Backend health check failed"`, 'Testing backend health');
  }
  
  // Check nginx configuration
  if (config.nginxReload) {
    runSSHCommand('nginx -t && echo "Nginx configuration valid" || echo "Nginx configuration has issues"', 'Validating nginx configuration');
  }
}

async function main() {
  try {
    console.log('Starting VPS deployment...\n');
    
    // Test SSH connection
    runSSHCommand('echo "SSH connection successful"', 'Testing SSH connection');
    
    if (!config.skipFrontend) {
      await deployFrontend();
    }
    
    if (!config.skipBackend) {
      await deployBackend();
    }
    
    await verifyDeployment();
    
    console.log('🎉 VPS Deployment completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Configure .env file on the server if needed');
    console.log('2. Set up SSL certificates if not already configured');
    console.log('3. Configure domain DNS to point to your VPS');
    console.log('4. Test your application in a browser');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Deployment interrupted by user');
  process.exit(1);
});

main().catch(console.error);