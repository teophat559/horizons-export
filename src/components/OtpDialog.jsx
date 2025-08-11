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
import { CheckSquare } from 'lucide-react';

export const OtpDialog = ({ isOpen, setIsOpen, onApprove }) => {
  const [otp, setOtp] = useState('');

  const handleSubmit = () => {
    if (otp.length === 6 && /^\d+$/.test(otp)) {
      onApprove(otp);
      setIsOpen(false);
      setOtp('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-[#0f0c29] border-purple-800 text-slate-50">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl text-white" style={{ textShadow: '0 0 5px #8e2de2' }}>
            <CheckSquare className="mr-2 h-6 w-6 text-yellow-400" />
            Duyệt Mã OTP
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Nhập mã OTP gồm 6 chữ số để hoàn tất đăng nhập.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="otp" className="text-right text-slate-400">
              Mã OTP
            </Label>
            <Input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="col-span-3 bg-slate-800/50 border-slate-700 focus:ring-purple-500"
              placeholder="123456"
              maxLength={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} className="glowing-button-cyber bg-yellow-500 hover:bg-yellow-400">
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};