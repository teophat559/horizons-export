import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Trophy, Plus, Trash2, Edit, Search } from 'lucide-react';
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

const initialContests = [
  { id: 1, name: 'Giọng Ca Vàng 2025', description: 'Cuộc thi tìm kiếm tài năng âm nhạc toàn quốc.', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop' },
  { id: 2, name: 'Hoa Hậu Hoàn Vũ 2025', description: 'Tôn vinh vẻ đẹp và trí tuệ phụ nữ Việt Nam.', imageUrl: 'https://images.unsplash.com/photo-1599485659203-f7f59556548a?q=80&w=1974&auto=format&fit=crop' },
];

const CONTESTS_STORAGE_KEY = 'contestsList';

const ContestsPage = () => {
  const [contests, setContests] = useState(() => {
    try {
      const saved = localStorage.getItem(CONTESTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialContests;
    } catch (error) {
      return initialContests;
    }
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContest, setEditingContest] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', imageUrl: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(CONTESTS_STORAGE_KEY, JSON.stringify(contests));
  }, [contests]);

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const openAddDialog = () => {
    setEditingContest(null);
    setFormData({ name: '', description: '', imageUrl: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (contest) => {
    setEditingContest(contest);
    setFormData({ name: contest.name, description: contest.description, imageUrl: contest.imageUrl });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    setContests(contests.filter(c => c.id !== id));
    toast({ title: 'Thành công', description: 'Đã xóa cuộc thi.' });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.description) {
      toast({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ tên và mô tả.', variant: 'destructive' });
      return;
    }

    if (editingContest) {
      setContests(contests.map(c => c.id === editingContest.id ? { ...c, ...formData } : c));
      toast({ title: 'Thành công', description: 'Đã cập nhật thông tin cuộc thi.' });
    } else {
      const newContest = { id: Date.now(), ...formData };
      setContests([...contests, newContest]);
      toast({ title: 'Thành công', description: 'Đã thêm cuộc thi mới.' });
    }
    setIsDialogOpen(false);
  };

  const filteredContests = contests.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Quản Lý Cuộc Thi - BVOTE WEB</title>
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
            <h2 className="text-center font-bold text-lg flex-1 text-white" style={{ textShadow: '0 0 8px rgba(138, 45, 226, 0.8)' }}>QUẢN LÝ CUỘC THI</h2>
        </div>
        
        <div className="p-4">
          <Card className="cyber-card-bg">
            <CardHeader>
              <CardTitle className="text-white flex items-center"><Trophy className="mr-3 text-yellow-400"/> Danh sách Cuộc Thi</CardTitle>
              <CardDescription className="text-gray-400">Quản lý danh sách cuộc thi, chỉnh sửa nội dung và hình ảnh liên quan.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-xs">
                  <Input 
                    type="text"
                    placeholder="Tìm kiếm cuộc thi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 pl-10 text-white"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <Button onClick={openAddDialog} className="glowing-button-cyber">
                  <Plus className="mr-2 h-4 w-4" /> Thêm Cuộc Thi
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0 hover:bg-gray-800/50">
                      <TableHead className="text-gray-400">Hình ảnh</TableHead>
                      <TableHead className="text-gray-400">Tên Cuộc Thi</TableHead>
                      <TableHead className="text-gray-400">Mô tả</TableHead>
                      <TableHead className="text-gray-400 text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContests.map(c => (
                      <TableRow key={c.id} className="border-gray-800/80 hover:bg-gray-800/50 text-white">
                        <TableCell>
                          <img src={c.imageUrl || 'https://via.placeholder.com/40'} alt={c.name} className="h-10 w-10 rounded-lg object-cover" />
                        </TableCell>
                        <TableCell className="font-semibold">{c.name}</TableCell>
                        <TableCell>{c.description}</TableCell>
                        <TableCell className="text-right">
                          <Button onClick={() => openEditDialog(c)} variant="ghost" size="icon"><Edit className="h-4 w-4 text-yellow-400" /></Button>
                          <Button onClick={() => handleDelete(c.id)} variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
            <DialogTitle className="text-white">{editingContest ? 'Chỉnh sửa Cuộc thi' : 'Thêm Cuộc thi mới'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Điền thông tin chi tiết cho cuộc thi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-400">Tên Cuộc Thi</Label>
              <Input id="name" value={formData.name} onChange={handleFormChange} className="bg-slate-800/50 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-400">Mô tả</Label>
              <Textarea id="description" value={formData.description} onChange={handleFormChange} className="bg-slate-800/50 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-slate-400">URL Hình ảnh</Label>
              <Input id="imageUrl" value={formData.imageUrl} onChange={handleFormChange} className="bg-slate-800/50 border-slate-700" />
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

export default ContestsPage;