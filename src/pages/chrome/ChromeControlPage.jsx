import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { chromeAutomationAPI } from '@/lib/services/chromeAutomationAPI';
import { Play, Square, Trash2, RefreshCw, Search, Wifi, WifiOff, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const PROFILES_STORAGE_KEY = 'chromeProfilesList';

const ChromeControlPage = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [agentStatus, setAgentStatus] = useState('disconnected');
  const [profileStatuses, setProfileStatuses] = useState({});

  useEffect(() => {
    const savedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles));
    }

    chromeAutomationAPI.init({
      onConnect: () => setAgentStatus('connected'),
      onDisconnect: () => {
        setAgentStatus('disconnected');
        setProfileStatuses({});
      },
      onStatusUpdate: (id, status, message) => {
        setProfileStatuses(prev => ({ ...prev, [id]: { status, message } }));
        if (status === 'error' || status === 'warning' || status === 'success') {
          setTimeout(() => {
            setProfileStatuses(prev => {
              const newStatuses = { ...prev };
              delete newStatuses[id];
              return newStatuses;
            });
          }, 5000);
        }
      },
    });

    return () => chromeAutomationAPI.disconnect();
  }, []);

  const filteredProfiles = useMemo(() =>
    profiles.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [profiles, searchTerm]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProfiles(new Set(filteredProfiles.map(p => p.name)));
    } else {
      setSelectedProfiles(new Set());
    }
  };

  const handleSelectRow = (profileName) => {
    setSelectedProfiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(profileName)) {
        newSet.delete(profileName);
      } else {
        newSet.add(profileName);
      }
      return newSet;
    });
  };

  const getSelectedProfileObjects = () => {
    return profiles.filter(p => selectedProfiles.has(p.name));
  };

  const handleAction = (actionFn, actionName) => {
    const selected = getSelectedProfileObjects();
    if (selected.length === 0) {
      toast({ title: 'Chưa chọn profile', description: 'Vui lòng chọn ít nhất một profile.', variant: 'destructive' });
      return;
    }
    actionFn(selected);
    toast({ title: 'Đã gửi lệnh!', description: `Lệnh "${actionName}" đã được gửi tới ${selected.length} profile.` });
  };

  const StatusIndicator = ({ statusInfo }) => {
    if (!statusInfo) return null;
    const { status, message } = statusInfo;
    switch (status) {
      case 'processing': return <span className="text-yellow-400 text-xs flex items-center"><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {message}</span>;
      case 'success': return <span className="text-green-400 text-xs flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> {message}</span>;
      case 'error': return <span className="text-red-400 text-xs flex items-center" title={message}><AlertTriangle className="h-4 w-4 mr-1" /> Lỗi</span>;
      case 'warning': return <span className="text-orange-400 text-xs flex items-center" title={message}><AlertTriangle className="h-4 w-4 mr-1" /> Cảnh báo</span>;
      default: return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Điều Khiển Chrome - BVOTE WEB</title>
      </Helmet>
      <div className="p-4 cyber-main-bg text-white min-h-[calc(100vh-16px)]">
        <Card className="cyber-card-bg border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div >
              <CardTitle className="text-2xl font-bold text-cyan-300">Bảng Điều Khiển Chrome</CardTitle>
              <p className="text-slate-400">Quản lý và thực hiện các tác vụ hàng loạt trên các profile Chrome.</p>
            </div>
            <div className={`flex items-center text-sm px-3 py-1 rounded-full ${agentStatus === 'connected' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {agentStatus === 'connected' ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
              Agent {agentStatus === 'connected' ? 'Đã kết nối' : 'Mất kết nối'}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
              <div className="relative w-full max-w-xs">
                <Input
                  type="text"
                  placeholder="Tìm kiếm profile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-input border-border pl-10 text-white"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <Button onClick={() => handleAction(chromeAutomationAPI.openProfiles, 'Mở Profile')} disabled={agentStatus !== 'connected'} variant="outline" className="border-green-500 text-green-400 hover:bg-green-500/20 hover:text-green-300 disabled:opacity-50">
                  <Play className="mr-2 h-4 w-4" /> Mở
                </Button>
                <Button onClick={() => handleAction(chromeAutomationAPI.closeProfiles, 'Đóng Profile')} disabled={agentStatus !== 'connected'} variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50">
                  <Square className="mr-2 h-4 w-4" /> Đóng
                </Button>
                <Button onClick={() => handleAction(chromeAutomationAPI.clearCookies, 'Xóa Cookies')} disabled={agentStatus !== 'connected'} variant="outline" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300 disabled:opacity-50">
                  <Trash2 className="mr-2 h-4 w-4" /> Xóa Cookies
                </Button>
                <Button onClick={() => handleAction(chromeAutomationAPI.refreshProfiles, 'Làm Mới')} disabled={agentStatus !== 'connected'} variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 disabled:opacity-50">
                  <RefreshCw className="mr-2 h-4 w-4" /> Làm Mới
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-0 hover:bg-gray-800/50">
                    <TableHead className="w-[50px]">
                      <Checkbox
                        onCheckedChange={handleSelectAll}
                        checked={filteredProfiles.length > 0 && selectedProfiles.size === filteredProfiles.length}
                        aria-label="Select all rows"
                      />
                    </TableHead>
                    <TableHead className="text-gray-400">Tên Profile</TableHead>
                    <TableHead className="text-gray-400">Ghi Chú</TableHead>
                    <TableHead className="text-gray-400">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.name} className={`border-gray-800/80 text-white transition-colors ${selectedProfiles.has(profile.name) ? 'bg-blue-900/30' : 'hover:bg-gray-800/50'}`}>
                      <TableCell>
                        <Checkbox
                          onCheckedChange={() => handleSelectRow(profile.name)}
                          checked={selectedProfiles.has(profile.name)}
                          aria-label={`Select profile ${profile.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{profile.name}</TableCell>
                      <TableCell className="text-slate-400">{profile.notes || 'Không có'}</TableCell>
                      <TableCell>
                        <StatusIndicator statusInfo={profileStatuses[profile.name]} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ChromeControlPage;