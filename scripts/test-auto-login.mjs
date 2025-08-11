import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function invoke(payload) {
  const { handler } = await import('../netlify/functions/auto-login.js');
  const event = {
    httpMethod: 'POST',
    headers: { host: 'localhost:8888', 'x-forwarded-proto': 'http' },
    body: JSON.stringify(payload),
  };
  const res = await handler(event);
  return { statusCode: res.statusCode, body: JSON.parse(res.body) };
}

(async () => {
  try {
    const payloadPath = path.join(__dirname, 'test-auto-login-payload.json');
    const json = JSON.parse(await readFile(payloadPath, 'utf8'));

    // 1) Google dry run (expect needsOtp: true)
    const r1 = await invoke(json);
  console.info('Test 1 (google dryRun):', r1);

    // 2) Facebook dry run (expect success: true)
    const r2 = await invoke({ account: 'fb@example.com', password: 'pass', platform: 'facebook', chrome: 'Default', dryRun: true });
  console.info('Test 2 (facebook dryRun):', r2);

    // 3) Outlook dry run with OTP provided (expect success: true)
    const r3 = await invoke({ account: 'outlook@example.com', password: 'pass', platform: 'outlook', chrome: 'Default', dryRun: true, otpCode: '123456' });
  console.info('Test 3 (outlook dryRun with otp):', r3);
  } catch (e) {
    console.error('Test failed:', e);
    process.exitCode = 1;
  }
})();
