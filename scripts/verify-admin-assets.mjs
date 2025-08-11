import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const assetsDir = join(root, 'public', 'admin', 'assets');
const adminIndexHtml = join(root, 'public', 'admin', 'index.html');

function fail(msg, details) {
  console.error(`[verify] FAIL: ${msg}`);
  if (details) console.error(details);
  process.exit(1);
}

function ok(msg) {
  console.info(`[verify] ${msg}`);
}

try {
  const html = readFileSync(adminIndexHtml, 'utf8');
  const keepMatch = html.match(/src=\"\/admin\/assets\/(index-[a-z0-9]+\.js)\"/i);
  if (!keepMatch) fail('Không tìm thấy entrypoint index-*.js trong public/admin/index.html');
  const keepJs = keepMatch[1];

  const files = readdirSync(assetsDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);

  // 1) No asset content should include legacy .php or /php-version
  const offenders = [];
  const patterns = [/\.php(?![a-z])/i, /\/php-version/i];
  for (const f of files) {
    const p = join(assetsDir, f);
    try {
      const content = readFileSync(p, 'utf8');
      if (patterns.some((re) => re.test(content))) offenders.push(f);
    } catch {
      // ignore binary or read issues
    }
  }
  if (offenders.length) {
    fail('Phát hiện asset chứa tham chiếu .php hoặc /php-version', offenders.join('\n'));
  } else {
    ok('Không có asset tham chiếu .php hoặc /php-version');
  }

  // 2) Only keep one index-*.js (the one referenced by index.html)
  const extraIndex = files.filter((f) => /^index-.*\.js$/i.test(f) && f !== keepJs);
  if (extraIndex.length) {
    fail(`Phát hiện thừa bundle index-*.js ngoài entrypoint: ${keepJs}`, extraIndex.join('\n'));
  } else {
    ok(`Chỉ còn entrypoint: ${keepJs}`);
  }

  ok('Xác minh asset admin PASSED.');
  process.exit(0);
} catch (err) {
  fail('Lỗi khi xác minh asset admin', err?.stack || err?.message || String(err));
}
