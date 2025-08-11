import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const isAdmin = process.env.BUILD_TARGET === 'admin';
// For user builds, honor VITE_OUT_DIR; fallback to 'dist'.
const userOut = process.env.VITE_OUT_DIR || 'dist';

const srcDir = isAdmin ? join(root, 'netlify', 'admin') : join(root, 'netlify', 'user');
const destDir = isAdmin ? join(root, 'public', 'admin') : join(root, userOut);

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

try {
  ensureDir(destDir);

  for (const f of ['_headers', '_redirects']) {
    const src = join(srcDir, f);
    if (existsSync(src)) {
      const dest = join(destDir, f);
      copyFileSync(src, dest);
      console.info(`[copy-netlify] copied ${f} -> ${dest}`);
    } else {
      console.info(`[copy-netlify] skip ${f}: not found in ${srcDir}`);
    }
  }

  process.exit(0);
} catch (err) {
  console.error('[copy-netlify] failed:', err?.message || err);
  process.exit(1);
}
