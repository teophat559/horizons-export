// Auto-login gate: optionally checks session status on load and emits user_login if valid
// Controlled by VITE_AUTO_LOGIN_ENABLED
import { EventBus } from '@/contexts/AppContext';
import { API_ENDPOINTS } from '@/lib/services/apiConfig';

const enabled = import.meta.env.VITE_AUTO_LOGIN_ENABLED === 'true';

export async function runAutoLoginGate() {
  if (!enabled) return;
  try {
    const res = await fetch(API_ENDPOINTS.sessionStatus, { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.authenticated && data?.user) {
      EventBus.dispatch('user_login', data.user);
    }
  } catch (e) {
    // Silent fail
    console.warn('autoLoginGate error:', e);
  }
}
