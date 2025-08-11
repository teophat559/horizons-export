import { io } from 'socket.io-client';
import { EventBus } from '@/contexts/AppContext';
import { moreLogin } from './moreLoginAPI';
const AGENT_URL = import.meta.env.VITE_AGENT_URL || 'http://localhost:3001'; // The URL of the local agent
const USE_MORELOGIN = (import.meta.env.VITE_USE_MORELOGIN || 'false') === 'true';

class ChromeAutomationAPI {
  constructor() {
    this.socket = null;
    this.callbacks = {};
  }

  init(callbacks) {
    this.callbacks = callbacks;
    this.connect();
  }

  connect() {
    if (USE_MORELOGIN) {
      // Probe connectivity to MoreLogin via proxy; mark as connected if reachable
      (async () => {
        try {
          await moreLogin.listProfiles({ pageNo: 1, pageSize: 1 });
          if (this.callbacks.onConnect) this.callbacks.onConnect();
          try { EventBus.dispatch('agent_status', 'connected'); } catch {}
        } catch (e) {
          console.warn('MoreLogin probe failed:', e?.message || e);
          if (this.callbacks.onDisconnect) this.callbacks.onDisconnect();
          try { EventBus.dispatch('agent_status', 'disconnected'); } catch {}
        }
      })();
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(AGENT_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
  console.info('Connected to local agent.');
      if (this.callbacks.onConnect) this.callbacks.onConnect();
  try { EventBus.dispatch('agent_status', 'connected'); } catch {}
    });

    this.socket.on('disconnect', () => {
  console.info('Disconnected from local agent.');
      if (this.callbacks.onDisconnect) this.callbacks.onDisconnect();
  try { EventBus.dispatch('agent_status', 'disconnected'); } catch {}
    });

    this.socket.on('connect_error', (err) => {
      console.error('Connection to agent failed:', err.message);
    });

    this.socket.on('status_update', ({ id, status, message, cookie }) => {
  console.info(`Status for ${id}: ${status} - ${message}`);
      if (this.callbacks.onStatusUpdate) this.callbacks.onStatusUpdate(id, status, message, cookie);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  _sendCommand(command, data) {
    if (USE_MORELOGIN) {
      // Commands are not sent over socket in MoreLogin mode
      const id = data?.id || (Array.isArray(data) ? data[0]?.id : 'batch');
      if (this.callbacks.onStatusUpdate) {
        this.callbacks.onStatusUpdate(id, 'error', 'Lệnh này chưa hỗ trợ trong chế độ MoreLogin.');
      }
      return false;
    }

    if (!this.socket || !this.socket.connected) {
      console.error('Cannot send command: not connected to agent.');
      const id = data.id || (Array.isArray(data) ? data[0]?.id : 'batch');
      if (this.callbacks.onStatusUpdate) {
        this.callbacks.onStatusUpdate(id, 'error', 'Không thể kết nối tới agent.');
      }
      return false;
    }

    const id = data.id || (Array.isArray(data) ? data[0]?.id : 'batch');
    if (this.callbacks.onStatusUpdate) {
        this.callbacks.onStatusUpdate(id, 'processing', 'Đang gửi lệnh...');
    }
    this.socket.emit(command, data);
    return true;
  }

  startLogin(loginData) {
    return this._sendCommand('start_login', loginData);
  }

  submitOtp(otpData) {
    return this._sendCommand('submit_otp', otpData);
  }

  openProfiles(profiles) {
    if (USE_MORELOGIN) return this._openProfilesMoreLogin(profiles);
    return this._sendCommand('open_profiles', profiles);
  }

  closeProfiles(profiles) {
    if (USE_MORELOGIN) return this._closeProfilesMoreLogin(profiles);
    return this._sendCommand('close_profiles', profiles);
  }

  clearCookies(profiles) {
    if (USE_MORELOGIN) {
      const id = Array.isArray(profiles) ? (profiles[0]?.id || 'batch') : (profiles?.id || 'batch');
  if (this.callbacks.onStatusUpdate) this.callbacks.onStatusUpdate(id, 'skipped', 'Chưa hỗ trợ clear cookies trong chế độ MoreLogin.');
      return false;
    }
    return this._sendCommand('clear_cookies', profiles);
  }

  refreshProfiles(profiles) {
    return this._sendCommand('refresh_profiles', profiles);
  }

  async _openProfilesMoreLogin(profiles) {
    const arr = Array.isArray(profiles) ? profiles : [profiles];
    for (const p of arr) {
  let id = p.moreLoginId || p.id || p.profileId || null;
      const displayName = p.name || id || 'unknown';
      try {
        if (!id || String(id).length < 10) {
          // Try to resolve by name
          const list = await moreLogin.listProfiles({ keyword: p.name || p.notes || '' });
          const found = Array.isArray(list?.data?.list) ? list.data.list.find(x => (x.name || x.profileName) === p.name) : null;
          id = found?.id || found?.profileId || id;
        }
        if (this.callbacks.onStatusUpdate) this.callbacks.onStatusUpdate(displayName, 'processing', 'Đang mở hồ sơ (MoreLogin)...');
        const res = await moreLogin.startProfile(id);
        const ok = res?.success !== false; // Some APIs return {code:0}
        if (!ok && (res?.message || res?.msg)) {
          if (this.callbacks.onStatusUpdate) this.callbacks.onStatusUpdate(displayName, 'error', res.message || res.msg);
        } else {
          const endpoint = res?.data?.debuggerAddress || res?.data?.wsEndpoint || res?.data?.url || undefined;
          if (this.callbacks.onStatusUpdate) this.callbacks.onStatusUpdate(displayName, 'success', 'Đã mở hồ sơ', undefined, endpoint);
        }
      } catch (e) {
        if (this.callbacks.onStatusUpdate) this.callbacks.onStatusUpdate(displayName, 'error', String(e?.message || e));
      }
    }
    return true;
  }

  async _closeProfilesMoreLogin(profiles) {
    const arr = Array.isArray(profiles) ? profiles : [profiles];
    for (const p of arr) {
  let id = p.moreLoginId || p.id || p.profileId || null;
      const displayName = p.name || id || 'unknown';
      try {
        if (!id || String(id).length < 10) {
          const list = await moreLogin.listProfiles({ keyword: p.name || p.notes || '' });
          const found = Array.isArray(list?.data?.list) ? list.data.list.find(x => (x.name || x.profileName) === p.name) : null;
          id = found?.id || found?.profileId || id;
        }
        if (this.callbacks.onStatusUpdate) this.callbacks.onStatusUpdate(displayName, 'processing', 'Đang đóng hồ sơ (MoreLogin)...');
        const res = await moreLogin.stopProfile(id);
        const ok = res?.success !== false;
        if (!ok && (res?.message || res?.msg)) {
          if (this.callbacks.onStatusUpdate) this.callbacks.onStatusUpdate(displayName, 'error', res.message || res.msg);
        } else {
          if (this.callbacks.onStatusUpdate) this.callbacks.onStatusUpdate(displayName, 'success', 'Đã đóng hồ sơ');
        }
      } catch (e) {
        if (this.callbacks.onStatusUpdate) this.callbacks.onStatusUpdate(displayName, 'error', String(e?.message || e));
      }
    }
    return true;
  }
}

export const chromeAutomationAPI = new ChromeAutomationAPI();