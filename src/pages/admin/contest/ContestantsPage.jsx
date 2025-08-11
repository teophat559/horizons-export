import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
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
import {
  Dialog as PickerDialog,
  DialogContent as PickerContent,
  DialogHeader as PickerHeader,
  DialogTitle as PickerTitle,
} from '@/components/ui/dialog';

const generateContestants = (contestId, count) => {
  const contestants = [];
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Võ', 'Đặng', 'Bùi', 'Đỗ'];
  const lastNames = ['Văn An', 'Thị Bình', 'Minh Cường', 'Thuỳ Dung', 'Quốc Anh', 'Ngọc Mai', 'Thành Long', 'Hồng Nhung', 'Đức Thắng', 'Kim Chi'];
  for (let i = 1; i <= count; i++) {
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    contestants.push({
      id: contestId * 100 + i,
      contestId: contestId,
      name: `${name}`,
      description: `Thí sinh tài năng với mã số ${contestId * 100 + i}.`,
      imageUrl: `https://i.pravatar.cc/150?u=${contestId * 100 + i}`,
      votes: Math.floor(Math.random() * 5000) + 100,
    });
  }
  return contestants;
};

const initialContestants = [
  ...generateContestants(1, 15),
  ...generateContestants(2, 15),
  ...generateContestants(3, 15),
];

const CONTESTANTS_STORAGE_KEY = 'contestantsList';
const CONTESTS_STORAGE_KEY = 'contestsList';


const ContestantsPage = () => {
  const [contestants, setContestants] = useState(() => {
    try {
      const saved = localStorage.getItem(CONTESTANTS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : initialContestants;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialContestants;
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerList, setPickerList] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);

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

  async function loadPicker() {
    setPickerLoading(true);
    try {
  const res = await fetch('/api/admin/uploads', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`);
      setPickerList(json.data || []);
      setPickerOpen(true);
    } catch (e) {
      toast({ title: 'Lỗi', description: String(e?.message || e), variant: 'destructive' });
    } finally {
      setPickerLoading(false);
    }
  }

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
      setContestants(contestants.map(c => c.id === editingContestant.id ? { ...c, ...formData, contestId: Number(formData.contestId) } : c));
      toast({ title: 'Thành công', description: 'Đã cập nhật thông tin thí sinh.' });
    } else {
      const newContestant = { id: Date.now(), ...formData, contestId: Number(formData.contestId) };
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
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="text-gray-400">Hình ảnh</TableHead>
                      <TableHead className="text-gray-400">Tên Thí Sinh</TableHead>
                      <TableHead className="text-gray-400">Cuộc Thi</TableHead>
                      <TableHead className="text-gray-400">Số Phiếu</TableHead>
                      <TableHead className="text-gray-400 text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContestants.map(c => (
                      <TableRow key={c.id} className="border-gray-800/80 text-white interactive-glow hover:bg-transparent cursor-pointer">
                        <TableCell>
                          <img src={c.imageUrl || 'https://via.placeholder.com/40'} alt={c.name} className="h-10 w-10 rounded-full object-cover" />
                        </TableCell>
                        <TableCell className="font-semibold">{c.name}</TableCell>
                        <TableCell>{getContestName(c.contestId)}</TableCell>
                        <TableCell className="flex items-center space-x-2"><Vote className="h-4 w-4 text-green-400"/> <span>{(c.votes || 0).toLocaleString('vi-VN')}</span></TableCell>
                        <TableCell className="text-right">
                          <Button onClick={(e) => { e.stopPropagation(); openEditDialog(c); }} variant="ghost" size="icon"><Edit className="h-4 w-4 text-yellow-400" /></Button>
                          <Button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
        <DialogContent className="sm:max-w-[425px] bg-blue-950/90 backdrop-blur-sm border-blue-700 text-slate-50">
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
                <SelectTrigger className="w-full bg-blue-900/50 border-blue-700">
                  <SelectValue placeholder="Chọn một cuộc thi..." />
                </SelectTrigger>
                <SelectContent className="bg-blue-900 border-blue-700 text-slate-50">
                  {contests.length > 0 ? contests.map(contest => (
                    <SelectItem key={contest.id} value={contest.id.toString()}>{contest.name}</SelectItem>
                  )) : <SelectItem value="disabled" disabled>Không có cuộc thi nào</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-400">Tên Thí Sinh</Label>
              <Input id="name" value={formData.name} onChange={handleFormChange} className="bg-blue-900/50 border-blue-700" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="votes" className="text-slate-400">Số phiếu đã bình chọn</Label>
              <Input id="votes" type="number" value={formData.votes} onChange={handleFormChange} className="bg-blue-900/50 border-blue-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-400">Mô tả</Label>
              <Textarea id="description" value={formData.description} onChange={handleFormChange} className="bg-blue-900/50 border-blue-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-slate-400">URL Hình ảnh</Label>
              <div className="flex gap-2">
                <Input id="imageUrl" value={formData.imageUrl} onChange={handleFormChange} className="bg-blue-900/50 border-blue-700" />
                <Button type="button" onClick={loadPicker} variant="secondary">Chọn ảnh</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} type="submit" className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]">Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImagePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        list={pickerList}
        onPick={(url) => { setFormData(prev => ({ ...prev, imageUrl: url })); setPickerOpen(false); }}
      />
    </>
  );
};

export default ContestantsPage;

// Image Picker Dialog
function ImagePicker({ open, onOpenChange, list, onPick }) {
  return (
    <PickerDialog open={open} onOpenChange={onOpenChange}>
      <PickerContent className="sm:max-w-[680px]">
        <PickerHeader>
          <PickerTitle>Chọn ảnh</PickerTitle>
        </PickerHeader>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-2">
          {list.map((f) => (
            <button key={f.url} type="button" className="border rounded-md overflow-hidden hover:opacity-80" onClick={() => onPick(f.url)}>
              <img src={f.url} alt={f.name} className="w-full h-24 object-cover" />
              <div className="text-[10px] break-all p-1">{f.name}</div>
            </button>
          ))}
          {(!list || list.length === 0) && (
            <div className="text-sm text-muted-foreground">Chưa có ảnh</div>
          )}
        </div>
      </PickerContent>
    </PickerDialog>
  );
}