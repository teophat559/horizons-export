import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { BellDot, Power, PowerOff, Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

const STORAGE_KEY_TITLES = 'dynamicStatusWidget_titles';
const STORAGE_KEY_EFFECT = 'dynamicStatusWidget_effectEnabled';

export const DynamicStatusWidget = () => {
  const { toast } = useToast();
  
  const [titles, setTitles] = useState(() => {
    try {
      const storedTitles = localStorage.getItem(STORAGE_KEY_TITLES);
      return storedTitles ? JSON.parse(storedTitles) : [{ id: Date.now(), text: "Bảng Trạng Thái" }];
    } catch (e) {
      return [{ id: Date.now(), text: "Bảng Trạng Thái" }];
    }
  });

  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  
  const [isBlinkingEnabled, setIsBlinkingEnabled] = useState(() => {
     try {
      const storedValue = localStorage.getItem(STORAGE_KEY_EFFECT);
      return storedValue !== null ? JSON.parse(storedValue) : true;
    } catch (e) {
      return true;
    }
  });

  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TITLES, JSON.stringify(titles));
  }, [titles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EFFECT, JSON.stringify(isBlinkingEnabled));
  }, [isBlinkingEnabled]);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const options = { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
      const timeString = new Intl.DateTimeFormat('en-US', options).format(now);
      
      setIsBlinking(timeString.startsWith('18:00'));
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTitle = () => {
    if (newTitle.trim()) {
      const newTitleObject = { id: Date.now(), text: newTitle.trim() };
      const updatedTitles = [...titles, newTitleObject];
      setTitles(updatedTitles);
      setCurrentTitleIndex(updatedTitles.length - 1);
      setNewTitle("");
      toast({ title: "Thành công!", description: `Đã tạo tiêu đề mới: "${newTitle.trim()}"` });
    } else {
      toast({ title: "Lỗi", description: "Tiêu đề không được để trống.", variant: "destructive" });
    }
  };

  const handleDeleteTitle = () => {
    if (titles.length <= 1) {
      toast({ title: "Không thể xóa", description: "Phải có ít nhất một tiêu đề.", variant: "destructive" });
      return;
    }
    const updatedTitles = titles.filter((_, index) => index !== currentTitleIndex);
    setTitles(updatedTitles);
    setCurrentTitleIndex(prevIndex => Math.max(0, prevIndex - 1));
    toast({ title: "Đã xóa!", description: `Đã xóa tiêu đề.`, variant: "destructive" });
  };
  
  const currentTitleText = titles[currentTitleIndex]?.text || "Bảng Trạng Thái";
  const showBlinkingEffect = isBlinking && isBlinkingEnabled;

  return (
    <Card className="cyber-card-bg h-full flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-col items-center justify-center text-center space-y-2 pb-2">
          <CardTitle 
            className={`text-2xl font-bold transition-all duration-300 cursor-pointer ${showBlinkingEffect ? 'animate-text-glow text-white' : 'text-gray-300'}`}
            onClick={() => setCurrentTitleIndex((currentTitleIndex + 1) % titles.length)}
          >
            {currentTitleText}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 my-6 justify-center">
            <div className={`h-5 w-5 rounded-full bg-red-500 ${showBlinkingEffect ? 'dot-1' : ''}`}></div>
            <div className={`h-5 w-5 rounded-full bg-yellow-500 ${showBlinkingEffect ? 'dot-2' : ''}`}></div>
            <div className={`h-5 w-5 rounded-full bg-green-500 ${showBlinkingEffect ? 'dot-3' : ''}`}></div>
          </div>
        </CardContent>
      </div>
      
      <CardContent className="mt-auto pt-4">
        <div className="flex items-center justify-center space-x-4">
          <Switch
            id="blinking-toggle"
            checked={isBlinkingEnabled}
            onCheckedChange={setIsBlinkingEnabled}
            aria-readonly
            className="data-[state=checked]:bg-green-600"
          />
          <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button size="icon_sm" className="bg-blue-600 hover:bg-blue-500 text-white">
                      <Plus className="h-4 w-4" />
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="cyber-card-bg text-white">
                  <AlertDialogHeader>
                      <AlertDialogTitle>Tạo Tiêu Đề Mới</AlertDialogTitle>
                      <AlertDialogDescription>
                          Nhập tên tiêu đề bạn muốn hiển thị trên widget.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                      placeholder="Ví dụ: Cảnh báo hệ thống"
                      className="bg-slate-800/50 border-slate-700 text-white"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCreateTitle}>Lưu</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleDeleteTitle} size="icon_sm" variant="destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};