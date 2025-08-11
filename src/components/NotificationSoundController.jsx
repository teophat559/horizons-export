import React, { useEffect, useRef, useState } from 'react';

const SOUND_SETTINGS_KEY = 'notificationSoundSettings';

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

const NotificationSoundController = () => {
  const audioRef = useRef(null);
  const [soundSettings, setSoundSettings] = useState(getDefaultSoundSettings);
  const lastNotificationId = useRef(null);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(SOUND_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSoundSettings({ ...getDefaultSoundSettings(), ...parsed });
      } else {
        setSoundSettings(getDefaultSoundSettings());
      }
    } catch (error) {
      console.error("Failed to load sound settings:", error);
      setSoundSettings(getDefaultSoundSettings());
    }
  };

  useEffect(() => {
    loadSettings();
    window.addEventListener('storage', loadSettings);
    return () => window.removeEventListener('storage', loadSettings);
  }, []);

  const handleStorageChange = () => {
    try {
      const notificationsRaw = localStorage.getItem('systemNotifications');
      if (!notificationsRaw) return;

      const notifications = JSON.parse(notificationsRaw);
      if (notifications.length > 0) {
        const latestNotification = notifications[0];
        
        if (latestNotification.id !== lastNotificationId.current) {
          lastNotificationId.current = latestNotification.id;
          
          let soundEnabled = false;
          let soundSrc = '';

          if (latestNotification.event === 'user_visit' || latestNotification.event === 'user_login') {
            soundEnabled = soundSettings.userSoundEnabled;
            soundSrc = soundSettings.userSound;
          } else if (latestNotification.event === 'admin_login') {
            soundEnabled = soundSettings.adminSoundEnabled;
            soundSrc = soundSettings.adminSound;
          }
          
          if (soundEnabled && soundSrc && audioRef.current) {
            audioRef.current.src = soundSrc;
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
          }
        }
      }
    } catch (error) {
      console.error("Error processing notification for sound:", error);
    }
  };

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [soundSettings]); 

  return <audio ref={audioRef} />;
};

export default NotificationSoundController;