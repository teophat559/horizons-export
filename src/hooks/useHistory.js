import { useState, useEffect } from 'react';

const HISTORY_STORAGE_KEY = 'loginHistoryData';

const initialData = [
  {
    id: 1,
    time: '2025-06-25 10:30:15',
    linkName: 'Acc chính seeding',
    account: 'user_fb_1',
    password: 'password123',
    otp: 'N/A',
    ip: '192.168.1.1',
    status: '✅ Thành công',
    cookie: 'c_user=123...; xs=abc...;',
    chrome: 'Profile 1',
    platform: 'Facebook',
    device: 'Desktop'
  },
  {
    id: 2,
    time: '2025-06-25 10:32:45',
    linkName: 'Acc phụ seeding',
    account: 'test@gmail.com',
    password: 'securepassword',
    otp: 'N/A',
    ip: '10.0.0.5',
    status: '🟡 Phê Duyệt',
    cookie: 'Chờ...',
    chrome: 'Profile 2',
    platform: 'Gmail',
    device: 'Mobile'
  },
  {
    id: 3,
    time: '2025-06-25 10:35:02',
    linkName: 'Tài khoản Zalo',
    account: '0987654321',
    password: 'zalo_pass',
    otp: 'N/A',
    ip: '172.16.0.10',
    status: '🟠 Captcha',
    cookie: 'Chờ...',
    chrome: 'Profile 3',
    platform: 'Zalo',
    device: 'Desktop'
  },
  {
    id: 4,
    time: '2025-06-25 10:38:11',
    linkName: 'Insta clone',
    account: 'clone_insta',
    password: 'wrongpass',
    otp: 'N/A',
    ip: '192.168.1.2',
    status: '❌ Sai mật khẩu',
    cookie: '❌ Không',
    chrome: 'Profile 4',
    platform: 'Instagram',
    device: 'Mobile'
  },
    {
    id: 5,
    time: '2025-06-25 10:40:20',
    linkName: 'Acc Hotmail',
    account: 'test@hotmail.com',
    password: 'password123',
    otp: 'N/A',
    ip: '192.168.1.5',
    status: '🟡 Nhận Code',
    cookie: 'Chờ...',
    chrome: 'Profile 5',
    platform: 'Hotmail',
    device: 'Desktop'
  }
];

export const useHistory = () => {
  const [historyData, setHistoryData] = useState(() => {
    try {
      const savedData = localStorage.getItem(HISTORY_STORAGE_KEY);
      return savedData ? JSON.parse(savedData) : initialData;
    } catch (error) {
      console.error("Could not load history from localStorage", error);
      return initialData;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyData));
    } catch (error) {
      console.error("Could not save history to localStorage", error);
    }
  }, [historyData]);

  const addHistoryEntry = (newEntry) => {
    setHistoryData(prevData => {
        const newId = prevData.length > 0 ? Math.max(...prevData.map(item => item.id)) + 1 : 1;
        const entryWithDefaults = {
            id: newId,
            time: new Date().toLocaleString('vi-VN'),
            ...newEntry,
        };
        return [entryWithDefaults, ...prevData];
    });
  };

  const updateHistoryEntry = (id, updates) => {
    setHistoryData(prevData =>
      prevData.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };
  
  return { historyData, setHistoryData, addHistoryEntry, updateHistoryEntry };
};