import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import SoundSettings from '@/components/notifications/SoundSettings';
import { useToast } from '@/components/ui/use-toast';
import { Music, Save } from 'lucide-react';

const NotificationSoundSettingsPage = () => {
  const { soundSettings, setSoundSettings } = useNotifications();
  const { toast } = useToast();

  const handleSaveSettings = () => {
    localStorage.setItem('notificationSoundSettings', JSON.stringify(soundSettings));
    toast({
      title: 'Đã lưu!',
      description: 'Cài đặt âm thanh đã được cập nhật thành công.',
    });
  };
  
  return (
    <>
      <Helmet>
        <title>Cài đặt Âm thanh Thông báo - BVOTE WEB</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cyber-main-bg rounded-lg min-h-[calc(100vh-20px)]"
      >
        <div className="p-4 border-b border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center">
                <div className="flex space-x-2 mr-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <h2 className="font-bold text-lg text-white" style={{ textShadow: '0 0 8px rgba(138, 45, 226, 0.8)' }}>
                    CÀI ĐẶT ÂM THANH
                </h2>
            </div>
            <Button onClick={handleSaveSettings} className="glowing-button-cyber">
                <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
            </Button>
        </div>

        <div className="p-4">
            <Card className="cyber-card-bg">
                 <CardHeader>
                    <CardTitle className="text-white flex items-center">
                    <Music className="mr-3 text-cyan-400" />
                    Tùy chỉnh Âm thanh
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                    Bật/tắt và chọn âm thanh cho các loại thông báo khác nhau.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <SoundSettings settings={soundSettings} setSettings={setSoundSettings} />
                </CardContent>
            </Card>
        </div>
      </motion.div>
    </>
  );
};

export default NotificationSoundSettingsPage;