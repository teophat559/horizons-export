#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { watch } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const isWindows = process.platform === 'win32';
const isAdminBuild = process.argv.includes('--admin');
const isUserBuild = process.argv.includes('--user');
const isWatch = process.argv.includes('--watch');
const isClean = process.argv.includes('--clean');
const isDeploy = process.argv.includes('--deploy');

console.log('🚀 Auto Build Script Started');
console.log('Options:', {
  admin: isAdminBuild,
  user: isUserBuild,
  watch: isWatch,
  clean: isClean,
  deploy: isDeploy
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = isWindows ? command.split(' ') : command.split(' ');

    log(`Running: ${command}`, 'cyan');

    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: isWindows,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`Command completed successfully: ${command}`, 'green');
        resolve();
      } else {
        log(`Command failed with code ${code}: ${command}`, 'red');
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      log(`Command error: ${error.message}`, 'red');
      reject(error);
    });
  });
}

async function runPreflight() {
  try {
    log('Running preflight checks...', 'yellow');
    await runCommand('npm run preflight');
    log('Preflight checks completed', 'green');
  } catch (error) {
    log('Preflight checks failed', 'red');
    throw error;
  }
}

async function cleanAdmin() {
  if (isAdminBuild && !isDeploy) {
    try {
      log('Cleaning admin build...', 'yellow');
      await runCommand('npm run clean:admin');
      log('Admin cleanup completed', 'green');
    } catch (error) {
      log('Admin cleanup failed', 'red');
      throw error;
    }
  } else if (isAdminBuild && isDeploy) {
    log('Skipping admin cleanup for deployment...', 'cyan');
  }
}

async function buildProject() {
  try {
    let buildCommand = 'npm run build';

    if (isAdminBuild) {
      if (isDeploy) {
        buildCommand = isWindows ? 'npm run build:admin:no-clean' : 'npm run build:admin:no-clean';
      } else {
        buildCommand = isWindows ? 'npm run build:admin' : 'npm run build:admin:nix';
      }
    } else if (isUserBuild) {
      buildCommand = isWindows ? 'npm run build:user' : 'npm run build:user:nix';
    }

    log(`Building project with: ${buildCommand}`, 'yellow');
    await runCommand(buildCommand);
    log('Build completed successfully', 'green');
  } catch (error) {
    log('Build failed', 'red');
    throw error;
  }
}

async function purgeLegacyAssets() {
  if (isAdminBuild) {
    try {
      log('Purging legacy assets...', 'yellow');
      await runCommand('npm run purge:legacy');
      log('Legacy assets purged', 'green');
    } catch (error) {
      log('Legacy assets purge failed, continuing...', 'yellow');
      // Don't throw error, continue with build
    }
  }
}

async function verifyAdminAssets() {
  if (isAdminBuild) {
    try {
      log('Verifying admin assets...', 'yellow');
      await runCommand('node scripts/verify-admin-assets.mjs');
      log('Admin assets verified', 'green');
    } catch (error) {
      log('Admin assets verification failed, continuing...', 'yellow');
      // Don't throw error, continue with build
    }
  }
}

async function deployToNetlify() {
  if (isDeploy) {
    try {
      log('Deploying to Netlify...', 'yellow');
      const deployCommand = isAdminBuild ? 'node scripts/deploy-admin-netlify.mjs' : 'node scripts/deploy-user-netlify.mjs';
      await runCommand(deployCommand);
      log('Deployment completed', 'green');
    } catch (error) {
      log('Deployment failed', 'red');
      throw error;
    }
  }
}

async function watchFiles() {
  if (!isWatch) return;

  log('Starting file watcher...', 'cyan');

  const watchPaths = [
    join(__dirname, '..', 'src'),
    join(__dirname, '..', 'public'),
    join(__dirname, '..', 'index.html')
  ];

  watchPaths.forEach(path => {
    watch(path, { recursive: true }, (eventType, filename) => {
      if (filename && !filename.includes('node_modules') && !filename.includes('.git')) {
        log(`File changed: ${filename}`, 'magenta');
        log('Rebuilding...', 'yellow');

        // Debounce rebuilds
        clearTimeout(global.rebuildTimeout);
        global.rebuildTimeout = setTimeout(async () => {
          try {
            await buildProject();
            log('Rebuild completed', 'green');
          } catch (error) {
            log('Rebuild failed', 'red');
          }
        }, 1000);
      }
    });
  });

  log('File watcher started. Press Ctrl+C to stop.', 'cyan');
}

async function main() {
  try {
    // Run preflight checks
    await runPreflight();

    // Clean admin if needed
    await cleanAdmin();

    // Build project
    await buildProject();

    // Post-build tasks
    await purgeLegacyAssets();
    await verifyAdminAssets();

    // Deploy if requested
    await deployToNetlify();

    // Start watching if requested
    if (isWatch) {
      await watchFiles();

      // Keep the process running
      process.stdin.resume();

      process.on('SIGINT', () => {
        log('Stopping auto build...', 'yellow');
        process.exit(0);
      });
    } else {
      log('Auto build completed successfully!', 'green');
    }

  } catch (error) {
    log(`Auto build failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
${colors.bright}Auto Build Script${colors.reset}

Usage: node scripts/auto-build.mjs [options]

Options:
  --admin          Build admin version
  --user           Build user version
  --watch          Watch for file changes and rebuild
  --clean          Clean before building
  --deploy         Deploy to Netlify after build
  --help, -h       Show this help message

Examples:
  node scripts/auto-build.mjs                    # Build once
  node scripts/auto-build.mjs --admin --watch    # Build admin with watch
  node scripts/auto-build.mjs --user --deploy    # Build user and deploy
  node scripts/auto-build.mjs --admin --watch --deploy  # Full admin build with watch and deploy
`);
  process.exit(0);
}

main();
