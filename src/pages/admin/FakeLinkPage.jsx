import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, Plus, Trash2, Edit, Copy, BarChart3, Clock, Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'react-toastify';

const FAKE_LINKS_STORAGE_KEY = 'fakeLinksList';

const initialLinks = [
  { id: 1, name: 'Chiến dịch Facebook Ads', originalUrl: 'https://bvote.com/contest/1', fakeUrl: 'https://bit.ly/3XyZabc', clicks: 125, createdAt: '2025-07-15' },
  { id: 2, name: 'Email Marketing Tháng 7', originalUrl: 'https://bvote.com/contest/2', fakeUrl: 'https://tinyurl.com/4e5f6g7h', clicks: 88, createdAt: '2025-07-16' },
];

const FakeLinkPage = () => {
  const [links, setLinks] = useState(() => {
    try {
      const saved = localStorage.getItem(FAKE_LINKS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialLinks;
    } catch (error) {
      return initialLinks;
    }
  });

  const [newLink, setNewLink] = useState({ name: '', originalUrl: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [currentLink, setCurrentLink] = useState(null);

  useEffect(() => {
    localStorage.setItem(FAKE_LINKS_STORAGE_KEY, JSON.stringify(links));
  }, [links]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewLink(prev => ({ ...prev, [name]: value }));
  };
  
  const generateFakeUrl = () => `https://bvote.ly/${Math.random().toString(36).substring(2, 8)}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newLink.name || !newLink.originalUrl) {
      toast.error('Vui lòng điền đầy đủ tên và URL gốc.');
      return;
    }

    if (isEditing && currentLink) {
      setLinks(links.map(link => link.id === currentLink.id ? { ...link, name: newLink.name, originalUrl: newLink.originalUrl } : link));
      toast.success('Đã cập nhật link thành công!');
    } else {
      const createdLink = {
        id: Date.now(),
        ...newLink,
        fakeUrl: generateFakeUrl(),
        clicks: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setLinks([createdLink, ...links]);
      toast.success('Đã tạo link fake thành công!');
    }
    
    setNewLink({ name: '', originalUrl: '' });
    setIsEditing(false);
    setCurrentLink(null);
  };
  
  const handleEdit = (link) => {
    setIsEditing(true);
    setCurrentLink(link);
    setNewLink({ name: link.name, originalUrl: link.originalUrl });
  };
  
  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa link này?')) {
      setLinks(links.filter(link => link.id !== id));
      toast.success('Đã xóa link thành công!');
    }
  };
  
  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    toast.info('Đã sao chép vào clipboard!');
  };

  return (
    <>
      <Helmet>
        <title>Quản Lý Link Fake - BVOTE WEB</title>
      </Helmet>
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="cyber-card-bg">
          <CardHeader>
            <CardTitle className="text-white flex items-center"><Link className="mr-3 text-cyan-400"/> Quản Lý Link Fake</CardTitle>
            <CardDescription className="text-gray-400">Tạo và quản lý các link rút gọn để theo dõi hiệu quả chiến dịch.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <form onSubmit={handleSubmit} className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-white">{isEditing ? 'Chỉnh Sửa Link' : 'Tạo Link Mới'}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Tên Link (Ghi chú)</label>
                        <Input id="name" name="name" value={newLink.name} onChange={handleInputChange} placeholder="VD: Chiến dịch quảng cáo Zalo" className="bg-background border-border text-white"/>
                    </div>
                    <div>
                        <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-300 mb-1">URL Gốc</label>
                        <Input id="originalUrl" name="originalUrl" value={newLink.originalUrl} onChange={handleInputChange} placeholder="https://dantri.com.vn/..." className="bg-background border-border text-white"/>
                    </div>
                 </div>
                 <div className="flex justify-end space-x-2">
                    {isEditing && (
                        <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setCurrentLink(null); setNewLink({ name: '', originalUrl: ''}); }}>Hủy</Button>
                    )}
                    <Button type="submit" className="glowing-button-cyber">
                        {isEditing ? <><Save className="mr-2 h-4 w-4"/> Cập nhật Link</> : <><Plus className="mr-2 h-4 w-4"/> Tạo Link</>}
                    </Button>
                 </div>
            </form>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="text-gray-400">Tên Link</TableHead>
                    <TableHead className="text-gray-400">Link Gốc</TableHead>
                    <TableHead className="text-gray-400">Link Fake</TableHead>
                    <TableHead className="text-gray-400">Thống Kê</TableHead>
                    <TableHead className="text-gray-400 text-right">Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map(link => (
                    <TableRow key={link.id} className="border-gray-800/80 text-white interactive-glow hover:bg-transparent">
                      <TableCell className="font-semibold">{link.name}</TableCell>
                      <TableCell><a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate max-w-xs block">{link.originalUrl}</a></TableCell>
                      <TableCell className="font-mono text-cyan-300">{link.fakeUrl}</TableCell>
                      <TableCell>
                         <div className="flex flex-col text-sm">
                            <div className="flex items-center text-green-400"><BarChart3 className="h-4 w-4 mr-2"/> {link.clicks} clicks</div>
                            <div className="flex items-center text-gray-400 text-xs mt-1"><Clock className="h-3 w-3 mr-1.5"/> Tạo ngày {link.createdAt}</div>
                         </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => handleCopy(link.fakeUrl)} variant="ghost" size="icon" title="Sao chép link"><Copy className="h-4 w-4 text-white" /></Button>
                        <Button onClick={() => handleEdit(link)} variant="ghost" size="icon" title="Chỉnh sửa"><Edit className="h-4 w-4 text-yellow-400" /></Button>
                        <Button onClick={() => handleDelete(link.id)} variant="ghost" size="icon" title="Xóa"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {links.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            Chưa có link nào được tạo.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default FakeLinkPage;