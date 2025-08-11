import { useState, useEffect } from 'react';

const NOTIFICATIONS_STORAGE_KEY = 'systemNotifications';
const SOUND_SETTINGS_KEY = 'notificationSoundSettings';

const initialNotifications = [
  { id: 1, type: 'success', message: 'Login thành công từ IP 113.161.35.12', time: '5 phút trước', read: false, event: 'user_login' },
  { id: 2, type: 'warning', message: 'Tài khoản user2@example.com yêu cầu nhập mã OTP.', time: '15 phút trước', read: false, event: 'user_login' },
  { id: 3, type: 'error', message: 'Bot Chrome gặp lỗi bất thường khi login user5@example.com.', time: '1 giờ trước', read: true, event: 'user_login' },
  { id: 4, type: 'info', message: 'Admin đăng nhập thành công.', time: '2 giờ trước', read: true, event: 'admin_login' },
];

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
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialNotifications;
    } catch (error) {
      return initialNotifications;
    }
  });

  const [soundSettings, setSoundSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SOUND_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed.options)) {
          parsed.options = initialSoundOptions;
        }
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

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(soundSettings));
  }, [soundSettings]);

  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const deleteAll = () => {
    setNotifications([]);
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
  };
};