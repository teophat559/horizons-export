import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'react-toastify';
import { EventBus } from '@/contexts/AppContext';
import { Shield, Lock, Eye, EyeOff, User, ArrowRight, CheckCircle } from 'lucide-react';

const AdminLogin = () => {
  const keyRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showKey, setShowKey] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const enteredKey = keyRef.current.value;
    try {
      const ok = await login(enteredKey);
      if (ok) {
        try { EventBus.dispatch('admin_login_success', { ip: undefined }); } catch {}
        toast.success('Đăng nhập thành công! Chào mừng trở lại.');
        navigate('/admin/dashboard');
      } else {
        try { EventBus.dispatch('admin_login_failed', { reason: 'invalid_key' }); } catch {}
        toast.error('Mã key không hợp lệ. Vui lòng thử lại.');
      }
    } catch (err) {
      toast.error('Không thể kết nối máy chủ xác thực.');
    }
    };

  return (
    <>
      <Helmet>
        <title>Cổng Quản Trị - BVOTE WEB</title>
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 admin-login-bg">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="admin-login-card rounded-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
              className="mx-auto mb-4 inline-block rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 p-4 shadow-lg shadow-purple-500/20"
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>

            <h1 className="text-3xl font-bold text-white tracking-tight">BVOTE WEB</h1>
            <h2 className="text-xl font-semibold text-slate-200 mt-1">Cổng Quản Trị</h2>
            <p className="text-muted-foreground mt-2 text-sm">Truy cập an toàn hệ thống quản lý</p>

            <div className="bg-input border border-border rounded-lg p-3 flex justify-between items-center text-sm mt-8">
              <div className="flex items-center gap-2 text-slate-300">
                <Lock className="h-4 w-4"/>
                <span>Mức Bảo Mật</span>
              </div>
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span>Nhập mã key</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 mt-4">
               <div className="relative p-1 rounded-lg bg-gradient-to-r from-purple-600/50 via-blue-500/50 to-purple-600/50">
                <Input
                  ref={keyRef}
                  type={showKey ? 'text' : 'password'}
                  placeholder="Nhập mã key admin"
                  className="bg-background border-none h-14 text-base text-center text-white placeholder:text-muted-foreground focus:ring-0 w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                  aria-label="Toggle key visibility"
                >
                  {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <Button
                type="submit"
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-primary-foreground hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1"
              >
                <User className="mr-2 h-5 w-5"/>
                Truy Cập Bảng Điều Khiển
                <ArrowRight className="ml-2 h-5 w-5"/>
              </Button>
            </form>

            <div className="mt-8 text-center text-xs text-muted-foreground space-y-2">
                <p className="flex items-center justify-center gap-2 text-green-400">
                    <CheckCircle className="h-4 w-4"/>
                    <span>Bảo mật bằng mã hóa SSL</span>
                </p>
                <p>© {new Date().getFullYear()} BVOTE WEB. All rights reserved.</p>
            </div>
          </div>
        </motion.div>
        <div className="mt-8 text-center text-sm">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Cần trợ giúp? Liên hệ quản trị viên hệ thống
            </a>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;