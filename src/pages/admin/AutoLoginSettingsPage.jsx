import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Bot, Save, Clock, Repeat, Users, SkipForward, ShieldAlert, Settings, Code, KeyRound } from 'lucide-react';

const AUTO_LOGIN_SETTINGS_KEY = 'autoLoginSettings';
const AUTO_LOGIN_PLATFORM_CFG_KEY = 'autoLoginPlatformConfigs';

const initialSettings = {
  isEnabled: false,
  delayInSeconds: 5,
  maxConcurrentLogins: 3,
  retryOnFailure: true,
  maxRetries: 2,
  ignoreOldRequestsMinutes: 5,
  defaultRequireApproval: false,
  defaultRequireOtp: false,
  // OTP helper (tùy chọn)
  otpCode: '',
  clearOtpAfterUse: true,
};

const defaultPlatformConfigs = {
  facebook: {
    loginUrl: 'https://www.facebook.com/login',
    homeUrl: 'https://www.facebook.com/',
    usernameSel: 'input[name="email"]',
    passwordSel: 'input[name="pass"]',
    submitSel: 'button[name="login"]',
    flow: 'single',
  },
  instagram: {
    loginUrl: 'https://www.instagram.com/accounts/login/',
    homeUrl: 'https://www.instagram.com/',
    usernameSel: 'input[name="username"]',
    passwordSel: 'input[name="password"]',
    submitSel: 'button[type="submit"]',
    flow: 'single',
  },
  google: {
    loginUrl: 'https://accounts.google.com/signin/v2/identifier',
    homeUrl: 'https://myaccount.google.com/',
    flow: 'google'
  },
  outlook: {
    loginUrl: 'https://login.live.com/',
    homeUrl: 'https://outlook.live.com/mail/',
    flow: 'microsoft'
  },
  yahoo: {
    loginUrl: 'https://login.yahoo.com/',
    homeUrl: 'https://www.yahoo.com/',
    flow: 'yahoo'
  },
  zalo: {
    loginUrl: 'https://id.zalo.me/account/login?continue=https%3A%2F%2Fchat.zalo.me',
    homeUrl: 'https://chat.zalo.me/',
    flow: 'zalo'
  }
};

const AutoLoginSettingsPage = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(initialSettings);
  const [platformCfgText, setPlatformCfgText] = useState(JSON.stringify(defaultPlatformConfigs, null, 2));

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(AUTO_LOGIN_SETTINGS_KEY);
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }
  const savedCfg = localStorage.getItem(AUTO_LOGIN_PLATFORM_CFG_KEY);
  if (savedCfg) setPlatformCfgText(savedCfg);
    } catch (error) {
      console.error("Failed to load auto login settings from localStorage", error);
    }
  }, []);

  const handleSwitchChange = (id, checked) => {
    setSettings(prev => ({
      ...prev,
      [id]: checked,
    }));
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setSettings(prev => ({ ...prev, [id]: numValue }));
    }
  };

  const handleSave = () => {
    try {
      // Validate JSON
      JSON.parse(platformCfgText);
      localStorage.setItem(AUTO_LOGIN_SETTINGS_KEY, JSON.stringify(settings));
      localStorage.setItem(AUTO_LOGIN_PLATFORM_CFG_KEY, platformCfgText);
      toast({
        title: 'Đã lưu cài đặt!',
        description: 'Cài đặt đăng nhập và tự động hóa đã được cập nhật.',
      });
    } catch (error) {
      toast({
        title: 'Lỗi!',
        description: 'Không thể lưu cài đặt. Kiểm tra JSON cấu hình nền tảng.',
        variant: 'destructive',
      });
      console.error("Failed to save auto login settings to localStorage", error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Cấu Hình Đăng Nhập - BVOTE WEB</title>
      </Helmet>
      <div className="p-4 cyber-main-bg text-white min-h-screen">
        <div className="max-w-6xl mx-auto">
          <Card className="cyber-card-bg border-purple-800">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-cyan-300 flex items-center">
                <Settings className="mr-3 h-8 w-8" />
                Cấu hình Đăng nhập & Tự động hóa
              </CardTitle>
              <CardDescription className="text-slate-400">
                Quản lý các quy tắc đăng nhập mặc định và hoạt động của Agent tự động.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12">

                {/* Left Column: Agent Settings */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center border-b border-cyan-700 pb-2">
                    <Bot className="mr-3 h-6 w-6" />
                    Cấu hình Agent Tự động
                  </h3>

                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <Label htmlFor="isEnabled" className="text-base font-medium text-white">Kích hoạt Tự động Đăng nhập</Label>
                    <Switch
                      id="isEnabled"
                      checked={settings.isEnabled}
                      onCheckedChange={(checked) => handleSwitchChange('isEnabled', checked)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="delayInSeconds" className="flex items-center text-slate-300"><Clock className="mr-2 h-4 w-4" /> Độ trễ trước khi bắt đầu (giây)</Label>
                      <Input id="delayInSeconds" type="number" value={settings.delayInSeconds} onChange={handleInputChange} className="bg-background border-border text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxConcurrentLogins" className="flex items-center text-slate-300"><Users className="mr-2 h-4 w-4" /> Số phiên chạy đồng thời tối đa</Label>
                      <Input id="maxConcurrentLogins" type="number" value={settings.maxConcurrentLogins} onChange={handleInputChange} className="bg-background border-border text-white" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="retryOnFailure" className="flex items-center text-slate-300"><Repeat className="mr-2 h-4 w-4" /> Tự động thử lại khi thất bại</Label>
                      <Switch id="retryOnFailure" checked={settings.retryOnFailure} onCheckedChange={(checked) => handleSwitchChange('retryOnFailure', checked)} />
                    </div>
                    <div className={`space-y-2 ${!settings.retryOnFailure && 'opacity-50'}`}>
                      <Label htmlFor="maxRetries" className="flex items-center text-slate-300"><Repeat className="mr-2 h-4 w-4" /> Số lần thử lại tối đa</Label>
                      <Input id="maxRetries" type="number" value={settings.maxRetries} onChange={handleInputChange} disabled={!settings.retryOnFailure} className="bg-background border-border text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ignoreOldRequestsMinutes" className="flex items-center text-slate-300"><SkipForward className="mr-2 h-4 w-4" /> Bỏ qua yêu cầu cũ hơn (phút)</Label>
                      <Input id="ignoreOldRequestsMinutes" type="number" value={settings.ignoreOldRequestsMinutes} onChange={handleInputChange} className="bg-background border-border text-white" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otpCode" className="flex items-center text-slate-300"><KeyRound className="mr-2 h-4 w-4" /> OTP (nếu có)</Label>
                      <Input id="otpCode" value={settings.otpCode} onChange={(e) => setSettings(prev => ({ ...prev, otpCode: e.target.value }))} className="bg-background border-border text-white" placeholder="Nhập OTP để dùng cho lần tiếp theo" />
                      <div className="flex items-center justify-between">
                        <Label htmlFor="clearOtpAfterUse" className="text-slate-300">Tự xoá OTP sau khi dùng</Label>
                        <Switch id="clearOtpAfterUse" checked={settings.clearOtpAfterUse} onCheckedChange={(v) => setSettings(prev => ({ ...prev, clearOtpAfterUse: v }))} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Security & Platform Configs */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center border-b border-orange-700 pb-2">
                    <ShieldAlert className="mr-3 h-6 w-6" />
                    Cấu hình Bảo mật Mặc định
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div>
                        <Label htmlFor="defaultRequireApproval" className="font-medium text-white">Bật mặc định yêu cầu phê duyệt</Label>
                        <p className="text-sm text-slate-400 mt-1">Mọi đăng nhập mới sẽ cần admin duyệt thủ công.</p>
                      </div>
                      <Switch
                        id="defaultRequireApproval"
                        checked={settings.defaultRequireApproval}
                        onCheckedChange={(checked) => handleSwitchChange('defaultRequireApproval', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div>
                        <Label htmlFor="defaultRequireOtp" className="font-medium text-white">Bật mặc định yêu cầu OTP</Label>
                        <p className="text-sm text-slate-400 mt-1">Mọi đăng nhập mới sẽ cần xác thực OTP.</p>
                      </div>
                      <Switch
                        id="defaultRequireOtp"
                        checked={settings.defaultRequireOtp}
                        onCheckedChange={(checked) => handleSwitchChange('defaultRequireOtp', checked)}
                      />
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-cyan-400 mt-8 mb-2 flex items-center border-b border-cyan-700 pb-2">
                    <Code className="mr-3 h-6 w-6" />
                    Cấu hình Selector/URL theo Nền tảng
                  </h3>
                  <p className="text-sm text-slate-400 mb-2">Chỉnh JSON để override loginUrl, homeUrl, selector và flow cho từng nền tảng. Key là tên nền tảng (facebook, google, ...).</p>
                  <textarea
                    value={platformCfgText}
                    onChange={(e) => setPlatformCfgText(e.target.value)}
                    className="w-full h-64 bg-slate-900 border border-slate-700 rounded p-3 font-mono text-sm"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="flex justify-center pt-8 mt-8 border-t border-slate-700">
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 glowing-button-cyber w-full max-w-xs text-lg py-6">
                  <Save className="mr-2 h-5 w-5" />
                  Lưu Tất Cả Cài Đặt
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AutoLoginSettingsPage;