import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link2, Plus, Trash2, Copy, Search, Edit } from 'lucide-react';
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

const initialLinks = [
  { id: 1, title: 'Chiến dịch Facebook tháng 7', platform: 'Facebook', url: 'https://bvote.web/login/fb_campaign_1', uses: 25, limit: 100 },
  { id: 2, title: 'Login Gmail nhân viên mới', platform: 'Gmail', url: 'https://bvote.web/login/gmail_hr', uses: 10, limit: 10 },
  { id: 3, title: 'Test Zalo', platform: 'Zalo', url: 'https://bvote.web/login/zalo_test', uses: 1, limit: 5 },
];

const LINKS_STORAGE_KEY = 'manageableLinks';

const ManageLinkPage = () => {
  const [links, setLinks] = useState(() => {
    try {
      const saved = localStorage.getItem(LINKS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialLinks;
    } catch (error) {
      return initialLinks;
    }
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', platform: '', limit: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links));
  }, [links]);

  const handleAddLink = () => {
    if (!newLink.title || !newLink.platform) {
      toast({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin.', variant: 'destructive' });
      return;
    }
    const newEntry = {
      id: Date.now(),
      ...newLink,
      url: `https://bvote.web/login/${newLink.platform.toLowerCase()}_${Date.now().toString().slice(-5)}`,
      uses: 0,
      limit: parseInt(newLink.limit) || 'Không giới hạn',
    };
    setLinks([...links, newEntry]);
    toast({ title: 'Thành công', description: 'Đã tạo link mới.' });
    setIsDialogOpen(false);
    setNewLink({ title: '', platform: '', limit: '' });
  };

  const deleteLink = (id) => {
    setLinks(links.filter(link => link.id !== id));
    toast({ title: 'Thành công', description: 'Đã xóa link.' });
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'Đã sao chép!', description: 'URL đã được sao chép vào clipboard.' });
  };

  const filteredLinks = links.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Quản Lý Link - Admin Dashboard</title>
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
            <h2 className="text-center font-bold text-lg flex-1 text-white" style={{ textShadow: '0 0 8px rgba(138, 45, 226, 0.8)' }}>BẢNG ĐIỀU KHIỂN - QUẢN LÝ LINK</h2>
        </div>

        <div className="p-4">
          <Card className="cyber-card-bg">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-xs">
                  <Input
                    type="text"
                    placeholder="Tìm kiếm link..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 pl-10 text-white"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="glowing-button-cyber">
                  <Plus className="mr-2 h-4 w-4" /> Tạo Link
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0 hover:bg-gray-800/50">
                      <TableHead className="text-gray-400">Tiêu đề</TableHead>
                      <TableHead className="text-gray-400">Nền tảng</TableHead>
                      <TableHead className="text-gray-400">URL</TableHead>
                      <TableHead className="text-gray-400">Sử dụng / Giới hạn</TableHead>
                      <TableHead className="text-gray-400 text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLinks.map(item => (
                      <TableRow key={item.id} className="border-gray-800/80 hover:bg-gray-800/50 text-white">
                        <TableCell className="font-semibold">{item.title}</TableCell>
                        <TableCell>{item.platform}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="truncate max-w-[200px] text-cyan-400">{item.url}</span>
                            <Copy className="h-4 w-4 cursor-pointer text-gray-500 hover:text-white" onClick={() => copyUrl(item.url)} />
                          </div>
                        </TableCell>
                        <TableCell>{item.uses} / {item.limit}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon"><Edit className="h-4 w-4 text-yellow-400" /></Button>
                          <Button onClick={() => deleteLink(item.id)} variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
            <DialogTitle className="text-white">Tạo liên kết đăng nhập mới</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tạo một link tùy chỉnh để theo dõi chiến dịch.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right text-slate-400">Tiêu đề</Label>
              <Input id="title" value={newLink.title} onChange={(e) => setNewLink({...newLink, title: e.target.value})} className="col-span-3 bg-slate-800/50 border-slate-700" placeholder="VD: Chiến dịch FB" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="platform" className="text-right text-slate-400">Nền tảng</Label>
                                <Input id="platform" value={newLink.platform} onChange={(e) => setNewLink({...newLink, platform: e.target.value})} className="col-span-3 bg-slate-800/50 border-slate-700" placeholder="VD: Facebook, Gmail, Mail khác" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="limit" className="text-right text-slate-400">Giới hạn</Label>
              <Input id="limit" type="number" value={newLink.limit} onChange={(e) => setNewLink({...newLink, limit: e.target.value})} className="col-span-3 bg-slate-800/50 border-slate-700" placeholder="Để trống nếu không giới hạn" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddLink} type="submit" className="glowing-button-cyber">Tạo Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManageLinkPage;