#!/usr/bin/env node
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { mode: 'dev', run: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dev') out.mode = 'dev';
    else if (a === '--prod') out.mode = 'prod';
    else if (a === '--run') out.run = true;
    else if (a === '--admin-origin') out.adminOrigin = args[++i];
    else if (a === '--user-origin') out.userOrigin = args[++i];
    else if (a === '--db-url') out.dbUrl = args[++i];
    else if (a === '--memory-db') out.memoryDb = args[++i];
    else if (a === '--admin-key') out.adminKey = args[++i];
    else if (a === '--jwt-secret') out.jwtSecret = args[++i];
  }
  return out;
}

function genSecret(bytes = 24) {
  return randomBytes(bytes).toString('hex');
}

function buildEnv(args) {
  const isProd = args.mode === 'prod';
  const useMemoryDb = (args.memoryDb ?? (isProd ? 'false' : 'true')).toString().toLowerCase() === 'true';
  const adminKey = args.adminKey || (isProd ? genSecret(24) : 'dev-admin-key');
  const jwtSecret = args.jwtSecret || (isProd ? genSecret(24) : 'dev-jwt-secret');
  const adminOrigin = (args.adminOrigin || '').trim();
  const userOrigin = (args.userOrigin || '').trim();

  const lines = [];
  lines.push(`NODE_ENV=${isProd ? 'production' : 'development'}`);
  lines.push('PORT=4000');
  lines.push('PORT_MAX_ATTEMPTS=50');
  lines.push('PORT_STEP=1');
  lines.push('');
  lines.push(`# Security`);
  lines.push(`ADMIN_KEY=${adminKey}`);
  lines.push(`JWT_SECRET=${jwtSecret}`);
  lines.push('');
  lines.push('# CORS allowed origins (comma-separated). REQUIRED in production.');
  if (adminOrigin || userOrigin) {
    lines.push(`ALLOWED_ORIGINS=${[adminOrigin, userOrigin].filter(Boolean).join(',')}`);
  } else {
    lines.push('ALLOWED_ORIGINS=');
  }
  lines.push('');
  lines.push('# Database');
  lines.push(`USE_MEMORY_DB=${useMemoryDb}`);
  if (!useMemoryDb) {
    lines.push(`DATABASE_URL=${args.dbUrl || 'postgres://USER:PASSWORD@HOST:5432/DBNAME'}`);
  }

  // Cookie defaults safe for cross-site if needed
  lines.push('');
  lines.push('# Session cookie settings');
  lines.push('SESSION_COOKIE_NAME=sid');
  lines.push('SESSION_COOKIE_PATH=/');
  lines.push('SESSION_COOKIE_SECURE=true');
  lines.push('SESSION_COOKIE_SAMESITE=none');
  lines.push('SESSION_COOKIE_HTTPONLY=true');

  return lines.join('\n') + '\n';
}

function writeBackendEnv(content) {
  const targetDir = resolve(process.cwd(), 'backend');
  const envPath = resolve(targetDir, '.env');
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
  writeFileSync(envPath, content, 'utf8');
  return envPath;
}

function printNextSteps(args) {
  console.log('\nNext steps:');
  console.log('- Verify ALLOWED_ORIGINS matches your two Netlify origins (admin + user).');
  console.log('- If using Postgres, set DATABASE_URL and ensure PGSSLMODE if required by provider.');
  console.log('- On frontend sites (Netlify), set VITE_API_URL to your API origin.');
}

async function maybeRun(args) {
  if (!args.run) return;
  const { spawn } = await import('node:child_process');

  function sh(cmd) {
    return new Promise((resolvePromise) => {
      const child = spawn(cmd, { shell: true, stdio: 'inherit' });
      child.on('exit', (code) => resolvePromise(code));
    });
  }

  console.log('\nInstalling backend deps...');
  let code = await sh('npm run backend:install');
  if (code !== 0) return process.exit(code);

  console.log('Starting backend (detached)...');
  code = await sh('npm run backend:dev:detached');
  if (code !== 0) return process.exit(code);

  console.log('Waiting for health...');
  code = await sh('npm run -s wait:health');
  if (code !== 0) return process.exit(code);

  console.log('\nAPI is up. Try: http://127.0.0.1:4000/api/health');
}

async function main() {
  const args = parseArgs();
  const env = buildEnv(args);
  const p = writeBackendEnv(env);
  console.log(`[setup-api] Wrote ${p}`);
  printNextSteps(args);
  await maybeRun(args);
}

main().catch((e) => {
  console.error('[setup-api] ERROR:', e?.stack || e?.message || String(e));
  process.exit(1);
});
