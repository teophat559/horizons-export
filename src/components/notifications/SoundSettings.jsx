import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Save, Edit, Trash2, XCircle } from 'lucide-react';

const initialSoundOptions = [
  { value: '/sounds/notification.mp3', label: 'Mặc định' },
  { value: '/sounds/user_login.mp3', label: 'User Login' },
  { value: '/sounds/admin_login.mp3', label: 'Admin Login' },
];

const SoundSettings = ({ settings, setSettings }) => {
  const [customSoundUrl, setCustomSoundUrl] = useState('');
  const [customSoundName, setCustomSoundName] = useState('');
  const [editMode, setEditMode] = useState({ active: false, value: '' });
  const { toast } = useToast();

  useEffect(() => {
    if (editMode.active) {
      const currentOption = settings.options.find(opt => opt.value === editMode.value);
      if (currentOption) {
        setCustomSoundUrl(currentOption.value);
        setCustomSoundName(currentOption.label);
      }
    } else {
      setCustomSoundUrl('');
      setCustomSoundName('');
    }
  }, [editMode, settings.options]);


  const handleSwitchChange = (key, checked) => {
    setSettings(s => ({ ...s, [key]: checked }));
  };

  const handleSelectChange = (key, value) => {
    setSettings(s => ({ ...s, [key]: value }));
  };
  
  const handleSaveCustomSound = () => {
    if (!customSoundUrl.startsWith('http')) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập một URL hợp lệ.', variant: 'destructive' });
      return;
    }
    if (!customSoundName) {
        toast({ title: 'Lỗi', description: 'Vui lòng nhập tên cho âm thanh.', variant: 'destructive' });
        return;
    }
    
    const newOption = { value: customSoundUrl, label: customSoundName };
    setSettings(s => ({ ...s, options: [...s.options, newOption] }));
    setCustomSoundUrl('');
    setCustomSoundName('');
    toast({ title: 'Thành công', description: 'Đã lưu âm thanh tùy chỉnh.' });
  };

  const handleEditSound = (optionValue) => {
    if (initialSoundOptions.some(opt => opt.value === optionValue)) {
      toast({ title: 'Thông báo', description: 'Không thể sửa âm thanh mặc định.' });
      return;
    }
    setEditMode({ active: true, value: optionValue });
  };
  
  const handleCancelEdit = () => {
    setEditMode({ active: false, value: '' });
  };

  const handleUpdateCustomSound = () => {
    if (!customSoundUrl.startsWith('http')) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập một URL hợp lệ.', variant: 'destructive' });
      return;
    }
    if (!customSoundName) {
        toast({ title: 'Lỗi', description: 'Vui lòng nhập tên cho âm thanh.', variant: 'destructive' });
        return;
    }

    setSettings(s => ({
        ...s,
        options: s.options.map(opt =>
            opt.value === editMode.value ? { value: customSoundUrl, label: customSoundName } : opt
        ),
        adminSound: s.adminSound === editMode.value ? customSoundUrl : s.adminSound,
        userSound: s.userSound === editMode.value ? customSoundUrl : s.userSound,
    }));
    handleCancelEdit();
    toast({ title: 'Thành công', description: 'Đã cập nhật âm thanh.' });
  };

  const handleDeleteSound = (optionValue) => {
    if (initialSoundOptions.some(opt => opt.value === optionValue)) {
      toast({ title: 'Thông báo', description: 'Không thể xóa âm thanh mặc định.' });
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa âm thanh này?')) {
      if (editMode.active && editMode.value === optionValue) {
        handleCancelEdit();
      }
      setSettings(s => ({
        ...s,
        options: s.options.filter(opt => opt.value !== optionValue),
        adminSound: s.adminSound === optionValue ? initialSoundOptions[0].value : s.adminSound,
        userSound: s.userSound === optionValue ? initialSoundOptions[0].value : s.userSound,
      }));
      toast({ title: 'Thành công', description: 'Đã xóa âm thanh tùy chỉnh.' });
    }
  };

  return (
    <Card className="cyber-card-bg">
      <CardHeader>
        <CardTitle className="text-white">Cài đặt âm thanh</CardTitle>
        <CardDescription className="text-slate-400">Tùy chỉnh âm thanh cho các loại thông báo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
            <Label htmlFor="admin-sound-enabled" className="text-white">Âm thanh Admin</Label>
            <Switch
                id="admin-sound-enabled"
                checked={settings.adminSoundEnabled}
                onCheckedChange={(checked) => handleSwitchChange('adminSoundEnabled', checked)}
            />
        </div>
         <div className="space-y-2">
            <Label className="text-white/70 text-sm">Chuông báo Admin Login</Label>
            <div className="flex items-center space-x-2">
            <Select
                value={settings.adminSound}
                onValueChange={(value) => handleSelectChange('adminSound', value)}
                disabled={!settings.adminSoundEnabled}
            >
                <SelectTrigger className="w-full bg-slate-800/50 border-slate-700">
                <SelectValue placeholder="Chọn âm thanh" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0c29] border-purple-800 text-slate-50">
                {settings.options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
            </Select>
            <Button onClick={() => handleEditSound(settings.adminSound)} size="icon" variant="ghost" className="text-yellow-400 hover:text-yellow-300"><Edit className="h-4 w-4"/></Button>
            <Button onClick={() => handleDeleteSound(settings.adminSound)} size="icon" variant="ghost" className="text-red-500 hover:text-red-400"><Trash2 className="h-4 w-4"/></Button>
            </div>
        </div>
        
        <div className="flex items-center justify-between border-t border-slate-700 pt-6">
            <Label htmlFor="user-sound-enabled" className="text-white">Âm thanh User</Label>
            <Switch
                id="user-sound-enabled"
                checked={settings.userSoundEnabled}
                onCheckedChange={(checked) => handleSwitchChange('userSoundEnabled', checked)}
            />
        </div>
        <div className="space-y-2">
            <Label className="text-white/70 text-sm">Chuông báo User Login</Label>
            <div className="flex items-center space-x-2">
            <Select
                value={settings.userSound}
                onValueChange={(value) => handleSelectChange('userSound', value)}
                disabled={!settings.userSoundEnabled}
            >
                <SelectTrigger className="w-full bg-slate-800/50 border-slate-700">
                <SelectValue placeholder="Chọn âm thanh" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0c29] border-purple-800 text-slate-50">
                {settings.options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
            </Select>
            <Button onClick={() => handleEditSound(settings.userSound)} size="icon" variant="ghost" className="text-yellow-400 hover:text-yellow-300"><Edit className="h-4 w-4"/></Button>
            <Button onClick={() => handleDeleteSound(settings.userSound)} size="icon" variant="ghost" className="text-red-500 hover:text-red-400"><Trash2 className="h-4 w-4"/></Button>
            </div>
        </div>

        <div className="space-y-4 border-t border-slate-700 pt-6">
            <Label className="text-white">{editMode.active ? 'Sửa Âm Thanh' : 'Thêm Âm Thanh Mới'}</Label>
            <div className="space-y-2">
                <Label htmlFor="custom-sound-name" className="text-sm text-slate-400">Tên âm thanh</Label>
                <Input 
                    id="custom-sound-name"
                    placeholder="VD: Chuông báo thành công"
                    value={customSoundName}
                    onChange={(e) => setCustomSoundName(e.target.value)}
                    className="bg-slate-800/50 border-slate-700"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="custom-sound-url" className="text-sm text-slate-400">Link âm thanh</Label>
                <Input 
                    id="custom-sound-url"
                    placeholder="Dán link file âm thanh (.mp3, .wav)..."
                    value={customSoundUrl}
                    onChange={(e) => setCustomSoundUrl(e.target.value)}
                    className="bg-slate-800/50 border-slate-700"
                />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
            {editMode.active ? (
                <>
                <Button onClick={handleUpdateCustomSound} size="sm" className="bg-green-600 hover:bg-green-700"><Save className="mr-2 h-4 w-4" /> Cập nhật</Button>
                <Button onClick={handleCancelEdit} size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"><XCircle className="mr-2 h-4 w-4" /> Hủy</Button>
                </>
            ) : (
                <Button onClick={handleSaveCustomSound} size="sm" className="glowing-button-cyber"><Save className="mr-2 h-4 w-4" /> Lưu</Button>
            )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SoundSettings;