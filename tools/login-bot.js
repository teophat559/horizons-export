// Minimal login bot using HTTP; can be extended to Playwright if needed
import { API_ENDPOINTS } from '@/lib/services/apiConfig';

export async function runLoginBot({ username, password, provider = 'facebook' }) {
  try {
    const res = await fetch(API_ENDPOINTS.socialLogin, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, provider })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
