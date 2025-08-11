import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-toastify';
import { Save, Image as ImageIcon, Trash2, PlusCircle, Edit, Users, Upload } from 'lucide-react';

const APPEARANCE_SETTINGS_KEY = 'userAppearanceSettings';

const initialSettings = {
  coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop',
  title: 'Chào mừng đến với Cuộc thi!',
  description: 'Hãy bình chọn cho thí sinh bạn yêu thích nhất.',
  introductionItems: [
    { id: 1, text: 'Bình chọn công bằng, minh bạch.' },
    { id: 2, text: 'Kết quả cập nhật theo thời gian thực.' },
    { id: 3, text: 'Giao diện thân thiện, dễ sử dụng.' },
  ],
  showRankings: true,
};

const UserAppearanceManagementPage = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(APPEARANCE_SETTINGS_KEY);
      return saved ? JSON.parse(saved) : initialSettings;
    } catch (error) {
      return initialSettings;
    }
  });
  const [newItemText, setNewItemText] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);

  useEffect(() => {
    localStorage.setItem(APPEARANCE_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleSave = () => {
    localStorage.setItem(APPEARANCE_SETTINGS_KEY, JSON.stringify(settings));
    toast.success('Đã lưu cài đặt giao diện!');
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleSwitchChange = (checked) => {
    setSettings(prev => ({ ...prev, showRankings: checked }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, coverImage: reader.result }));
        toast.success('Đã cập nhật ảnh bìa.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleItemAction = () => {
    if (!newItemText.trim()) return;
    if (editingItemId) {
      setSettings(prev => ({
        ...prev,
        introductionItems: prev.introductionItems.map(item =>
          item.id === editingItemId ? { ...item, text: newItemText } : item
        ),
      }));
      setEditingItemId(null);
    } else {
      setSettings(prev => ({
        ...prev,
        introductionItems: [
          ...prev.introductionItems,
          { id: Date.now(), text: newItemText },
        ],
      }));
    }
    setNewItemText('');
  };

  const handleEditItem = (item) => {
    setNewItemText(item.text);
    setEditingItemId(item.id);
  };

  const handleDeleteItem = (id) => {
    setSettings(prev => ({
      ...prev,
      introductionItems: prev.introductionItems.filter(item => item.id !== id),
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="cyber-card-bg">
        <CardHeader>
          <CardTitle className="text-white flex items-center"><ImageIcon className="mr-2" /> Ảnh bìa</CardTitle>
          <CardDescription className="text-gray-400">Thay đổi ảnh bìa chính của trang người dùng.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <img alt="Cover Preview" className="w-full h-48 object-cover rounded-lg border-2 border-dashed border-border" src={settings.coverImage} />
            <Button asChild variant="outline">
              <label htmlFor="cover-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> Tải ảnh mới
                <input id="cover-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="cyber-card-bg">
        <CardHeader>
          <CardTitle className="text-white">Nội dung chính</CardTitle>
          <CardDescription className="text-gray-400">Chỉnh sửa tiêu đề và mô tả hiển thị trên trang chủ.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-gray-300">Tiêu đề</Label>
            <Input id="title" value={settings.title} onChange={handleChange} className="bg-input border-border text-white" />
          </div>
          <div>
            <Label htmlFor="description" className="text-gray-300">Mô tả</Label>
            <Textarea id="description" value={settings.description} onChange={handleChange} className="bg-input border-border text-white" />
          </div>
        </CardContent>
      </Card>

      <Card className="cyber-card-bg">
        <CardHeader>
          <CardTitle className="text-white">Các mục giới thiệu</CardTitle>
          <CardDescription className="text-gray-400">Quản lý danh sách các điểm nổi bật.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {settings.introductionItems.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-input p-2 rounded-md">
                <p className="text-white">{item.text}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon_sm" onClick={() => handleEditItem(item)}><Edit className="h-4 w-4 text-yellow-400" /></Button>
                  <Button variant="ghost" size="icon_sm" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nội dung mục mới..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="bg-input border-border text-white"
            />
            <Button onClick={handleItemAction}>
              {editingItemId ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {editingItemId ? 'Cập nhật' : 'Thêm'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="cyber-card-bg">
        <CardHeader>
          <CardTitle className="text-white flex items-center"><Users className="mr-2" /> Bảng xếp hạng</CardTitle>
          <CardDescription className="text-gray-400">Bật hoặc tắt hiển thị bảng xếp hạng trên trang người dùng.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch id="show-rankings" checked={settings.showRankings} onCheckedChange={handleSwitchChange} />
            <Label htmlFor="show-rankings" className="text-gray-300">
              {settings.showRankings ? 'Đang hiển thị' : 'Đang ẩn'} bảng xếp hạng
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="glowing-button-cyber">
          <Save className="mr-2 h-4 w-4" /> Lưu tất cả thay đổi
        </Button>
      </div>
    </motion.div>
  );
};

export default UserAppearanceManagementPage;