import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Palette, Save, Image as ImageIcon, Type, Text } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';

const APPEARANCE_STORAGE_KEY = 'userAppearanceSettings';

const initialSettings = {
  logoUrl: '/logo-placeholder.svg',
  coverImageUrl: 'https://images.unsplash.com/photo-1536566482680-fca31930a0bd?q=80&w=2070&auto=format&fit=crop',
  headerTitle: 'Chào mừng đến với Cuộc Thi Bình Chọn Online',
  footerText: '© 2025 BVOTE WEB. Mọi quyền được bảo lưu.',
};

const UserAppearancePage = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(APPEARANCE_STORAGE_KEY);
      return saved ? { ...initialSettings, ...JSON.parse(saved) } : initialSettings;
    } catch (error) {
      return initialSettings;
    }
  });

  const { toast } = useToast();

  const handleSave = () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(settings));
    toast({
      title: 'Đã lưu!',
      description: 'Cài đặt giao diện đã được cập nhật thành công.',
    });
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  return (
    <>
      <Helmet>
        <title>Cài Đặt Giao Diện - BVOTE WEB</title>
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
              <h2 className="font-bold text-lg text-white">CÀI ĐẶT GIAO DIỆN USER</h2>
            </div>
            <Button onClick={handleSave} className="glowing-button-cyber">
              <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
            </Button>
        </div>
        
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="cyber-card-bg lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center"><Palette className="mr-3 text-primary"/> Tùy Chỉnh Giao Diện Trang User</CardTitle>
              <CardDescription className="text-muted-foreground">Thay đổi logo, ảnh bìa, và nội dung giới thiệu trên trang bình chọn của người dùng.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Image Settings */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl" className="text-gray-300 flex items-center"><ImageIcon className="mr-2 h-4 w-4"/> URL Logo</Label>
                    <Input id="logoUrl" value={settings.logoUrl} onChange={handleChange} placeholder="Dán URL logo vào đây" className="bg-background border-border text-white" />
                    {settings.logoUrl && <img src={settings.logoUrl} alt="Logo Preview" className="mt-2 h-16 w-auto rounded-md bg-secondary p-2 object-contain" />}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coverImageUrl" className="text-gray-300 flex items-center"><ImageIcon className="mr-2 h-4 w-4"/> URL Ảnh Bìa</Label>
                    <Input id="coverImageUrl" value={settings.coverImageUrl} onChange={handleChange} placeholder="Dán URL ảnh bìa vào đây" className="bg-background border-border text-white" />
                    {settings.coverImageUrl && <img src={settings.coverImageUrl} alt="Cover Preview" className="mt-2 h-32 w-full rounded-md object-cover" />}
                  </div>
                </div>

                {/* Text Settings */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="headerTitle" className="text-gray-300 flex items-center"><Type className="mr-2 h-4 w-4"/> Tiêu Đề Đầu Trang</Label>
                    <Textarea id="headerTitle" value={settings.headerTitle} onChange={handleChange} placeholder="Nhập tiêu đề giới thiệu ở đầu trang..." className="bg-background border-border text-white min-h-[100px]" />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="footerText" className="text-gray-300 flex items-center"><Text className="mr-2 h-4 w-4"/> Nội Dung Cuối Trang</Label>
                    <Textarea id="footerText" value={settings.footerText} onChange={handleChange} placeholder="Nhập nội dung ở chân trang..." className="bg-background border-border text-white min-h-[100px]" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </>
  );
};

export default UserAppearancePage;