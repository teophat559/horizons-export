import { useState, useEffect, useCallback } from 'react';

const HISTORY_STORAGE_KEY = 'loginHistory';
const VIDEO_HISTORY_STORAGE_KEY = 'videoHistory';

const initialHistoryData = [
  {
    id: 'user-1668578001',
    time: '2025-07-19T10:30:15',
    platform: 'Facebook',
    linkName: 'Acc chính seeding',
    userLink: 'https://bvote.net/user/fb_1',
    account: 'user_fb_1',
    password: 'password123',
    otp: 'N/A',
    ip: '192.168.1.1',
    status: '✅ Thành công',
    cookie: 'c_user=123...;',
    chrome: 'Profile 1',
    device: 'Chrome on Windows',
  },
  {
    id: 'user-1668578002',
    time: '2025-07-19T10:32:45',
    platform: 'Gmail',
    linkName: 'Acc phụ seeding',
    userLink: 'https://bvote.net/user/gm_1',
    account: 'test@gmail.com',
    password: 'password123',
    otp: 'N/A',
    ip: '10.0.0.5',
    status: '🟡 Chờ phê duyệt',
    cookie: 'Chờ...',
    chrome: 'Profile 2',
    device: 'Chrome on macOS',
  },
  {
    id: 'user-1668578003',
    time: '2025-07-19T10:35:02',
    platform: 'Zalo',
    linkName: 'Tài khoản Zalo',
    userLink: 'https://bvote.net/user/zl_1',
    account: '0987654321',
    password: 'password123',
    otp: 'N/A',
    ip: '172.16.0.10',
    status: '🟠 Captcha',
    cookie: 'Chờ...',
    chrome: 'Profile 3',
    device: 'Zalo PC',
  },
  {
    id: 'user-1668578004',
    time: '2025-07-19T10:38:11',
    platform: 'Instagram',
    linkName: 'Insta clone',
    userLink: 'https://bvote.net/user/ig_1',
    account: 'clone_insta',
    password: 'password123',
    otp: 'N/A',
    ip: '192.168.1.2',
    status: '❌ Sai mật khẩu',
    cookie: 'Không',
    chrome: 'Profile 4',
    device: 'Chrome on Windows',
  },
  {
    id: 'user-1668578005',
    time: '2025-07-19T10:40:20',
    platform: 'Hotmail',
    linkName: 'Acc Hotmail',
    userLink: 'https://bvote.net/user/hm_1',
    account: 'test@hotmail.com',
    password: 'password123',
    otp: 'N/A',
    ip: '192.168.1.5',
    status: 'ℹ️ Yêu cầu OTP',
    cookie: 'Chờ...',
    chrome: 'Profile 5',
    device: 'Chrome on Windows',
  },
];

const initialVideoHistoryData = [
    {
        id: 'vid-1',
        time: '2025-07-19T11:00:00',
        profile: 'Profile 1',
        status: 'Đã ghi',
        duration: '00:35',
        fileSize: '5.2 MB',
        thumbnail: 'https://via.placeholder.com/150/92c952',
    },
    {
        id: 'vid-2',
        time: '2025-07-19T11:05:00',
        profile: 'Profile 2',
        status: 'Đang ghi...',
        duration: '01:12',
        fileSize: 'N/A',
        thumbnail: 'https://via.placeholder.com/150/771796',
    }
];

export const useHistory = () => {
  const [history, setHistory] = useState([]);
  const [videoHistory, setVideoHistory] = useState([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      setHistory(storedHistory ? JSON.parse(storedHistory) : initialHistoryData);
    } catch (error) {
      console.error('Failed to load history from localStorage:', error);
      setHistory(initialHistoryData);
    }
    try {
      const storedVideoHistory = localStorage.getItem(VIDEO_HISTORY_STORAGE_KEY);
      setVideoHistory(storedVideoHistory ? JSON.parse(storedVideoHistory) : initialVideoHistoryData);
    } catch (error) {
      console.error('Failed to load video history from localStorage:', error);
      setVideoHistory(initialVideoHistoryData);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history to localStorage:', error);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(VIDEO_HISTORY_STORAGE_KEY, JSON.stringify(videoHistory));
    } catch (error) {
      console.error('Failed to save video history to localStorage:', error);
    }
  }, [videoHistory]);

  const addHistoryEntry = useCallback((newEntry) => {
    setHistory(prevHistory => [newEntry, ...prevHistory]);
  }, []);

  const updateHistoryEntry = useCallback((id, updates) => {
    setHistory(prevHistory =>
      prevHistory.map(item =>
        item.id === id ? { ...item, ...updates, time: new Date().toISOString() } : item
      )
    );
  }, []);

  const removeHistoryEntries = useCallback((ids) => {
    setHistory(prev => prev.filter(item => !ids.includes(item.id)));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const removeVideoHistoryEntries = useCallback((ids) => {
    setVideoHistory(prev => prev.filter(item => !ids.includes(item.id)));
  }, []);

  return { 
    history, 
    addHistoryEntry, 
    updateHistoryEntry, 
    removeHistoryEntries, 
    clearHistory,
    videoHistory,
    removeVideoHistoryEntries,
    setVideoHistory
  };
};