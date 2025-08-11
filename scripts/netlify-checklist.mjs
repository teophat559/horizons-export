#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--api' || a === '--api-url') out.api = args[++i];
    else if (a === '--admin-origin') out.adminOrigin = args[++i];
    else if (a === '--user-origin') out.userOrigin = args[++i];
  }
  return out;
}

function loadEnvExampleApi() {
  try {
    const envEx = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8');
    const m = envEx.match(/^VITE_API_URL\s*=\s*(.+)$/m);
    if (m && m[1]) return m[1].trim();
  } catch {}
  return '';
}

function checkRedirectsCsp(api) {
  try {
    const content = readFileSync(resolve(process.cwd(), 'public', '_redirects'), 'utf8');
    const hasPlaceholder = content.includes('api.yourdomain.com');
    const hasApi = api && content.includes(api.replace(/\/$/, ''));
    return { found: true, needsUpdate: hasPlaceholder && !hasApi };
  } catch {
    return { found: false, needsUpdate: false };
  }
}

function printSection(title) {
  console.log('\n=== ' + title + ' ===');
}

function printKV(k, v) {
  const key = (k + ':').padEnd(18, ' ');
  console.log(`- ${key} ${v}`);
}

function main() {
  const args = parseArgs();
  const api = (args.api || loadEnvExampleApi() || 'https://api.yourdomain.com').replace(/\/$/, '');

  const admin = {
    baseDir: '.',
    build: 'npm run build:admin',
    publish: 'dist',
    env: {
      VITE_API_URL: api,
      VITE_BASE_PATH: '/',
      VITE_OUT_DIR: 'dist',
    },
  };

  const user = {
    baseDir: '.',
    build: 'npm run build',
    publish: 'dist',
    env: {
      VITE_API_URL: api,
      VITE_BASE_PATH: '/',
      // VITE_OUT_DIR is optional for user; Vite defaults to dist
    },
  };

  printSection('Netlify Form — Admin site');
  printKV('Base directory', admin.baseDir);
  printKV('Build command', admin.build);
  printKV('Publish directory', admin.publish);
  printKV('ENV VITE_API_URL', admin.env.VITE_API_URL);
  printKV('ENV VITE_BASE_PATH', admin.env.VITE_BASE_PATH);
  printKV('ENV VITE_OUT_DIR', admin.env.VITE_OUT_DIR);

  printSection('Netlify Form — User site');
  printKV('Base directory', user.baseDir);
  printKV('Build command', user.build);
  printKV('Publish directory', user.publish);
  printKV('ENV VITE_API_URL', user.env.VITE_API_URL);
  printKV('ENV VITE_BASE_PATH', user.env.VITE_BASE_PATH);

  const csp = checkRedirectsCsp(api);
  printSection('CSP check (public/_redirects)');
  if (!csp.found) {
    console.log('- Not found: public/_redirects');
  } else if (csp.needsUpdate) {
    console.log(`- Update needed: replace api.yourdomain.com with ${api}`);
  } else {
    console.log('- OK: CSP connect-src appears consistent with API URL');
  }

  printSection('Backend ALLOWED_ORIGINS (Render)');
  const adminO = args.adminOrigin || 'https://admin-your-site.netlify.app';
  const userO = args.userOrigin || 'https://your-site.netlify.app';
  console.log(`- Set: ALLOWED_ORIGINS=${adminO},${userO}`);
}

main();
