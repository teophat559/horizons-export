import { useState, useEffect } from 'react';

const SOUND_SETTINGS_KEY = 'notificationSoundSettings';
import { API_ENDPOINTS } from '@/lib/services/apiConfig';
const API_NOTIFICATIONS = API_ENDPOINTS.adminNotifications;

const initialSoundOptions = [
  { value: '/sounds/notification.mp3', label: 'Mặc định' },
  { value: '/sounds/user_login.mp3', label: 'User Login' },
  { value: '/sounds/admin_login.mp3', label: 'Admin Login' },
];

const getDefaultSoundSettings = () => ({
  adminSoundEnabled: true,
  userSoundEnabled: true,
  adminSound: initialSoundOptions[2].value,
  userSound: initialSoundOptions[1].value,
  options: initialSoundOptions,
});

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const [soundSettings, setSoundSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SOUND_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed.options)) {
          parsed.options = initialSoundOptions;
        }
        // Migration from old `enabled` to new separate booleans
        if (parsed.enabled !== undefined) {
            parsed.adminSoundEnabled = parsed.enabled;
            parsed.userSoundEnabled = parsed.enabled;
            delete parsed.enabled;
        }
        return { ...getDefaultSoundSettings(), ...parsed };
      }
    } catch (error) {
      console.error("Failed to load sound settings, resetting to default.", error);
    }
    return getDefaultSoundSettings();
  });

  const fetchNotifications = async (userId = 0) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_NOTIFICATIONS}?user_id=${userId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setNotifications(data.data || []);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const updateNotifications = (newNotifications) => {
    setNotifications(newNotifications);
  };

  useEffect(() => {
    localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(soundSettings));
    window.dispatchEvent(new Event('storage'));
  }, [soundSettings]);

  const addNotification = async (notification) => {
    try {
      // If user_id provided, create; else just refresh
      if (notification.user_id) {
        const res = await fetch(API_NOTIFICATIONS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.__CSRF_TOKEN || '' },
          credentials: 'include',
          body: JSON.stringify({ user_id: notification.user_id, title: notification.title || 'Thông báo', type: notification.type || 'info', message: notification.message || '', csrf_token: window.__CSRF_TOKEN || '' })
        });
        const data = await res.json();
        if (data.success) {
          fetchNotifications(notification.user_id);
        }
      } else {
        fetchNotifications();
      }
    } catch (e) {
      console.error('Failed to add notification', e);
    }
  };

  const markAsRead = (id) => {
    const newNots = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    updateNotifications(newNots);
  };

  const markAllAsRead = () => {
    const newNots = notifications.map((n) => ({ ...n, read: true }));
    updateNotifications(newNots);
  };

  const deleteNotification = (id) => {
    // Endpoint for delete isn't defined; in production, implement API to delete.
    // For now, remove locally and consider adding API later.
    const newNots = notifications.filter((n) => n.id !== id);
    updateNotifications(newNots);
  };

  const deleteAll = () => {
    updateNotifications([]);
  };

  return {
  notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    soundSettings,
    setSoundSettings,
  loading,
  };
};