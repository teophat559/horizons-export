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

const initialFakeLinks = [
  { id: 1, admin: 'Admin 1', name: 'Chiến dịch quảng cáo FB', url: 'https://bvote.web/s/fbad_1' },
  { id: 2, admin: 'Admin 2', name: 'Link cho đối tác A', url: 'https://bvote.web/s/partner_a' },
];

const FAKE_LINKS_STORAGE_KEY = 'fakeLinksList';

const FakeLinkPage = () => {
  const [links, setLinks] = useState(() => {
    try {
      const saved = localStorage.getItem(FAKE_LINKS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialFakeLinks;
    } catch (error) {
      return initialFakeLinks;
    }
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [customSuffix, setCustomSuffix] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(FAKE_LINKS_STORAGE_KEY, JSON.stringify(links));
  }, [links]);

  const handleAddLink = () => {
    if (!newLinkName || !customSuffix) {
      toast({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ Tên Link và Đuôi Link.', variant: 'destructive' });
      return;
    }
    const sanitizedSuffix = customSuffix.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!sanitizedSuffix) {
      toast({ title: 'Lỗi', description: 'Đuôi Link không hợp lệ. Chỉ sử dụng chữ, số và gạch dưới.', variant: 'destructive' });
      return;
    }

    const newEntry = {
      id: Date.now(),
      admin: 'Admin Hiện Tại', // Replace with actual admin context later
      name: newLinkName,
      url: `https://bvote.web/s/${sanitizedSuffix}`,
    };
    setLinks([...links, newEntry]);
    toast({ title: 'Thành công', description: 'Đã tạo link fake mới.' });
    setIsDialogOpen(false);
    setNewLinkName('');
    setCustomSuffix('');
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
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.admin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Tạo Link Fake - BVOTE WEB</title>
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
            <h2 className="text-center font-bold text-lg flex-1 text-white" style={{ textShadow: '0 0 8px rgba(138, 45, 226, 0.8)' }}>TẠO LINK FAKE</h2>
        </div>
        
        <div className="p-4">
          <Card className="cyber-card-bg">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-xs">
                  <Input 
                    type="text"
                    placeholder="Tìm kiếm theo tên, admin..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 pl-10 text-white"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="glowing-button-cyber">
                  <Plus className="mr-2 h-4 w-4" /> Tạo Link Mới
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0 hover:bg-gray-800/50">
                      <TableHead className="text-gray-400">Tên Link</TableHead>
                      <TableHead className="text-gray-400">Admin Tạo</TableHead>
                      <TableHead className="text-gray-400">URL</TableHead>
                      <TableHead className="text-gray-400 text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLinks.map(item => (
                      <TableRow key={item.id} className="border-gray-800/80 hover:bg-gray-800/50 text-white">
                        <TableCell className="font-semibold">{item.name}</TableCell>
                        <TableCell>{item.admin}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="truncate max-w-[300px] text-cyan-400">{item.url}</span>
                            <Copy className="h-4 w-4 cursor-pointer text-gray-500 hover:text-white" onClick={() => copyUrl(item.url)} />
                          </div>
                        </TableCell>
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
            <DialogTitle className="text-white">Tạo Link Fake Mới</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tạo một link mới và đặt tên riêng cho nó.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link-name" className="text-right text-slate-400">Tên Link</Label>
              <Input id="link-name" value={newLinkName} onChange={(e) => setNewLinkName(e.target.value)} className="col-span-3 bg-slate-800/50 border-slate-700" placeholder="VD: Chiến dịch quảng cáo Facebook" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="custom-suffix" className="text-right text-slate-400">Đuôi Link</Label>
              <div className="col-span-3 flex items-center">
                <span className="text-slate-400 bg-slate-800/50 border border-r-0 border-slate-700 px-3 py-2 rounded-l-md">.../s/</span>
                <Input id="custom-suffix" value={customSuffix} onChange={(e) => setCustomSuffix(e.target.value)} className="bg-slate-800/50 border-slate-700 rounded-l-none" placeholder="khuyen_mai_thang_7" />
              </div>
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

export default FakeLinkPage;