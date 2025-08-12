#!/usr/bin/env node

/**
 * VPS Setup Script for Horizons Export
 * 
 * This script helps set up a fresh VPS server with all required dependencies
 * for running the Horizons Export application.
 * 
 * Usage:
 *   npm run setup:vps [-- --host=server-ip] [-- --dry-run]
 * 
 * Example:
 *   npm run setup:vps -- --host=192.168.1.100
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

const hasFlag = (name) => args.includes(`--${name}`);

const config = {
  host: getArg('host') || process.env.VPS_HOST,
  user: getArg('user') || process.env.VPS_USER || 'root',
  port: getArg('port') || process.env.VPS_PORT || '22',
  dryRun: hasFlag('dry-run'),
  skipFirewall: hasFlag('skip-firewall'),
  skipSSL: hasFlag('skip-ssl'),
  domain: getArg('domain') || process.env.VPS_DOMAIN
};

console.log('🔧 VPS Setup Script for Horizons Export\n');
console.log('Configuration:');
console.log(`  Host: ${config.host}`);
console.log(`  User: ${config.user}`);
console.log(`  Domain: ${config.domain || 'Not specified'}`);
console.log(`  Dry Run: ${config.dryRun}`);
console.log('');

if (!config.host) {
  console.error('❌ Error: VPS host not specified!');
  console.log('💡 Usage: npm run setup:vps -- --host=your-server-ip');
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

function runSSHCommand(command, description, allowFailure = false) {
  const sshCommand = `ssh -p ${config.port} ${config.user}@${config.host} "${command}"`;
  try {
    runCommand(sshCommand, description);
  } catch (error) {
    if (!allowFailure) {
      throw error;
    }
    console.log('   ⚠️ Command failed but continuing...\n');
  }
}

async function setupBasicDependencies() {
  console.log('📦 Installing Basic Dependencies...\n');
  
  // Update system
  runSSHCommand('apt update && apt upgrade -y', 'Updating system packages');
  
  // Install essential packages
  runSSHCommand(
    'apt install -y curl wget git nginx postgresql postgresql-contrib software-properties-common',
    'Installing essential packages (nginx, postgresql, git, etc.)'
  );
  
  // Install Node.js 20 (using NodeSource repository)
  runSSHCommand(
    'curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs',
    'Installing Node.js 20'
  );
  
  // Install PM2 globally
  runSSHCommand('npm install -g pm2', 'Installing PM2 process manager');
  
  // Verify installations
  runSSHCommand('node --version && npm --version && pm2 --version', 'Verifying Node.js and PM2 installation');
}

async function setupDatabase() {
  console.log('🗄️ Setting up PostgreSQL Database...\n');
  
  // Start and enable PostgreSQL
  runSSHCommand('systemctl start postgresql && systemctl enable postgresql', 'Starting PostgreSQL service');
  
  // Create database and user for the application
  const dbCommands = [
    "CREATE DATABASE horizons_export;",
    "CREATE USER horizons_user WITH PASSWORD 'horizons_password_change_me';",
    "GRANT ALL PRIVILEGES ON DATABASE horizons_export TO horizons_user;",
    "ALTER USER horizons_user CREATEDB;"
  ].join(' ');
  
  runSSHCommand(
    `sudo -u postgres psql -c "${dbCommands}"`,
    'Creating database and user',
    true // Allow failure in case database already exists
  );
  
  console.log('💡 Database created with default credentials:');
  console.log('   Database: horizons_export');
  console.log('   User: horizons_user');
  console.log('   Password: horizons_password_change_me');
  console.log('   ⚠️ IMPORTANT: Change the default password!');
}

async function setupNginx() {
  console.log('🌐 Setting up Nginx...\n');
  
  // Create web directories
  runSSHCommand('mkdir -p /var/www/horizons-export/public /var/www/horizons-export/admin', 'Creating web directories');
  
  // Set proper permissions
  runSSHCommand('chown -R www-data:www-data /var/www/horizons-export', 'Setting web directory permissions');
  
  // Remove default nginx site
  runSSHCommand('rm -f /etc/nginx/sites-enabled/default', 'Removing default nginx site', true);
  
  // Enable and start nginx
  runSSHCommand('systemctl start nginx && systemctl enable nginx', 'Starting and enabling nginx');
  
  console.log('💡 Nginx is now running. Configuration will be copied during deployment.');
}

async function setupFirewall() {
  if (config.skipFirewall) {
    console.log('🛡️ Skipping firewall setup (--skip-firewall flag used)\n');
    return;
  }
  
  console.log('🛡️ Setting up Firewall...\n');
  
  // Install and configure UFW
  runSSHCommand('apt install -y ufw', 'Installing UFW firewall');
  
  // Set default policies
  runSSHCommand('ufw --force reset', 'Resetting firewall rules');
  runSSHCommand('ufw default deny incoming', 'Setting default deny for incoming');
  runSSHCommand('ufw default allow outgoing', 'Setting default allow for outgoing');
  
  // Allow essential services
  runSSHCommand('ufw allow ssh', 'Allowing SSH');
  runSSHCommand('ufw allow 80/tcp', 'Allowing HTTP');
  runSSHCommand('ufw allow 443/tcp', 'Allowing HTTPS');
  
  // Enable firewall
  runSSHCommand('ufw --force enable', 'Enabling firewall');
  
  // Show status
  runSSHCommand('ufw status verbose', 'Showing firewall status');
}

async function setupSSL() {
  if (config.skipSSL || !config.domain) {
    console.log('🔒 Skipping SSL setup (no domain specified or --skip-ssl flag used)\n');
    console.log('💡 To set up SSL later, run: certbot --nginx -d your-domain.com');
    return;
  }
  
  console.log('🔒 Setting up SSL with Let\'s Encrypt...\n');
  
  // Install certbot
  runSSHCommand('apt install -y certbot python3-certbot-nginx', 'Installing Certbot');
  
  // Get SSL certificate (this will only work if domain is pointing to the server)
  runSSHCommand(
    `certbot --nginx -d ${config.domain} --non-interactive --agree-tos --email admin@${config.domain}`,
    'Obtaining SSL certificate',
    true // Allow failure if domain is not configured yet
  );
  
  // Set up auto-renewal
  runSSHCommand('systemctl enable certbot.timer', 'Enabling SSL auto-renewal');
}

async function setupApplicationDirectories() {
  console.log('📁 Setting up Application Directories...\n');
  
  // Create backend directory
  runSSHCommand('mkdir -p /opt/horizons-backend', 'Creating backend directory');
  
  // Set up log directories
  runSSHCommand('mkdir -p /var/log/horizons-export', 'Creating log directory');
  
  // Set permissions
  runSSHCommand('chown -R $USER:$USER /opt/horizons-backend', 'Setting backend directory permissions');
  runSSHCommand('chown -R $USER:$USER /var/log/horizons-export', 'Setting log directory permissions');
}

async function generateEnvironmentTemplate() {
  console.log('📋 Generating Environment Configuration...\n');
  
  const envTemplate = `# Horizons Export Backend Configuration
# Generated by VPS setup script

NODE_ENV=production
PORT=4000

# Database Configuration
DATABASE_URL=postgresql://horizons_user:horizons_password_change_me@localhost:5432/horizons_export

# Security Keys (CHANGE THESE!)
JWT_SECRET=change_this_jwt_secret_to_something_secure
ADMIN_KEY=change_this_admin_key_to_something_secure

# CORS Configuration
ALLOWED_ORIGINS=https://${config.domain || 'your-domain.com'},https://www.${config.domain || 'your-domain.com'}

# Optional: Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: File upload limits
MAX_FILE_SIZE=10485760
`;

  // Write environment template to server
  runSSHCommand(
    `cat > /opt/horizons-backend/.env.template << 'EOF'
${envTemplate}
EOF`,
    'Creating environment template'
  );
  
  console.log('💡 Environment template created at /opt/horizons-backend/.env.template');
  console.log('💡 Copy this to .env and update the values before deployment!');
}

async function verifySetup() {
  console.log('🔍 Verifying VPS Setup...\n');
  
  // Check services
  runSSHCommand('systemctl is-active nginx postgresql', 'Checking service status');
  
  // Check Node.js and PM2
  runSSHCommand('node --version && npm --version && pm2 --version', 'Verifying Node.js installation');
  
  // Check database connectivity
  runSSHCommand('sudo -u postgres psql -c "SELECT version();" horizons_export', 'Testing database connection', true);
  
  // Check firewall if enabled
  if (!config.skipFirewall) {
    runSSHCommand('ufw status', 'Checking firewall status');
  }
  
  // Check disk space
  runSSHCommand('df -h /', 'Checking disk space');
  
  // Check memory
  runSSHCommand('free -m', 'Checking memory usage');
}

async function main() {
  try {
    console.log('Starting VPS setup...\n');
    
    // Test SSH connection
    runSSHCommand('echo "SSH connection successful" && whoami', 'Testing SSH connection');
    
    await setupBasicDependencies();
    await setupDatabase();
    await setupNginx();
    await setupFirewall();
    await setupSSL();
    await setupApplicationDirectories();
    await generateEnvironmentTemplate();
    await verifySetup();
    
    console.log('🎉 VPS Setup completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Copy /opt/horizons-backend/.env.template to .env and configure it');
    console.log('2. Update database password: sudo -u postgres psql');
    console.log('3. Configure your domain DNS to point to this server');
    console.log('4. Run deployment: npm run deploy:vps -- --host=' + config.host);
    
    if (config.domain) {
      console.log(`5. Your application will be available at: https://${config.domain}`);
    }
    
  } catch (error) {
    console.error('\n❌ VPS setup failed:', error.message);
    console.log('\n💡 You may need to run this script with sudo privileges on the VPS');
    console.log('💡 Or manually install missing dependencies');
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  VPS setup interrupted by user');
  process.exit(1);
});

main().catch(console.error);