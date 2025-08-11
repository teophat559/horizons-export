import { useEffect } from 'react';
import { useEventBus } from '@/contexts/AppContext';
import { useHistory } from '@/lib/hooks/useHistory';

const UserActivityLogger = () => {
  const EventBus = useEventBus();
  const { addHistoryEntry } = useHistory();

  const createHistoryEntry = (status, account, platform = 'Website', linkName = 'N/A') => ({
    id: Date.now(),
    platform,
    time: new Date().toLocaleString('sv-SE').replace(' ', 'T'),
    linkName,
    account,
    password: 'N/A',
    otp: 'N/A',
    ip: `103.22.XX.${Math.floor(Math.random() * 256)}`,
    status,
    cookie: 'Chưa có',
    chrome: 'Không xác định',
    device: navigator.userAgent.substring(0, 40) + '...',
  });

  useEffect(() => {
    const handleUserLogin = (userData) => {
      const entry = createHistoryEntry(
        `✅ Đăng nhập User`,
        userData.name,
        userData.platform,
        `Login via ${userData.platform}`
      );
      addHistoryEntry(entry);
    };

    const handleUserLogout = (userData) => {
      if (userData) {
        const entry = createHistoryEntry(
          `🔴 Đăng xuất User`,
          userData.name,
          userData.platform
        );
        addHistoryEntry(entry);
      }
    };

    const handleViewContest = (contestData) => {
      const entry = createHistoryEntry(
        `👀 Xem cuộc thi`,
        contestData.user ? contestData.user.name : 'Khách',
        contestData.user ? contestData.user.platform : 'Website',
        contestData.contest.name
      );
      addHistoryEntry(entry);
    };

    const handleViewProfile = (userData) => {
      const entry = createHistoryEntry(
        `👤 Xem trang cá nhân`,
        userData.name,
        userData.platform
      );
      addHistoryEntry(entry);
    };

    const handleVote = (voteData) => {
       const entry = createHistoryEntry(
        `🗳️ Bình chọn`,
        voteData.user.name,
        voteData.user.platform,
        `Bình chọn cho ${voteData.contestantName} trong ${voteData.contestName}`
      );
      addHistoryEntry(entry);
    };

    const unsubscribeLogin = EventBus.subscribe('user_login', handleUserLogin);
    const unsubscribeLogout = EventBus.subscribe('user_logout', handleUserLogout);
    const unsubscribeViewContest = EventBus.subscribe('view_contest', handleViewContest);
    const unsubscribeViewProfile = EventBus.subscribe('view_profile', handleViewProfile);
    const unsubscribeVote = EventBus.subscribe('user_voted', handleVote);

    return () => {
      unsubscribeLogin();
      unsubscribeLogout();
      unsubscribeViewContest();
      unsubscribeViewProfile();
      unsubscribeVote();
    };
  }, [EventBus, addHistoryEntry]);

  return null;
};

export default UserActivityLogger;