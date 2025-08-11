import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Video, Search, RotateCw, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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

const VIDEO_RECORDS_STORAGE_KEY = 'videoRecordsList';

const initialRecords = [
  { id: 1, time: '2025-07-18 10:30:15', profile: 'Profile 1', status: 'completed' },
  { id: 2, time: '2025-07-18 11:05:22', profile: 'Profile 2', status: 'pending' },
  { id: 3, time: '2025-07-18 11:45:01', profile: 'Profile 1', status: 'failed' },
  { id: 4, time: '2025-07-19 09:00:00', profile: 'Profile 3', status: 'completed' },
];

const VideoRecordPage = () => {
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(VIDEO_RECORDS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialRecords;
    } catch (error) {
      return initialRecords;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    localStorage.setItem(VIDEO_RECORDS_STORAGE_KEY, JSON.stringify(records));
  }, [records]);
  
  const handleRefresh = (recordId) => {
    toast.info(`Đang làm mới bản ghi #${recordId}...`);
    // Placeholder for actual refresh logic
  };

  const handleDelete = (recordId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      setRecords(records.filter(r => r.id !== recordId));
      toast.success('Đã xóa bản ghi thành công!');
    }
  };

  const filteredRecords = records.filter(r =>
    r.profile.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Lịch Sử Quay Video - BVOTE WEB</title>
      </Helmet>
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="cyber-card-bg">
          <CardHeader>
            <CardTitle className="text-white flex items-center"><Video className="mr-3 text-red-400"/> Lịch Sử Quay Video User</CardTitle>
            <CardDescription className="text-gray-400">Xem lại lịch sử các video đã được hệ thống ghi lại.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-xs">
                <Input 
                  type="text"
                  placeholder="Tìm kiếm profile, trạng thái..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 pl-10 text-white"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="text-gray-400">Thời Gian</TableHead>
                    <TableHead className="text-gray-400">Profile</TableHead>
                    <TableHead className="text-gray-400">Trạng Thái</TableHead>
                    <TableHead className="text-gray-400 text-right">Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map(r => (
                    <TableRow key={r.id} className="border-gray-800/80 text-white interactive-glow hover:bg-transparent">
                      <TableCell className="font-mono text-xs">{r.time}</TableCell>
                      <TableCell className="font-semibold">{r.profile}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(r.status)}
                          <span className="capitalize">{r.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => handleRefresh(r.id)} variant="ghost" size="icon" title="Làm mới">
                          <RotateCw className="h-4 w-4 text-blue-400" />
                        </Button>
                        <Button onClick={() => handleDelete(r.id)} variant="ghost" size="icon" title="Xóa">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRecords.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
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
    </>
  );
};

export default VideoRecordPage;