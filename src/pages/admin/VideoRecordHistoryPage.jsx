import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Search, RefreshCw, Trash2, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-toastify';
import { LiveVideoFeed } from '@/components/dashboard/LiveVideoFeed';

const VIDEO_RECORDS_STORAGE_KEY = 'videoRecordsList';

const initialRecords = [
  { id: 1, time: '2025-07-18 10:30:15', profile: 'User_A', status: 'completed', duration: '00:15', size: '2.5 MB', url: '#' },
  { id: 2, time: '2025-07-18 11:05:22', profile: 'User_B', status: 'pending', duration: 'N/A', size: 'N/A', url: null },
  { id: 3, time: '2025-07-18 11:45:01', profile: 'User_C', status: 'failed', duration: '00:03', size: '0.5 MB', url: null },
  { id: 4, time: '2025-07-19 09:00:00', profile: 'User_A', status: 'completed', duration: '00:25', size: '4.2 MB', url: '#' },
];

const VideoRecordHistoryPage = () => {
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(VIDEO_RECORDS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialRecords;
    } catch (error) {
      return initialRecords;
    }
  });
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    localStorage.setItem(VIDEO_RECORDS_STORAGE_KEY, JSON.stringify(records));
  }, [records]);
  
  const handleRefresh = () => {
    toast.info("Đang làm mới danh sách...");
    // Placeholder for actual refresh logic
  };

  const handleDeleteSelected = () => {
    if (selectedRecords.length === 0) {
      toast.warn('Vui lòng chọn ít nhất một bản ghi để xóa.');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedRecords.length} bản ghi đã chọn?`)) {
      setRecords(records.filter(r => !selectedRecords.includes(r.id)));
      setSelectedRecords([]);
      toast.success('Đã xóa các bản ghi đã chọn!');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRecords(filteredRecords.map(r => r.id));
    } else {
      setSelectedRecords([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    setSelectedRecords(prev => 
      checked ? [...prev, id] : prev.filter(recordId => recordId !== id)
    );
  };

  const filteredRecords = records.filter(r =>
    r.profile.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-400" />;
      default: return null;
    }
  };

  const isAllSelected = filteredRecords.length > 0 && selectedRecords.length === filteredRecords.length;
  const isIndeterminate = selectedRecords.length > 0 && selectedRecords.length < filteredRecords.length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="max-w-2xl mx-auto">
        <LiveVideoFeed />
      </div>

      <Card className="cyber-card-bg">
        <CardHeader>
          <CardTitle className="text-white flex items-center"><Video className="mr-3 text-red-400"/> Lịch Sử Quay Video</CardTitle>
          <CardDescription className="text-gray-400">Xem lại và quản lý các video đã được hệ thống ghi lại từ người dùng.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div className="relative w-full max-w-xs">
              <Input 
                type="text"
                placeholder="Tìm kiếm profile, trạng thái..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input border-border pl-10 text-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
              </Button>
              <Button variant="destructive" onClick={handleDeleteSelected} disabled={selectedRecords.length === 0}>
                <Trash2 className="h-4 w-4 mr-2" /> Xóa ({selectedRecords.length})
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-purple-500/30 hover:bg-transparent">
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      data-state={isIndeterminate ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
                    />
                  </TableHead>
                  <TableHead className="text-gray-300">Thời Gian</TableHead>
                  <TableHead className="text-gray-300">Profile</TableHead>
                  <TableHead className="text-gray-300">Trạng Thái</TableHead>
                  <TableHead className="text-gray-300">Thời lượng</TableHead>
                  <TableHead className="text-gray-300">Kích thước</TableHead>
                  <TableHead className="text-gray-300 text-right">Hành Động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map(r => (
                  <TableRow key={r.id} className="border-b-purple-500/10 hover:bg-purple-500/10 text-white text-sm">
                    <TableCell>
                      <Checkbox
                        checked={selectedRecords.includes(r.id)}
                        onCheckedChange={(checked) => handleSelectRow(r.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.time}</TableCell>
                    <TableCell className="font-semibold">{r.profile}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(r.status)}
                        <span className="capitalize">{r.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{r.duration}</TableCell>
                    <TableCell>{r.size}</TableCell>
                    <TableCell className="text-right">
                      <Button disabled={!r.url} href={r.url} download variant="ghost" size="icon" title="Tải xuống">
                        <Download className="h-4 w-4 text-cyan-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRecords.length === 0 && (
                   <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          Không tìm thấy bản ghi nào.
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VideoRecordHistoryPage;