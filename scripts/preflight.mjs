#!/usr/bin/env node
/**
 * Preflight scanner for production readiness
 * - Scans workspace for risky patterns (debugger, console.log, TODO/FIXME, mock/demo/test files)
 * - Separates severity: HIGH (fail), WARN (report only)
 * - Respects an optional allowlist file: preflight-allowlist.json
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const IS_CI = String(process.env.CI || '').toLowerCase() === 'true';
const PREVIEW = String(process.env.PREFLIGHT_PREVIEW || '').toLowerCase() === 'true';
const NODE_ALLOW_BIG = 1; // keep memory usage modest

const DEFAULT_EXCLUDES = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.vscode',
  '.netlify',
  '.turbo',
  '.next',
  '.vercel',
  'coverage',
  'backend/uploads',
  'uploads',
  'public/admin/assets',
  'vite.config.js.timestamp.mjs',
  // vendor cache/lock
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
];

const FILE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.html', '.css']);
const TEXT_LIKE = new Set(['.md', '.env', '.toml', '.yml', '.yaml']);

function normalize(p) { return p.replace(/\\/g, '/'); }

async function loadAllowlist() {
  const allowPath = path.join(ROOT, 'preflight-allowlist.json');
  try {
    const txt = await fs.readFile(allowPath, 'utf8');
    const json = JSON.parse(txt);
    return Array.isArray(json?.paths) ? json.paths.map(String) : [];
  } catch { return []; }
}

function isExcluded(rel) {
  // Exclude any nested node_modules or build artefacts
  if (/(^|\/)node_modules(\/|$)/.test(rel)) return true;
  if (/(^|\/)\.cache(\/|$)/.test(rel)) return true;
  return DEFAULT_EXCLUDES.some(prefix => rel === prefix || rel.startsWith(prefix + '/'));
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const rel = normalize(path.relative(ROOT, abs));
    if (isExcluded(rel)) continue;
    if (e.isDirectory()) {
      yield* walk(abs);
    } else if (e.isFile()) {
      yield { abs, rel };
    }
  }
}

function severityOfFinding(kind) {
  switch (kind) {
    case 'debugger':
    case 'console_log_client':
    case 'lorem_ipsum_client':
    case 'mock_file_client':
      return 'HIGH';
    default:
      return 'WARN';
  }
}

function classify(rel, content) {
  const ext = path.extname(rel).toLowerCase();
  const isCode = FILE_EXTS.has(ext);
  const isText = TEXT_LIKE.has(ext);
  const findings = [];
  const add = (kind, message, line) => findings.push({ kind, message, line });

  if (isCode) {
    // debugger statements
    if (/^\s*debugger\s*;?/m.test(content)) add('debugger', 'Found debugger statement', null);
    // console.log/debug (ignore in tooling scripts)
    const skipConsoleLog = rel.startsWith('scripts/') || rel.startsWith('backend/src/scripts/');
    if (!skipConsoleLog && /console\.(log|debug)\s*\(/.test(content)) {
      if (rel.startsWith('src/')) add('console_log_client', 'console.log/debug in client code', null);
      else add('console_log', 'console.log/debug in non-client code', null);
    }
    // TODO/FIXME/HACK
    if (/(TODO|FIXME|HACK)\s*:/.test(content)) add('todo', 'Found TODO/FIXME/HACK comment', null);
  // lorem ipsum (skip self-detection in this script)
  const skipLorem = rel === 'scripts/preflight.mjs';
  if (!skipLorem && /lorem ipsum/i.test(content)) {
      if (rel.startsWith('src/')) add('lorem_ipsum_client', 'Lorem ipsum placeholder in client code', null);
      else add('lorem_ipsum', 'Lorem ipsum placeholder', null);
    }
  }

  // File path heuristics for demo/mock/test
  if (/(^|\/)__tests__(\/|$)|\.(spec|test)\.[cm]?[jt]sx?$/.test(rel)) add('test_file', 'Test file present', null);
  if (/(^|\/)__mocks__(\/|$)|(^|\/)fixtures(\/|$)|(^|\/)mock(s)?(\/|$)|(^|\/)demo(\/|$)|(^|\/)examples?(\/|$)/i.test(rel)) {
    if (rel.startsWith('src/')) add('mock_file_client', 'Mock/demo file inside client', null);
    else add('mock_file', 'Mock/demo file present', null);
  }
  if (/requests\/.+\.http$/i.test(rel)) add('http_request_file', 'HTTP request file present (dev-only)', null);
  if (/\.env(\.|$).*example/i.test(rel)) add('env_example', '.env example file present', null);

  return findings;
}

async function main() {
  const allowlist = await loadAllowlist();
  const findings = [];

  for await (const { abs, rel } of walk(ROOT)) {
    // Only scan text-like files to avoid large binaries
    const ext = path.extname(rel).toLowerCase();
    const scan = FILE_EXTS.has(ext) || TEXT_LIKE.has(ext) || /\.(http|json|toml|conf|config)$/.test(ext) || rel.endsWith('.http');
    if (!scan) continue;

    // Allowlist
    if (allowlist.some(p => rel === p || rel.startsWith(p.endsWith('/') ? p : p + ''))) continue;

    let content;
    try { content = await fs.readFile(abs, 'utf8'); }
    catch { continue; }

    const f = classify(rel, content);
    if (f.length) {
      for (const it of f) {
        findings.push({ rel, ...it, severity: severityOfFinding(it.kind) });
      }
    }
  }

  const high = findings.filter(f => f.severity === 'HIGH');
  const warn = findings.filter(f => f.severity !== 'HIGH');

  const summary = {
    high: high.length,
    warn: warn.length,
  };

  const format = (f) => `- [${f.severity}] ${f.kind} :: ${f.rel} :: ${f.message}${f.line ? ' @' + f.line : ''}`;

  if (findings.length) {
  console.info('Preflight findings:');
  findings.forEach(f => console.info(format(f)));
  } else {
  console.info('Preflight clean: no issues found.');
  }

  if (high.length && !PREVIEW) {
  console.error(`\nPreflight failed: ${high.length} HIGH issue(s). Use PREFLIGHT_PREVIEW=true to preview without failing.`);
    process.exit(1);
  }

  console.info(`\nSummary: ${summary.high} HIGH, ${summary.warn} WARN.`);
}

main().catch((e) => {
  console.error('Preflight error:', e);
  process.exit(2);
});
