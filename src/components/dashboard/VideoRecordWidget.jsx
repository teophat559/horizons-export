import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Video, Power, PowerOff, Plus, Trash2 } from 'lucide-react';

export const VideoRecordWidget = () => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isBlinkingEnabled, setIsBlinkingEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const options = { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
      const timeString = new Intl.DateTimeFormat('en-US', options).format(now);
      
      if (timeString.startsWith('18:00')) {
        setIsBlinking(true);
      } else {
        setIsBlinking(false);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCreate = () => {
    toast({
      title: "🚧 Tính năng đang được phát triển",
      description: "Chức năng tạo bản ghi video sẽ sớm được ra mắt!",
    });
  };

  const handleDelete = () => {
    toast({
      title: "🚧 Tính năng đang được phát triển",
      description: "Chức năng xóa bản ghi video sẽ sớm được ra mắt!",
    });
  };

  const showBlinkingEffect = isBlinking && isBlinkingEnabled;

  return (
    <Card className="cyber-card-bg h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={`text-lg font-bold transition-all duration-300 ${showBlinkingEffect ? 'animate-text-glow text-white' : 'text-gray-300'}`}>
          Quay Video
        </CardTitle>
        <Video className={`h-6 w-6 ${showBlinkingEffect ? 'text-cyan-400' : 'text-gray-500'}`} />
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div>
          <div className="flex space-x-2 my-4">
            <div className={`h-3 w-3 rounded-full bg-red-500 ${showBlinkingEffect ? 'dot-1' : ''}`}></div>
            <div className={`h-3 w-3 rounded-full bg-yellow-500 ${showBlinkingEffect ? 'dot-2' : ''}`}></div>
            <div className={`h-3 w-3 rounded-full bg-green-500 ${showBlinkingEffect ? 'dot-3' : ''}`}></div>
          </div>
          <p className="text-xs text-gray-400">
            {showBlinkingEffect ? "Đang có tín hiệu..." : "Không có hoạt động"}
          </p>
        </div>
        <div className="mt-auto pt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="blinking-toggle"
              checked={isBlinkingEnabled}
              onCheckedChange={setIsBlinkingEnabled}
              aria-readonly
            />
            <Label htmlFor="blinking-toggle" className="text-sm text-gray-300">
              {isBlinkingEnabled ? <Power className="h-4 w-4 inline-block mr-1 text-green-400"/> : <PowerOff className="h-4 w-4 inline-block mr-1 text-red-400"/>}
              Bật/Tắt hiệu ứng
            </Label>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleCreate} size="sm" className="flex-1 glowing-button-cyber">
              <Plus className="h-4 w-4 mr-2" /> Tạo
            </Button>
            <Button onClick={handleDelete} size="sm" variant="destructive" className="flex-1">
              <Trash2 className="h-4 w-4 mr-2" /> Xóa
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};