import { readdirSync, readFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Determine assets directory dynamically to support base '/' or '/admin/'
const root = process.cwd();
const adminRoot = join(root, 'public', 'admin');
const adminIndexPath = join(adminRoot, 'index.html');
let assetsDir = join(adminRoot, 'assets');

try {
  const html = existsSync(adminIndexPath) ? readFileSync(adminIndexPath, 'utf8') : '';
  const isRootBase = /src="\/assets\//i.test(html);
  if (isRootBase) {
    assetsDir = join(root, 'public', 'assets');
  }
} catch {}

// Check if assets directory exists
if (!existsSync(assetsDir)) {
  console.info(`[purge] assets directory not found: ${assetsDir}`);
  console.info('[purge] skipping legacy assets purge - no assets to clean');
  process.exit(0);
}

// Match any legacy PHP endpoints and the old /php-version prefix
const patterns = [/\.php(?![a-z])/i, /\/php-version/i];
// Known legacy bundles we saw lingering in output as a fallback safety
const knownLegacyFiles = [
  'index-4797de9c.js',
  'index-d9023fb7.js',
];

let removed = 0;

try {
  console.info(`[purge] scanning ${assetsDir} for legacy assets...`);
  const files = readdirSync(assetsDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);

  for (const file of files) {
    const full = join(assetsDir, file);
    try {
      const content = readFileSync(full, 'utf8');
      if (patterns.some((re) => re.test(content))) {
        unlinkSync(full);
        removed++;
        console.info(`[purge] removed legacy asset: ${file}`);
      }
    } catch (err) {
      console.warn(`[purge] skip ${file}: ${err?.message || err}`);
    }
  }

  // Fallback: explicitly remove known legacy bundle filenames if they still exist
  for (const legacy of knownLegacyFiles) {
    const p = join(assetsDir, legacy);
    if (existsSync(p)) {
      try {
        unlinkSync(p);
        removed++;
        console.info(`[purge] removed known legacy bundle: ${legacy}`);
      } catch (err) {
        console.warn(`[purge] failed to remove ${legacy}: ${err?.message || err}`);
      }
    }
  }

  // Keep only the entrypoint JS referenced by admin index.html; remove other index-*.js bundles
  try {
    const adminIndex = join(process.cwd(), 'public', 'admin', 'index.html');
    if (existsSync(adminIndex)) {
      const html = readFileSync(adminIndex, 'utf8');
      const match = html.match(/src=\"\/admin\/assets\/(index-[a-z0-9]+\.js)\"/i);
      const keepJs = match ? match[1] : null;
      if (keepJs) {
        const assetFiles = readdirSync(assetsDir, { withFileTypes: true })
          .filter((d) => d.isFile())
          .map((d) => d.name);
        for (const f of assetFiles) {
          if (/^index-.*\.js$/i.test(f) && f !== keepJs) {
            try {
              unlinkSync(join(assetsDir, f));
              removed++;
              console.info(`[purge] removed extra index bundle: ${f}`);
            } catch (err) {
              console.warn(`[purge] failed to remove ${f}: ${err?.message || err}`);
            }
          }
        }
      }
    } else {
      console.info('[purge] admin index.html not found, skipping index bundle cleanup');
    }
  } catch (err) {
    console.warn('[purge] error during index bundle cleanup:', err?.message || err);
  }

  console.info(`[purge] done. removed ${removed} file(s).`);
  process.exit(0);
} catch (err) {
  console.error('[purge] failed:', err?.message || err);
  process.exit(1);
}
