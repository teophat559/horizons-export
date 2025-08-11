import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Save, PlusCircle, Edit, Trash2, Bot, Link as LinkIcon, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';

const SETTINGS_STORAGE_KEY = 'webAppSettings';

const initialSettings = {
  telegramToken: '',
  telegramChatId: '',
  telegramEnabled: false,
  telegramRateWindowSec: 60,
  telegramMaxPerWindow: 10,
  adminKey: 'horizon_admin_2025',
  maxLoginPerDay: 10,
  delayBetweenSessions: 5,
  otpFailureAlert: 5,
  autoRelogin: true,
  allowedPlatforms: [
    { id: 1, name: 'Facebook', link: 'https://facebook.com' },
    { id: 2, name: 'Gmail', link: 'https://gmail.com' },
    { id: 3, name: 'Zalo', link: 'https://zalo.me' },
  ],
};

const WebSettingsPage = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean up old settings if they exist
        delete parsed.defaultRequireApproval;
        delete parsed.defaultRequireOtp;
        if (typeof parsed.allowedPlatforms === 'string') {
          parsed.allowedPlatforms = initialSettings.allowedPlatforms;
        }
        return { ...initialSettings, ...parsed };
      }
      return initialSettings;
    } catch (error) {
      return initialSettings;
    }
  });

  const [newPlatform, setNewPlatform] = useState({ name: '', link: '' });
  const [editingPlatformId, setEditingPlatformId] = useState(null);
  const { toast } = useToast();

  const handleSave = () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    toast({
      title: 'Đã lưu!',
      description: 'Cài đặt hệ thống đã được cập nhật thành công.',
    });
  };

  const handleChange = (e) => {
    const { id, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [id]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSwitchChange = (id, checked) => {
    setSettings(prev => ({
      ...prev,
      [id]: checked,
    }));
  };

  const handlePlatformChange = (e) => {
    const { name, value } = e.target;
    setNewPlatform(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdatePlatform = () => {
    if (!newPlatform.name || !newPlatform.link) {
      toast({ title: 'Lỗi', description: 'Tên và link nền tảng không được để trống.', variant: 'destructive' });
      return;
    }

    if (editingPlatformId) {
      setSettings(prev => ({
        ...prev,
        allowedPlatforms: prev.allowedPlatforms.map(p =>
          p.id === editingPlatformId ? { ...p, ...newPlatform } : p
        ),
      }));
      toast({ title: 'Thành công', description: 'Đã cập nhật nền tảng.' });
    } else {
      setSettings(prev => ({
        ...prev,
        allowedPlatforms: [
          ...prev.allowedPlatforms,
          { id: Date.now(), ...newPlatform },
        ],
      }));
      toast({ title: 'Thành công', description: 'Đã thêm nền tảng mới.' });
    }
    setNewPlatform({ name: '', link: '' });
    setEditingPlatformId(null);
  };

  const handleEditPlatform = (platform) => {
    setEditingPlatformId(platform.id);
    setNewPlatform({ name: platform.name, link: platform.link });
  };

  const handleDeletePlatform = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa nền tảng này?')) {
      setSettings(prev => ({
        ...prev,
        allowedPlatforms: prev.allowedPlatforms.filter(p => p.id !== id),
      }));
      toast({ title: 'Thành công', description: 'Đã xóa nền tảng.' });
      if (editingPlatformId === id) {
        setNewPlatform({ name: '', link: '' });
        setEditingPlatformId(null);
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Cài Đặt - BVOTE WEB</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cyber-main-bg rounded-lg min-h-[calc(100vh-20px)]"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex space-x-2 mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <h2 className="font-bold text-lg text-white">CÀI ĐẶT HỆ THỐNG</h2>
            </div>
            <Button onClick={handleSave} className="glowing-button-cyber">
              <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
            </Button>
        </div>

        <div className="p-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-6">
              <Card className="cyber-card-bg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center"><SlidersHorizontal className="mr-3 text-primary"/> Cấu hình chung</CardTitle>
                  <CardDescription className="text-muted-foreground">Quản lý các cài đặt kỹ thuật cho toàn bộ hệ thống.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminKey" className="text-gray-300">Mã xác thực Admin</Label>
                      <Input id="adminKey" type="password" value={settings.adminKey} onChange={handleChange} className="bg-background border-border text-white" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxLoginPerDay" className="text-gray-300">Số lần login tối đa/ngày</Label>
                        <Input id="maxLoginPerDay" type="number" value={settings.maxLoginPerDay} onChange={handleChange} className="bg-background border-border text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delayBetweenSessions" className="text-gray-300">Delay giữa các phiên (giây)</Label>
                        <Input id="delayBetweenSessions" type="number" value={settings.delayBetweenSessions} onChange={handleChange} className="bg-background border-border text-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otpFailureAlert" className="text-gray-300">Cảnh báo OTP khi thất bại quá (lần)</Label>
                      <Input id="otpFailureAlert" type="number" value={settings.otpFailureAlert} onChange={handleChange} className="bg-background border-border text-white" />
                    </div>
                    <div className="flex items-center space-x-4 pt-4">
                      <Switch id="autoRelogin" checked={settings.autoRelogin} onCheckedChange={(checked) => handleSwitchChange('autoRelogin', checked)} />
                      <Label htmlFor="autoRelogin" className="text-gray-300">Bật/tắt chế độ Auto relogin</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cyber-card-bg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center"><Bot className="mr-3 text-cyan-400"/> Tích hợp Telegram</CardTitle>
                  <CardDescription className="text-muted-foreground">Nhận thông báo hệ thống quan trọng qua Telegram.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center space-x-4">
                    <Switch id="telegramEnabled" checked={settings.telegramEnabled} onCheckedChange={(checked) => setSettings(prev => ({...prev, telegramEnabled: checked}))} />
                    <Label htmlFor="telegramEnabled" className="text-gray-300">Bật thông báo Telegram</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="telegramToken" className="text-gray-300 flex items-center"><Bot className="mr-2 h-4 w-4"/> Telegram Bot Token</Label>
                      <Input id="telegramToken" value={settings.telegramToken} onChange={handleChange} placeholder="Điền token telegram của bạn" className="bg-background border-border text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegramChatId" className="text-gray-300 flex items-center"><Hash className="mr-2 h-4 w-4"/> Telegram Chat ID</Label>
                      <Input id="telegramChatId" value={settings.telegramChatId} onChange={handleChange} placeholder="Điền Chat ID của bạn hoặc nhóm" className="bg-background border-border text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="telegramRateWindowSec" className="text-gray-300">Cửa sổ giới hạn (giây)</Label>
                      <Input id="telegramRateWindowSec" type="number" value={settings.telegramRateWindowSec} onChange={handleChange} className="bg-background border-border text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegramMaxPerWindow" className="text-gray-300">Số tin nhắn tối đa / cửa sổ</Label>
                      <Input id="telegramMaxPerWindow" type="number" value={settings.telegramMaxPerWindow} onChange={handleChange} className="bg-background border-border text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <Card className="cyber-card-bg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center"><LinkIcon className="mr-3 text-green-400"/> Nền tảng được phép</CardTitle>
                  <CardDescription className="text-muted-foreground">Quản lý các nền tảng đăng nhập được phép.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {settings.allowedPlatforms.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-background p-2 rounded-md">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{p.name}</span>
                          <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">{p.link}</a>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button onClick={() => handleEditPlatform(p)} size="icon_sm" variant="ghost" className="text-yellow-400 hover:text-yellow-300"><Edit className="h-4 w-4"/></Button>
                          <Button onClick={() => handleDeletePlatform(p.id)} size="icon_sm" variant="ghost" className="text-red-500 hover:text-red-400"><Trash2 className="h-4 w-4"/></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-4 space-y-3">
                    <h4 className="text-md font-semibold text-white">{editingPlatformId ? 'Sửa nền tảng' : 'Thêm nền tảng mới'}</h4>
                    <div className="space-y-2">
                      <Input name="name" value={newPlatform.name} onChange={handlePlatformChange} placeholder="Tên nền tảng (VD: Facebook)" className="bg-background border-border text-white" />
                      <Input name="link" value={newPlatform.link} onChange={handlePlatformChange} placeholder="Link (VD: https://facebook.com)" className="bg-background border-border text-white" />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleAddOrUpdatePlatform} size="sm" className="bg-green-600 hover:bg-green-700">
                        {editingPlatformId ? <><Save className="mr-2 h-4 w-4"/> Cập nhật</> : <><PlusCircle className="mr-2 h-4 w-4"/> Thêm</>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default WebSettingsPage;