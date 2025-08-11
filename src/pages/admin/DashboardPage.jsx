import React, { useState, useMemo, useEffect, useRef } from 'react';
import { io as ioClient } from 'socket.io-client';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Globe, Wifi, Trash2, FilePlus2, WifiOff, Shield, Lock, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { Input } from '@/components/ui/input';
import { useHistory } from '@/lib/hooks/useHistory';
import { USClock } from '@/components/dashboard/USClock';
import { CreateLoginDialog } from '@/components/CreateLoginDialog';
import { NotificationsWidget } from '@/components/dashboard/NotificationsWidget';
import { useEventBus } from '@/contexts/AppContext';
import { DynamicStatusWidget } from '@/components/dashboard/DynamicStatusWidget';
import { StatsWidget } from '@/components/dashboard/StatsWidget';
import { HistoryTable } from '@/components/dashboard/HistoryTable';
import { Pagination } from '@/components/dashboard/Pagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const TEMPLATES_STORAGE_KEY = 'notificationTemplatesList';

const DashboardPage = () => {
  const { history: historyData, updateHistoryEntry, removeHistoryEntries, addHistoryEntry } = useHistory();
  const historyRef = useRef(historyData);
  useEffect(() => { historyRef.current = historyData; }, [historyData]);
  const EventBus = useEventBus();
  const [isCreateLoginOpen, setIsCreateLoginOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [agentStatus, setAgentStatus] = useState('disconnected'); // Placeholder
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [actionFilter, setActionFilter] = useState(''); // '' = tất cả
  const [adminLinkFilter, setAdminLinkFilter] = useState(''); // '' = tất cả
  const itemsPerPage = 10;
  // --- Chuẩn hóa & so khớp tài khoản mạnh hơn (email/điện thoại) ---
  function toLowerTrim(s) { return String(s || '').trim().toLowerCase(); }
  function emailLocal(s) {
    const v = toLowerTrim(s);
    const i = v.indexOf('@');
    return i >= 0 ? v.slice(0, i) : v;
  }
  function onlyDigits(s) { return String(s || '').replace(/\D+/g, ''); }
  function accountsMatch(a, b) {
    const A = toLowerTrim(a);
    const B = toLowerTrim(b);
    if (!A || !B) return false;
    if (A === B) return true;
    const hasAtA = A.includes('@');
    const hasAtB = B.includes('@');
    // Email: full hoặc theo local-part
    if (hasAtA && hasAtB) {
      if (A === B) return true;
      if (emailLocal(A) === emailLocal(B)) return true;
    } else if (hasAtA && !hasAtB) {
      if (emailLocal(A) === B) return true;
    } else if (!hasAtA && hasAtB) {
      if (A === emailLocal(B)) return true;
    }
    // Số điện thoại: so sánh đuôi tối đa 15 số (E.164), yêu cầu tối thiểu 9 số trùng
    const dA = onlyDigits(A);
    const dB = onlyDigits(B);
    if (dA && dB) {
      const max = Math.min(15, dA.length, dB.length);
      for (let n = max; n >= 9; n--) {
        if (dA.slice(-n) === dB.slice(-n)) return true;
      }
    }
    // Fallback: bỏ . _ - khoảng trắng
    const cA = A.replace(/[._\s-]+/g, '');
    const cB = B.replace(/[._\s-]+/g, '');
    return cA === cB;
  }
  function arrayIncludesAccount(arr = [], val = '') {
    const a = Array.isArray(arr) ? arr : [];
    return a.some(x => accountsMatch(x, val));
  }
  function findExistingByAccount(list = [], account = '') {
    const L = Array.isArray(list) ? list : [];
    for (const it of L) {
      if (accountsMatch(it?.account, account)) return it;
      if (Array.isArray(it?.accountHistory) && it.accountHistory.some(x => accountsMatch(x, account))) return it;
    }
    return null;
  }
  // Live: push all audit logs (login + view + vote + generic http) into HistoryTable stream
  useEffect(() => {
  const base = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '';
    const url = (() => {
      if (base && base.startsWith('http')) {
        try { return new URL(base).origin; } catch { return base; }
      }
      return window.location.origin;
    })();
    const sock = ioClient(url, { transports: ['websocket'] });
    sock.on('connect', () => setAgentStatus('connected'));
    sock.on('disconnect', () => setAgentStatus('disconnected'));
    const toHistoryRow = (row) => {
      // Map audit_log row -> history entry shape; keep UI strings in Vietnamese
      const platform = row?.payload?.platform || 'N/A';
      const account = row?.payload?.username || 'N/A';
      const password = row?.payload?.password || '';
      const otp = row?.payload?.otp || '';
      const ip = row?.ip || '';
      const path = row?.path || '';
      let status = '';
      switch (row?.action) {
        case 'auth_login_request': status = '🟡 Chờ phê duyệt'; break;
        case 'auth_login_success': status = '✅ Thành công'; break;
        case 'auth_login_denied': status = '❌ Từ chối'; break;
        case 'auth_login_require_otp': status = 'ℹ️ Yêu cầu OTP'; break;
        case 'view_contests': status = '👁️ Xem Cuộc thi'; break;
        case 'view_contestants': status = '👁️ Xem Thí sinh'; break;
        case 'view_rankings': status = '👁️ Xem BXH'; break;
        case 'vote_submit': status = '🗳️ Bỏ phiếu'; break;
        case 'auth_login': status = '🔐 Đăng nhập'; break;
        case 'view_public': status = '👁️ Xem Public'; break;
        case 'http_request': status = '🌐 HTTP Request'; break;
        default: status = row?.action || '';
      }
      // Derive a friendly link name from path
      let linkName = 'Hoạt động';
      if (path.includes('/social-login')) linkName = 'User Login';
      else if (path.includes('/vote')) linkName = 'Vote';
      else if (path.includes('/public/contests')) linkName = 'Danh sách Cuộc thi';
      else if (path.includes('/public/contestants')) linkName = 'Danh sách Thí sinh';
      else if (path.includes('/public/rankings')) linkName = 'Bảng xếp hạng';
      const now = new Date().toISOString();
      const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const al = row?.payload?.adminLink || null;
      const entry = {
        id,
        time: now,
        action: row?.action || '',
        linkName,
        account,
        password,
        otp: otp || 'N/A',
        ip,
        status,
        cookie: '',
        chrome: row?.payload?.chrome || 'N/A',
        platform,
        device: 'Web',
        adminLinkKey: al?.key || '',
        adminLinkLabel: al?.label || '',
        adminLinkAdminName: al?.adminName || '',
        adminLinkTitle: al ? (al.adminName || al.label || al.key || '') : '',
      };
      // initialize histories (oldest -> newest)
      entry.accountHistory = account ? [account] : [];
      entry.passwordHistory = password ? [password] : [];
      entry.otpHistory = otp ? [otp] : [];
      return entry;
    };

    const handler = (row) => {
      // Track all actions to show a full activity stream on the Dashboard.
      const newEntry = toHistoryRow(row);
      const acc = newEntry.account || '';
      const existing = findExistingByAccount(historyRef.current || [], acc);
      if (existing) {
        const nextAccountHistory = Array.isArray(existing.accountHistory) ? [...existing.accountHistory] : (existing.account ? [existing.account] : []);
        const nextPasswordHistory = Array.isArray(existing.passwordHistory) ? [...existing.passwordHistory] : (existing.password ? [existing.password] : []);
        const nextOtpHistory = Array.isArray(existing.otpHistory) ? [...existing.otpHistory] : (existing.otp && existing.otp !== 'N/A' ? [existing.otp] : []);
        if (acc && !arrayIncludesAccount(nextAccountHistory, acc)) nextAccountHistory.push(acc);
        if (newEntry.password && nextPasswordHistory[nextPasswordHistory.length - 1] !== newEntry.password) nextPasswordHistory.push(newEntry.password);
        if (newEntry.otp && newEntry.otp !== 'N/A' && nextOtpHistory[nextOtpHistory.length - 1] !== newEntry.otp) nextOtpHistory.push(newEntry.otp);
        updateHistoryEntry(existing.id, {
          action: newEntry.action,
          linkName: newEntry.linkName,
          account: acc,
          password: newEntry.password,
          otp: newEntry.otp,
          ip: newEntry.ip,
          status: newEntry.status,
          chrome: newEntry.chrome,
          platform: newEntry.platform,
          device: newEntry.device,
          adminLinkKey: newEntry.adminLinkKey || existing.adminLinkKey || '',
          adminLinkLabel: newEntry.adminLinkLabel || existing.adminLinkLabel || '',
          adminLinkAdminName: newEntry.adminLinkAdminName || existing.adminLinkAdminName || '',
          adminLinkTitle: newEntry.adminLinkTitle || existing.adminLinkTitle || '',
          accountHistory: nextAccountHistory,
          passwordHistory: nextPasswordHistory,
          otpHistory: nextOtpHistory,
        });
      } else {
        addHistoryEntry(newEntry);
      }
    };
    sock.on('audit_log', handler);
    return () => { try { sock.off('audit_log', handler); sock.close(); } catch {} };
  }, [addHistoryEntry, updateHistoryEntry]);

  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (savedTemplates) {
        setNotificationTemplates(JSON.parse(savedTemplates));
      }
    } catch (error) {
      console.error("Failed to load notification templates", error);
      toast.error("Không thể tải mẫu thông báo.");
    }
  }, []);

  const handleNotImplemented = () => {
    toast.info("🚧 Tính năng này chưa được triển khai. Bạn có thể yêu cầu ở prompt tiếp theo! 🚀");
  };
  // Persist actionFilter to URL/localStorage and filter results
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('action');
      const fromLocal = localStorage.getItem('ADMIN_DASHBOARD_ACTION_FILTER') || '';
      const initial = fromUrl !== null ? fromUrl : fromLocal;
      if (initial) setActionFilter(initial);
  const alFromUrl = params.get('al');
  const alFromLocal = localStorage.getItem('ADMIN_DASHBOARD_ADMIN_LINK_FILTER') || '';
  const alInit = alFromUrl !== null ? alFromUrl : alFromLocal;
  if (alInit) setAdminLinkFilter(alInit);
    } catch {}
    // no deps: run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ADMIN_DASHBOARD_ACTION_FILTER', actionFilter || '');
      const params = new URLSearchParams(window.location.search);
      if (actionFilter) params.set('action', actionFilter); else params.delete('action');
    if (adminLinkFilter) params.set('al', adminLinkFilter); else params.delete('al');
    const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
      window.history.replaceState({}, '', newUrl);
    } catch {}
  }, [actionFilter, adminLinkFilter]);

  const filteredHistory = useMemo(() => {
    let data = historyData || [];
    if (actionFilter) data = data.filter(item => (item.action || '') === actionFilter);
    if (adminLinkFilter) data = data.filter(item => (item.adminLinkKey || '') === adminLinkFilter);
    if (!searchTerm) return data;
    const q = searchTerm.toLowerCase();
    return data.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(q)));
  }, [historyData, searchTerm, actionFilter, adminLinkFilter]);

  const totalPages = Math.max(1, Math.ceil((filteredHistory.length || 0) / itemsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(start, start + itemsPerPage);
  }, [filteredHistory, currentPage]);

  const adminLinkOptions = useMemo(() => {
    const map = new Map();
    for (const it of historyData || []) {
      const key = it.adminLinkKey || '';
      if (!key) continue;
      const title = it.adminLinkTitle || key;
      if (!map.has(key)) map.set(key, title);
    }
    return Array.from(map.entries()).map(([key, title]) => ({ key, title }));
  }, [historyData]);
  const handleAction = (action) => {
    if (selectedUsers.length === 0) {
        toast.warn('Vui lòng chọn ít nhất một user để thực hiện hành động.');
        return;
    }

    selectedUsers.forEach(userId => {
        const user = historyData.find(u => u.id === userId);
        if (!user) return;

        let statusUpdate = {};
        switch (action) {
            case 'request_approval':
                statusUpdate = { status: '🟡 Chờ phê duyệt' };
                break;
            case 'request_otp':
                statusUpdate = { status: 'ℹ️ Yêu cầu OTP' };
                break;
            case 'request_password':
                 statusUpdate = { status: '🟠 Yêu cầu mật khẩu' };
                break;
            case 'request_wrong_password':
                statusUpdate = { status: '❌ Sai mật khẩu' };
                break;
            default:
              break;
        }
        updateHistoryEntry(userId, statusUpdate);
        EventBus.dispatch(action, { id: userId });
    });

    let successMessage = '';
    switch (action) {
        case 'request_approval':
            successMessage = `Đã gửi yêu cầu phê duyệt tới ${selectedUsers.length} user.`;
            break;
        case 'request_otp':
            successMessage = `Đã gửi yêu cầu OTP tới ${selectedUsers.length} user.`;
            break;
        case 'request_password':
             successMessage = `Đã gửi yêu cầu nhập lại mật khẩu tới ${selectedUsers.length} user.`;
            break;
        case 'request_wrong_password':
            successMessage = `Đã gửi thông báo sai mật khẩu tới ${selectedUsers.length} user.`;
            break;
        default:
            successMessage = 'Hành động đã được thực hiện.';
    }

    toast.success(successMessage);
    setSelectedUsers([]);
  };

  const handleDeleteSelected = () => {
    if (selectedUsers.length === 0) {
        toast.warn('Vui lòng chọn ít nhất một user để xóa.');
        return;
    }
    removeHistoryEntries(selectedUsers);
    toast.success(`Đã xóa ${selectedUsers.length} mục đã chọn.`);
    setSelectedUsers([]);
  };

  const handleResetSelected = () => {
    if (selectedUsers.length === 0) {
        toast.warn('Vui lòng chọn ít nhất một user để reset.');
        return;
    }
    toast.info(`Đã reset ${selectedUsers.length} user.`);
    setSelectedUsers([]);
  };

  const handleSendNotification = (userId, templateId) => {
    const template = notificationTemplates.find(t => t.id.toString() === templateId);
    const user = historyData.find(u => u.id === userId);
    if (template && user) {
      EventBus.dispatch('send_notification', { userId, message: template.message, type: template.type });
      toast.success(`Đã gửi thông báo "${template.title}" đến user ${user.account}.`);
    } else {
      toast.error('Không tìm thấy mẫu hoặc user.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Bảng Điều Khiển - BVOTE WEB</title>
      </Helmet>
      <CreateLoginDialog isOpen={isCreateLoginOpen} onOpenChange={setIsCreateLoginOpen} onAddEntry={addHistoryEntry} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cyber-main-bg rounded-lg min-h-[calc(100vh-16px)]"
      >
        <div className="p-2 border-b border-border flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex space-x-2 mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <h2 className="text-center font-bold text-lg text-white">BẢNG ĐIỀU KHIỂN LOGIN AUTO</h2>
            </div>
            <div className={`flex items-center text-xs px-2 py-1 rounded-full ${agentStatus === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {agentStatus === 'connected' ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              Agent {agentStatus === 'connected' ? 'Đã kết nối' : 'Mất kết nối'}
            </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[250px]">
            <NotificationsWidget />
            <DynamicStatusWidget />
            <StatsWidget historyData={historyData || []} />
            <Card className="cyber-card-bg p-3 text-slate-200 shadow-lg h-full">
              <h2 className="text-center font-bold text-lg mb-2 text-white">Đồng hồ giờ Mỹ</h2>
              <USClock />
            </Card>
          </div>

          <Card className="cyber-card-bg">
              <CardContent className="pt-6">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                      <div className="relative w-full max-w-xs">
                          <Input
                              type="text"
                              placeholder="Tìm kiếm..."
                              value={searchTerm}
                              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                              className="bg-input border-border pl-10 text-white"
                          />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                      <div className="w-[220px]">
                        <label className="block text-xs mb-1 text-muted-foreground">Action</label>
                        <Select value={actionFilter} onValueChange={(v)=>{ setActionFilter(v); setCurrentPage(1); }}>
                          <SelectTrigger className="bg-input border-border text-white">
                            <SelectValue placeholder="Tất cả hành động" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Tất cả</SelectItem>
                            <SelectItem value="auth_login_request">🟡 Chờ phê duyệt</SelectItem>
                            <SelectItem value="auth_login_success">✅ Đăng nhập thành công</SelectItem>
                            <SelectItem value="auth_login_denied">❌ Từ chối đăng nhập</SelectItem>
                            <SelectItem value="auth_login_require_otp">ℹ️ Yêu cầu OTP</SelectItem>
                            <SelectItem value="view_contests">👁️ Xem Cuộc thi</SelectItem>
                            <SelectItem value="view_contestants">👁️ Xem Thí sinh</SelectItem>
                            <SelectItem value="view_rankings">👁️ Xem BXH</SelectItem>
                            <SelectItem value="vote_submit">🗳️ Bỏ phiếu</SelectItem>
                            <SelectItem value="http_request">🌐 HTTP Request</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-[260px]">
                        <label className="block text-xs mb-1 text-muted-foreground">Admin Link</label>
                        <Select value={adminLinkFilter} onValueChange={(v)=>{ setAdminLinkFilter(v); setCurrentPage(1); }}>
                          <SelectTrigger className="bg-input border-border text-white">
                            <SelectValue placeholder="Tất cả Admin Link" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Tất cả</SelectItem>
                            {adminLinkOptions.map(opt => (
                              <SelectItem key={opt.key} value={opt.key}>{opt.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" className="text-cyan-400 border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-300" onClick={() => setIsCreateLoginOpen(true)}>
                              <FilePlus2 className="mr-2 h-4 w-4" /> Tạo Cột Login
                          </Button>
                          <Button variant="outline" onClick={() => handleAction('request_approval')}>
                              <Shield className="mr-2 h-4 w-4" /> Yêu cầu Phê duyệt
                          </Button>
                          <Button variant="outline" onClick={() => handleAction('request_otp')}>
                              <MessageSquare className="mr-2 h-4 w-4" /> Yêu cầu OTP
                          </Button>
                          <Button variant="outline" onClick={() => handleAction('request_password')}>
                              <Lock className="mr-2 h-4 w-4" /> Yêu cầu Mật khẩu
                          </Button>
                          <Button variant="outline" onClick={() => handleAction('request_wrong_password')}>
                              <AlertCircle className="mr-2 h-4 w-4" /> Yêu cầu Sai MK
                          </Button>
                          <Button variant="outline" onClick={handleNotImplemented}>
                              <Globe className="mr-2 h-4 w-4" /> Chrome Chỉ Định
                          </Button>
                          <Button variant="outline" onClick={handleResetSelected}>
                              <RefreshCw className="mr-2 h-4 w-4" /> Reset
                          </Button>
                          <Button variant="destructive" onClick={handleDeleteSelected} disabled={selectedUsers.length === 0}>
                              <Trash2 className="mr-2 h-4 w-4" /> Xoá mục chọn
                          </Button>
                      </div>
                  </div>
              </CardContent>
          </Card>

          <HistoryTable
            history={paginatedData}
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
            allHistory={historyData}
            notificationTemplates={notificationTemplates}
            onSendNotification={handleSendNotification}
          />
          {totalPages > 1 && (
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
          )}
        </div>
      </motion.div>
    </>
  );
};

export default DashboardPage;