import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'public', 'admin');

try {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  console.info('[clean:admin] removed', dir);
  } else {
  console.info('[clean:admin] not found, skipping', dir);
  }
  process.exit(0);
} catch (err) {
  console.error('[clean:admin] failed:', err?.message || err);
  process.exit(1);
}
