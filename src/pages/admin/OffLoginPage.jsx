import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ShieldX, Search, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHistory } from '@/lib/hooks/useHistory';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const OffLoginTable = ({ historyData, onRelogin }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b-0 hover:bg-gray-800/50">
            <TableHead className="text-gray-400">Thời Gian</TableHead>
            <TableHead className="text-gray-400">Tài Khoản</TableHead>
            <TableHead className="text-gray-400">Lý Do Lỗi</TableHead>
            <TableHead className="text-gray-400">IP Login</TableHead>
            <TableHead className="text-gray-400">Hành Động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historyData.length > 0 ? historyData.map((item) => (
            <TableRow key={item.id} className="border-gray-800/80 hover:bg-gray-800/50 text-white">
              <TableCell className="text-xs text-gray-500">{item.time}</TableCell>
              <TableCell className="font-semibold">{item.account}</TableCell>
              <TableCell>
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-900/50 text-red-300 border border-red-500/30">
                  {item.status}
                </span>
              </TableCell>
              <TableCell>{item.ip}</TableCell>
              <TableCell>
                <Button onClick={() => onRelogin(item)} variant="outline" size="sm" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300">
                  <RotateCw className="mr-2 h-4 w-4" />
                  Login Lại
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan="5" className="text-center text-gray-500 py-8">
                Không có phiên đăng nhập thất bại nào.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

const OffLoginPage = () => {
  const { historyData, addHistoryEntry, updateHistoryEntry } = useHistory();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const failedLogins = historyData.filter(item => 
    item.status.includes('Sai') || item.status.includes('Captcha') || item.status.includes('Lỗi')
  );

  const filteredData = failedLogins.filter(item => 
    item.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleRelogin = (itemToRelogin) => {
    const newId = historyData.length > 0 ? Math.max(...historyData.map(i => i.id)) + 1 : 1;
    const newEntry = {
      id: newId, time: new Date().toLocaleString('vi-VN'), account: itemToRelogin.account, password: itemToRelogin.password,
      otp: 'N/A', ip: 'Đang lấy...', status: '1️⃣ Đang xử lý...', cookie: 'Chờ...',
      chrome: itemToRelogin.chrome, note: `Thử lại từ lỗi: ${itemToRelogin.status}`, linkName: itemToRelogin.linkName
    };
    addHistoryEntry(newEntry);
    
    const statuses = [ '✅ Thành công', '🟡 Phê Duyệt', '🟡 Nhận Code', '🟠 Captcha', '❌ Sai mật khẩu'];
    const finalStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const finalCookie = finalStatus === '✅ Thành công' ? `c_user=${Date.now()}; xs=${Math.random().toString(36).substring(2)};` : '❌ Không';

    setTimeout(() => updateHistoryEntry(newId, { status: '2️⃣ Mở Chrome...' }), 1500);
    setTimeout(() => updateHistoryEntry(newId, { status: '3️⃣ Điều hướng...' }), 3000);
    setTimeout(() => {
        updateHistoryEntry(newId, { status: finalStatus, cookie: finalCookie, ip: `113.161.35.${Math.floor(Math.random() * 254) + 1}` });
        toast({ title: "Hoàn tất!", description: `Quá trình đăng nhập lại cho ${itemToRelogin.account} đã kết thúc.` });
    }, 4500);
  };

  return (
    <>
      <Helmet>
        <title>Login Thất Bại - Admin Dashboard</title>
      </Helmet>
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="cyber-main-bg rounded-lg min-h-[calc(100vh-88px)]"
      >
        <div className="p-4 border-b border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <h2 className="font-bold text-lg text-white" style={{ textShadow: '0 0 8px rgba(138, 45, 226, 0.8)' }}>LOGIN THẤT BẠI</h2>
            </div>
        </div>
        
        <div className="p-4">
          <Card className="cyber-card-bg">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <ShieldX className="mr-3 text-red-500" />
                  Danh Sách Login Thất Bại
                </h3>
                <div className="relative w-full max-w-xs">
                  <Input 
                    type="text"
                    placeholder="Tìm kiếm tài khoản, IP, lỗi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 pl-10 text-white"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <OffLoginTable historyData={paginatedData} onRelogin={handleRelogin} />
              {totalPages > 1 && (
                <div className="flex justify-end items-center space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    className="border-gray-700 bg-gray-800 hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-4 w-4"/>
                  </Button>
                  <span className="text-sm text-gray-400">Trang {currentPage} / {totalPages}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages}
                    className="border-gray-700 bg-gray-800 hover:bg-gray-700"
                  >
                    <ChevronRight className="h-4 w-4"/>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </>
  );
};

export default OffLoginPage;