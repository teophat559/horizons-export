import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Server, Plus, Trash2, Search, Ban, CheckCircle, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { sendTelegramMessage } from '@/services/telegram';

const initialIpList = [
  { id: 1, ip: '113.161.35.12', status: 'allowed', note: 'IP văn phòng', time: '2025-07-04 10:30:15' },
  { id: 2, ip: '27.72.100.98', status: 'allowed', note: 'IP nhà', time: '2025-07-04 09:15:42' },
  { id: 3, ip: '103.22.180.245', status: 'blocked', note: 'Spammer', time: '2025-07-03 18:05:20' },
];

const IP_STORAGE_KEY = 'ipManagementList';

const ManageIpPage = () => {
  const [ipList, setIpList] = useState(() => {
    try {
      const saved = localStorage.getItem(IP_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialIpList;
    } catch (error) {
      return initialIpList;
    }
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [newStatus, setNewStatus] = useState('allowed');
  const [newNote, setNewNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(IP_STORAGE_KEY, JSON.stringify(ipList));
  }, [ipList]);

  const handleAddIp = async () => {
    if (!newIp.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
      toast({ title: 'Lỗi', description: 'Địa chỉ IP không hợp lệ.', variant: 'destructive' });
      return;
    }
    if (ipList.some(ip => ip.ip === newIp)) {
      toast({ title: 'Lỗi', description: 'Địa chỉ IP đã tồn tại.', variant: 'destructive' });
      return;
    }

    const newIpData = { 
      id: Date.now(), 
      ip: newIp, 
      status: newStatus, 
      note: newNote, 
      time: new Date().toLocaleString('sv-SE') 
    };

    setIpList([...ipList, newIpData]);
    toast({ title: 'Thành công', description: 'Đã thêm IP mới.' });
    
    const telegramMessage = `
*📬 Thông Báo Thêm IP Mới 📬*

*Thời gian:* \`${newIpData.time}\`
*IP:* \`${newIpData.ip}\`
*Trạng thái:* ${newIpData.status === 'allowed' ? '✅ Được phép' : '🚫 Bị chặn'}
*Ghi chú:* ${newIpData.note || '_Không có_'}
    `;

    const result = await sendTelegramMessage(telegramMessage.trim());
    if (!result.success) {
      toast({
        title: 'Lỗi Telegram',
        description: result.message,
        variant: 'destructive',
      });
    }

    setIsDialogOpen(false);
    setNewIp('');
    setNewStatus('allowed');
    setNewNote('');
  };

  const deleteIp = (id) => {
    setIpList(ipList.filter(ip => ip.id !== id));
    toast({ title: 'Thành công', description: 'Đã xóa địa chỉ IP.' });
  };

  const toggleBlockStatus = (id) => {
    setIpList(ipList.map(ip => {
      if (ip.id === id) {
        const newStatus = ip.status === 'allowed' ? 'blocked' : 'allowed';
        toast({
          title: 'Cập nhật thành công',
          description: `IP ${ip.ip} đã được ${newStatus === 'allowed' ? 'mở chặn' : 'chặn'}.`
        });
        return { ...ip, status: newStatus };
      }
      return ip;
    }));
  };

  const filteredIpList = ipList.filter(item =>
    item.ip.includes(searchTerm) ||
    item.note.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>IP Đăng Nhập - BVOTE WEB</title>
      </Helmet>
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="cyber-main-bg rounded-lg min-h-[calc(100vh-20px)]"
      >
        <div className="p-4 border-b border-purple-500/30 flex items-center">
            <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <h2 className="text-center font-bold text-lg flex-1 text-white" style={{ textShadow: '0 0 8px rgba(138, 45, 226, 0.8)' }}>IP ĐĂNG NHẬP</h2>
        </div>
        
        <div className="p-4">
          <Card className="cyber-card-bg">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-xs">
                  <Input 
                    type="text"
                    placeholder="Tìm kiếm IP, ghi chú..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 pl-10 text-white"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="glowing-button-cyber">
                  <Plus className="mr-2 h-4 w-4" /> Thêm IP
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0 hover:bg-gray-800/50">
                      <TableHead className="text-gray-400">Địa chỉ IP</TableHead>
                      <TableHead className="text-gray-400">Thời gian</TableHead>
                      <TableHead className="text-gray-400">Trạng thái</TableHead>
                      <TableHead className="text-gray-400">Ghi chú</TableHead>
                      <TableHead className="text-gray-400 text-center">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIpList.map(item => (
                      <TableRow key={item.id} className="border-gray-800/80 hover:bg-gray-800/50 text-white">
                        <TableCell className="font-semibold">{item.ip}</TableCell>
                        <TableCell className="text-slate-400">{item.time}</TableCell>
                        <TableCell>
                          <span className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'allowed' ? 'text-green-300' : 'text-red-300'
                          }`}>
                            {item.status === 'allowed' ? <CheckCircle className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                            {item.status === 'allowed' ? 'Được phép' : 'Bị chặn'}
                          </span>
                        </TableCell>
                        <TableCell>{item.note}</TableCell>
                        <TableCell className="text-center">
                          <Button onClick={() => toggleBlockStatus(item.id)} variant="ghost" size="icon" title={item.status === 'allowed' ? 'Chặn IP' : 'Mở chặn IP'}>
                            {item.status === 'allowed' ? <Ban className="h-4 w-4 text-yellow-500" /> : <Unlock className="h-4 w-4 text-green-500" />}
                          </Button>
                          <Button onClick={() => deleteIp(item.id)} variant="ghost" size="icon" title="Xóa IP">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#0f0c29] border-purple-800 text-slate-50">
          <DialogHeader>
            <DialogTitle className="text-white">Thêm địa chỉ IP mới</DialogTitle>
            <DialogDescription className="text-slate-400">
              Thêm một IP vào danh sách cho phép hoặc chặn.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ip-address" className="text-right text-slate-400">IP</Label>
              <Input id="ip-address" value={newIp} onChange={(e) => setNewIp(e.target.value)} className="col-span-3 bg-slate-800/50 border-slate-700" placeholder="192.168.1.1" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right text-slate-400">Trạng thái</Label>
               <Select onValueChange={setNewStatus} defaultValue={newStatus}>
                <SelectTrigger className="col-span-3 bg-slate-800/50 border-slate-700">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0c29] border-purple-800 text-slate-50">
                  <SelectItem value="allowed">Được phép</SelectItem>
                  <SelectItem value="blocked">Bị chặn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note" className="text-right text-slate-400">Ghi chú</Label>
              <Input id="note" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="col-span-3 bg-slate-800/50 border-slate-700" placeholder="VD: IP công ty" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddIp} type="submit" className="glowing-button-cyber">Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManageIpPage;