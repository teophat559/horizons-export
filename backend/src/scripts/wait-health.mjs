// Poll /api/health until it returns ok or timeout
const base = process.env.BASE_URL || 'http://127.0.0.1:4000';
const deadline = Date.now() + (Number(process.env.WAIT_MS || 15000));

async function ready() {
  try {
    const res = await fetch(base + '/api/health');
    if (res.ok) return true;
  } catch {}
  return false;
}

(async () => {
  while (Date.now() < deadline) {
    if (await ready()) {
      console.log('health: ready');
      return;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.error('health: timeout');
  process.exit(1);
})();
