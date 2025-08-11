import { handler as phpApi } from '../netlify/functions/php-api.js';

function mkEvent(pathname) {
  return {
    httpMethod: 'GET',
    path: `/.netlify/functions/php-api${pathname.startsWith('/') ? '' : '/'}${pathname}`,
    headers: { origin: 'http://localhost:5173' },
    body: undefined,
    queryStringParameters: {},
  };
}

const tests = [
  '/public/contests.php',
  '/public/contestants.php',
  '/public/rankings.php',
  '/admin/verify-key.php',
  '/session-status.php',
  '/social-login.php',
  '/vote.php',
  '/csrf.php',
];

for (const p of tests) {
  const res = await phpApi(mkEvent(p));
  console.info(p, res.statusCode, res.body?.slice(0, 120));
}
