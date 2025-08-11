import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';

export const ChromeProfileDialog = ({ isOpen, setIsOpen, onAssign }) => {
  const [profileName, setProfileName] = useState('');

  const handleSubmit = () => {
    if (profileName) {
      onAssign(profileName);
      setIsOpen(false);
      setProfileName('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-[#0f0c29] border-purple-800 text-slate-50">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl text-white" style={{ textShadow: '0 0 5px #8e2de2' }}>
            <Globe className="mr-2 h-6 w-6 text-blue-400" />
            Gán Profile Chrome
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Nhập tên profile Chrome để gán cho các mục đã chọn.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="profile-name" className="text-right text-slate-400">
              Tên Profile
            </Label>
            <Input
              id="profile-name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="col-span-3 bg-slate-800/50 border-slate-700 focus:ring-purple-500"
              placeholder="Profile 1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} className="glowing-button-cyber">
            Gán Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};