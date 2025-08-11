import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, Edit, Search, Vote } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const initialContestants = [
  { id: 1, contestId: 1, name: 'Nguyễn Văn A', description: 'Thí sinh tiềm năng từ Hà Nội', imageUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', votes: 1200 },
  { id: 2, contestId: 2, name: 'Trần Thị B', description: 'Giọng ca vàng đến từ TP.HCM', imageUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e', votes: 2500 },
];
const CONTESTANTS_STORAGE_KEY = 'contestantsList';
const CONTESTS_STORAGE_KEY = 'contestsList';


const ContestantsPage = () => {
  const [contestants, setContestants] = useState(() => {
    try {
      const saved = localStorage.getItem(CONTESTANTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialContestants;
    } catch (error) {
      return initialContestants;
    }
  });

  const [contests, setContests] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContestant, setEditingContestant] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', imageUrl: '', contestId: '', votes: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(CONTESTANTS_STORAGE_KEY, JSON.stringify(contestants));
  }, [contestants]);

  useEffect(() => {
    try {
      const savedContests = localStorage.getItem(CONTESTS_STORAGE_KEY);
      if (savedContests) {
        setContests(JSON.parse(savedContests));
      }
    } catch (error) {
      console.error("Could not load contests", error);
    }
  }, []);

  const handleFormChange = (e) => {
    const { id, value, type } = e.target;
    setFormData(prev => ({ ...prev, [id]: type === 'number' ? Number(value) : value }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, contestId: value }));
  };

  const openAddDialog = () => {
    setEditingContestant(null);
    setFormData({ name: '', description: '', imageUrl: '', contestId: '', votes: 0 });
    setIsDialogOpen(true);
  };

  const openEditDialog = (contestant) => {
    setEditingContestant(contestant);
    setFormData({ 
      name: contestant.name, 
      description: contestant.description, 
      imageUrl: contestant.imageUrl,
      contestId: contestant.contestId,
      votes: contestant.votes || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    setContestants(contestants.filter(c => c.id !== id));
    toast({ title: 'Thành công', description: 'Đã xóa thí sinh.' });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.description || !formData.contestId) {
      toast({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin và chọn cuộc thi.', variant: 'destructive' });
      return;
    }

    if (editingContestant) {
      setContestants(contestants.map(c => c.id === editingContestant.id ? { ...c, ...formData } : c));
      toast({ title: 'Thành công', description: 'Đã cập nhật thông tin thí sinh.' });
    } else {
      const newContestant = { id: Date.now(), ...formData };
      setContestants([...contestants, newContestant]);
      toast({ title: 'Thành công', description: 'Đã thêm thí sinh mới.' });
    }
    setIsDialogOpen(false);
  };

  const filteredContestants = contestants.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getContestName = (contestId) => {
    const contest = contests.find(c => c.id === contestId);
    return contest ? contest.name : 'Không xác định';
  };

  return (
    <>
      <Helmet>
        <title>Quản Lý Thí Sinh - BVOTE WEB</title>
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
            <h2 className="text-center font-bold text-lg flex-1 text-white" style={{ textShadow: '0 0 8px rgba(138, 45, 226, 0.8)' }}>QUẢN LÝ THÍ SINH</h2>
        </div>
        
        <div className="p-4">
          <Card className="cyber-card-bg">
            <CardHeader>
              <CardTitle className="text-white flex items-center"><Users className="mr-3 text-cyan-400"/> Danh sách Thí Sinh</CardTitle>
              <CardDescription className="text-gray-400">Thêm, sửa, xóa và quản lý thí sinh cho từng cuộc thi.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-xs">
                  <Input 
                    type="text"
                    placeholder="Tìm kiếm thí sinh..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 pl-10 text-white"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <Button onClick={openAddDialog} className="glowing-button-cyber">
                  <Plus className="mr-2 h-4 w-4" /> Thêm Thí Sinh
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0 hover:bg-gray-800/50">
                      <TableHead className="text-gray-400">Hình ảnh</TableHead>
                      <TableHead className="text-gray-400">Tên Thí Sinh</TableHead>
                      <TableHead className="text-gray-400">Cuộc Thi</TableHead>
                      <TableHead className="text-gray-400">Số Phiếu</TableHead>
                      <TableHead className="text-gray-400 text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContestants.map(c => (
                      <TableRow key={c.id} className="border-gray-800/80 hover:bg-gray-800/50 text-white">
                        <TableCell>
                          <img src={c.imageUrl || 'https://via.placeholder.com/40'} alt={c.name} className="h-10 w-10 rounded-full object-cover" />
                        </TableCell>
                        <TableCell className="font-semibold">{c.name}</TableCell>
                        <TableCell>{getContestName(c.contestId)}</TableCell>
                        <TableCell className="flex items-center space-x-2"><Vote className="h-4 w-4 text-green-400"/> <span>{(c.votes || 0).toLocaleString('vi-VN')}</span></TableCell>
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
            <DialogTitle className="text-white">{editingContestant ? 'Chỉnh sửa Thí sinh' : 'Thêm Thí sinh mới'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Điền thông tin chi tiết cho thí sinh.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contestId" className="text-slate-400">Chọn Cuộc Thi</Label>
              <Select value={(formData.contestId || '').toString()} onValueChange={handleSelectChange}>
                <SelectTrigger className="w-full bg-slate-800/50 border-slate-700">
                  <SelectValue placeholder="Chọn một cuộc thi..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1b4b] border-purple-800 text-slate-50">
                  {contests.length > 0 ? contests.map(contest => (
                    <SelectItem key={contest.id} value={contest.id.toString()}>{contest.name}</SelectItem>
                  )) : <SelectItem value="disabled" disabled>Không có cuộc thi nào</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-400">Tên Thí Sinh</Label>
              <Input id="name" value={formData.name} onChange={handleFormChange} className="bg-slate-800/50 border-slate-700" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="votes" className="text-slate-400">Số phiếu đã bình chọn</Label>
              <Input id="votes" type="number" value={formData.votes} onChange={handleFormChange} className="bg-slate-800/50 border-slate-700" />
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

export default ContestantsPage;