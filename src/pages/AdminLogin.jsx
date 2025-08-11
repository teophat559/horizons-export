import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Bot } from 'lucide-react';
import { EventBus } from '@/contexts/AppContext';

const AdminLogin = () => {
  const keyRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = (e) => {
    e.preventDefault();
    const enteredKey = keyRef.current.value;
    if (login(enteredKey)) {
      toast({
        title: 'Đăng nhập thành công!',
        description: 'Chào mừng trở lại, quản trị viên.',
      });
      try { EventBus.dispatch('admin_login_success', { ip: undefined }); } catch {}
      navigate('/');
    } else {
      toast({
        title: 'Lỗi Đăng Nhập',
        description: 'Mã key không hợp lệ. Vui lòng thử lại.',
        variant: 'destructive',
      });
      try { EventBus.dispatch('admin_login_failed', { reason: 'invalid_key' }); } catch {}
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Login - BVOTE WEB</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-[#030712] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="natural-login-card rounded-xl p-8">
            <div className="text-center mb-8">
                <div className="inline-block p-4 bg-green-900/50 rounded-full border border-green-500/30 mb-4">
                    <Bot className="h-10 w-10 text-green-400" />
                </div>
              <h1 className="text-3xl font-bold text-white">BVOTE WEB</h1>
              <p className="text-gray-400 mt-2">Vui lòng nhập mã key để truy cập trang quản trị</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <Input
                  ref={keyRef}
                  type="text"
                  placeholder="Nhập mã key của bạn"
                  className="bg-gray-900 border-gray-700 text-white h-12 text-center"
                />
              </div>
              <Button type="submit" className="w-full h-12 glowing-button-natural">
                Truy Cập
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AdminLogin;