import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail, Plus, Trash2, Edit, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';

const initialTemplates = [
  { id: 1, title: 'Cảnh báo đăng nhập thất bại', message: 'Hệ thống phát hiện đăng nhập thất bại với tài khoản {account}. Vui lòng kiểm tra.' },
  { id: 2, title: 'Yêu cầu OTP', message: 'Tài khoản {account} yêu cầu mã OTP để hoàn tất đăng nhập.' },
];

const TEMPLATES_STORAGE_KEY = 'notificationTemplatesList';

const NotificationTemplatesPage = () => {
  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialTemplates;
    } catch (error) {
      return initialTemplates;
    }
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({ title: '', message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const openAddDialog = () => {
    setEditingTemplate(null);
    setFormData({ title: '', message: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (template) => {
    setEditingTemplate(template);
    setFormData({ title: template.title, message: template.message });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast({ title: 'Thành công', description: 'Đã xóa mẫu thông báo.' });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.message) {
      toast({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ tiêu đề và nội dung.', variant: 'destructive' });
      return;
    }

    if (editingTemplate) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...t, ...formData } : t));
      toast({ title: 'Thành công', description: 'Đã cập nhật mẫu thông báo.' });
    } else {
      const newTemplate = { id: Date.now(), ...formData };
      setTemplates([...templates, newTemplate]);
      toast({ title: 'Thành công', description: 'Đã thêm mẫu thông báo mới.' });
    }
    setIsDialogOpen(false);
  };

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Mẫu Thông Báo - BVOTE WEB</title>
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
            <h2 className="text-center font-bold text-lg flex-1 text-white" style={{ textShadow: '0 0 8px rgba(138, 45, 226, 0.8)' }}>QUẢN LÝ MẪU THÔNG BÁO</h2>
        </div>
        
        <div className="p-4">
          <Card className="cyber-card-bg">
            <CardHeader>
              <CardTitle className="text-white flex items-center"><Mail className="mr-3 text-blue-400"/> Danh sách Mẫu thông báo</CardTitle>
              <CardDescription className="text-gray-400">Tạo và quản lý các mẫu tin nhắn để gửi thông báo nhanh.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-xs">
                  <Input 
                    type="text"
                    placeholder="Tìm kiếm mẫu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 pl-10 text-white"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <Button onClick={openAddDialog} className="glowing-button-cyber">
                  <Plus className="mr-2 h-4 w-4" /> Tạo Mẫu Mới
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0 hover:bg-gray-800/50">
                      <TableHead className="text-gray-400">Tiêu đề</TableHead>
                      <TableHead className="text-gray-400">Nội dung</TableHead>
                      <TableHead className="text-gray-400 text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map(t => (
                      <TableRow key={t.id} className="border-gray-800/80 hover:bg-gray-800/50 text-white">
                        <TableCell className="font-semibold">{t.title}</TableCell>
                        <TableCell>{t.message}</TableCell>
                        <TableCell className="text-right">
                          <Button onClick={() => openEditDialog(t)} variant="ghost" size="icon"><Edit className="h-4 w-4 text-yellow-400" /></Button>
                          <Button onClick={() => handleDelete(t.id)} variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
            <DialogTitle className="text-white">{editingTemplate ? 'Chỉnh sửa Mẫu' : 'Thêm Mẫu mới'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Điền thông tin chi tiết cho mẫu thông báo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-400">Tiêu đề</Label>
              <Input id="title" value={formData.title} onChange={handleFormChange} className="bg-slate-800/50 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-slate-400">Nội dung</Label>
              <Textarea id="message" value={formData.message} onChange={handleFormChange} className="bg-slate-800/50 border-slate-700" />
              <p className="text-xs text-slate-500">Sử dụng {'{account}'} để chèn tên tài khoản.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} type="submit" className="glowing-button-cyber">Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationTemplatesPage;