import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, Search, Power, PowerOff, RefreshCw, Pencil, Loader2 } from 'lucide-react';
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
import { chromeAutomationAPI } from '@/lib/services/chromeAutomationAPI';
import { moreLogin } from '@/lib/services/moreLoginAPI';

const PROFILES_STORAGE_KEY = 'chromeProfilesList';

const initialProfiles = [
  { id: 1, name: 'Profile 1', status: 'offline', lastUsed: '2025-07-18 10:00', moreLoginId: '' },
  { id: 2, name: 'Profile 2', status: 'offline', lastUsed: '2025-07-17 15:30', moreLoginId: '' },
  { id: 3, name: 'Profile Seeding', status: 'offline', lastUsed: '2025-07-18 11:00', moreLoginId: '' },
];

const ChromeProfileManagementPage = () => {
  const [profiles, setProfiles] = useState(() => {
    try {
      const saved = localStorage.getItem(PROFILES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialProfiles;
    } catch (error) {
      return initialProfiles;
    }
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileMoreLoginId, setNewProfileMoreLoginId] = useState('');
  const [editDialog, setEditDialog] = useState({ open: false, profileId: null, moreLoginId: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  const handleAddProfile = () => {
    if (!newProfileName.trim()) {
      toast({ title: 'Lỗi', description: 'Tên profile không được để trống.', variant: 'destructive' });
      return;
    }
    if (profiles.some(p => p.name.toLowerCase() === newProfileName.trim().toLowerCase())) {
      toast({ title: 'Lỗi', description: 'Tên profile đã tồn tại.', variant: 'destructive' });
      return;
    }

    const newProfile = {
      id: Date.now(),
      name: newProfileName.trim(),
      status: 'offline',
      lastUsed: new Date().toLocaleString('sv-SE'),
      moreLoginId: newProfileMoreLoginId.trim(),
    };
    setProfiles([...profiles, newProfile]);
    toast({ title: 'Thành công', description: 'Đã thêm profile mới.' });
    setIsDialogOpen(false);
    setNewProfileName('');
    setNewProfileMoreLoginId('');
  };

  const handleDeleteProfile = (id) => {
    setProfiles(profiles.filter(p => p.id !== id));
    toast({ title: 'Thành công', description: 'Đã xóa profile.' });
  };

  const handleSyncFromMoreLogin = async () => {
    try {
      setIsSyncing(true);
      // Fetch up to 500 items; compatible with multiple response shapes
      const res = await moreLogin.listProfiles({ pageNo: 1, pageSize: 500 });
      const list = res?.data?.list || res?.data?.records || res?.list || res?.data || [];
      if (!Array.isArray(list) || list.length === 0) {
        toast({ title: 'Không có dữ liệu', description: 'Không tìm thấy hồ sơ trên MoreLogin.', variant: 'destructive' });
        return;
      }

      const norm = (s) => (s || '').toString().trim().toLowerCase();
      const toLocal = (item) => {
        const name = item?.name || item?.profileName || item?.profile_name || '';
        const id = item?.id || item?.profileId || item?.profile_id || item?.uuid || '';
        return { name, moreLoginId: id };
      };

      let added = 0, updated = 0;
      const now = new Date().toLocaleString('sv-SE');
      const merged = [...profiles];
      for (const item of list) {
        const { name, moreLoginId } = toLocal(item);
        if (!name && !moreLoginId) continue;
        // Match by moreLoginId first, then by exact name
        const idxById = moreLoginId ? merged.findIndex(p => (p.moreLoginId || '') === moreLoginId) : -1;
        if (idxById >= 0) {
          const p = merged[idxById];
          merged[idxById] = { ...p, name: p.name || name, moreLoginId, lastUsed: p.lastUsed || now };
          updated++;
          continue;
        }
        const idxByName = name ? merged.findIndex(p => norm(p.name) === norm(name)) : -1;
        if (idxByName >= 0) {
          const p = merged[idxByName];
          merged[idxByName] = { ...p, moreLoginId, lastUsed: p.lastUsed || now };
          updated++;
        } else {
          merged.push({ id: Date.now() + Math.floor(Math.random() * 1000), name, status: 'offline', lastUsed: now, moreLoginId });
          added++;
        }
      }
      setProfiles(merged);
      toast({ title: 'Đồng bộ hoàn tất', description: `Thêm mới ${added}, cập nhật ${updated}.` });
    } catch (e) {
      toast({ title: 'Lỗi đồng bộ', description: String(e?.message || e), variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenProfile = (profile) => {
    chromeAutomationAPI.openProfiles([{ name: profile.name, id: profile.id, moreLoginId: profile.moreLoginId }]);
    toast({ title: 'Đang mở...', description: `Đã gửi lệnh mở profile ${profile.name}.` });
    setProfiles(profiles.map(p => p.id === profile.id ? { ...p, status: 'online' } : p));
  };

  const handleCloseProfile = (profile) => {
    chromeAutomationAPI.closeProfiles([{ name: profile.name, id: profile.id, moreLoginId: profile.moreLoginId }]);
    toast({ title: 'Đang đóng...', description: `Đã gửi lệnh đóng profile ${profile.name}.` });
    setProfiles(profiles.map(p => p.id === profile.id ? { ...p, status: 'offline' } : p));
  };

  const handleRefreshProfile = (profile) => {
    chromeAutomationAPI.refreshProfiles([{ name: profile.name, id: profile.id }]);
    toast({ title: 'Đang làm mới...', description: `Đã gửi lệnh làm mới profile ${profile.name}.` });
  };

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.moreLoginId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditMoreLogin = (p) => {
    setEditDialog({ open: true, profileId: p.id, moreLoginId: p.moreLoginId || '' });
  };

  const saveEditMoreLogin = () => {
    const { profileId, moreLoginId } = editDialog;
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, moreLoginId: (moreLoginId || '').trim() } : p));
    setEditDialog({ open: false, profileId: null, moreLoginId: '' });
    toast({ title: 'Đã lưu', description: 'Cập nhật MoreLogin ID thành công.' });
  };

  return (
    <>
      <Helmet>
        <title>Quản lý Profiles - Tự động hóa Chrome</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
      >
        <Card className="cyber-card-bg">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="mr-3 text-blue-400" />
              Quản lý Profiles Chrome
            </CardTitle>
            <CardDescription className="text-gray-400">
              Thêm, xóa và quản lý các profile Chrome được sử dụng cho tự động hóa.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-xs">
                <Input
                  type="text"
                  placeholder="Tìm kiếm profile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 pl-10 text-white"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSyncFromMoreLogin} disabled={isSyncing} variant="outline" className="border-cyan-500 text-cyan-300 hover:bg-cyan-500/20">
                  {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Đồng bộ MoreLogin
                </Button>
                <Button onClick={() => setIsDialogOpen(true)} className="glowing-button-cyber">
                  <Plus className="mr-2 h-4 w-4" /> Thêm Profile
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="text-gray-400">Tên Profile</TableHead>
                    <TableHead className="text-gray-400">Trạng thái</TableHead>
                    <TableHead className="text-gray-400">Sử dụng lần cuối</TableHead>
                    <TableHead className="text-gray-400">MoreLogin ID</TableHead>
                    <TableHead className="text-gray-400 text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map(p => (
                    <TableRow key={p.id} className="border-gray-800/80 text-white">
                      <TableCell className="font-semibold">{p.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {p.status === 'online' ? 'Online' : 'Offline'}
                        </span>
                      </TableCell>
                      <TableCell>{p.lastUsed}</TableCell>
                      <TableCell>{p.moreLoginId ? <code className="text-xs">{p.moreLoginId}</code> : <span className="text-slate-400">Chưa đặt</span>}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button onClick={() => openEditMoreLogin(p)} variant="ghost" size="icon" title="Sửa MoreLogin ID">
                          <Pencil className="h-4 w-4 text-cyan-400" />
                        </Button>
                        {p.status === 'offline' ? (
                          <Button onClick={() => handleOpenProfile(p)} variant="ghost" size="icon" title="Mở Profile">
                            <Power className="h-4 w-4 text-green-400" />
                          </Button>
                        ) : (
                          <Button onClick={() => handleCloseProfile(p)} variant="ghost" size="icon" title="Đóng Profile">
                            <PowerOff className="h-4 w-4 text-yellow-400" />
                          </Button>
                        )}
                        <Button onClick={() => handleRefreshProfile(p)} variant="ghost" size="icon" title="Làm mới">
                          <RefreshCw className="h-4 w-4 text-blue-400" />
                        </Button>
                        <Button onClick={() => handleDeleteProfile(p.id)} variant="ghost" size="icon" title="Xóa Profile">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#0f0c29] border-purple-800 text-slate-50">
          <DialogHeader>
            <DialogTitle className="text-white">Thêm Profile Mới</DialogTitle>
            <DialogDescription className="text-slate-400">
              Nhập tên cho profile Chrome mới và (tuỳ chọn) MoreLogin ID. Thư mục profile sẽ được tạo tự động.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="profile-name" className="text-right text-slate-400">
                Tên Profile
              </Label>
              <Input
                id="profile-name"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="col-span-3 bg-slate-800/50 border-slate-700"
                placeholder="Ví dụ: Seeding Account 1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="morelogin-id" className="text-right text-slate-400">
                MoreLogin ID
              </Label>
              <Input
                id="morelogin-id"
                value={newProfileMoreLoginId}
                onChange={(e) => setNewProfileMoreLoginId(e.target.value)}
                className="col-span-3 bg-slate-800/50 border-slate-700"
                placeholder="Tùy chọn - Dán profileId từ MoreLogin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddProfile} type="submit" className="glowing-button-cyber">
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit MoreLogin ID Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[425px] bg-[#0f0c29] border-purple-800 text-slate-50">
          <DialogHeader>
            <DialogTitle className="text-white">Cập nhật MoreLogin ID</DialogTitle>
            <DialogDescription className="text-slate-400">
              Dán chính xác profileId từ MoreLogin để map 1-1.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-morelogin-id" className="text-right text-slate-400">
                MoreLogin ID
              </Label>
              <Input
                id="edit-morelogin-id"
                value={editDialog.moreLoginId}
                onChange={(e) => setEditDialog(prev => ({ ...prev, moreLoginId: e.target.value }))}
                className="col-span-3 bg-slate-800/50 border-slate-700"
                placeholder="Ví dụ: 1650404388761056..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveEditMoreLogin} className="glowing-button-cyber">
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChromeProfileManagementPage;