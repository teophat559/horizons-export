import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, Smartphone } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useEventBus } from '@/contexts/AppContext';

const ApprovalPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const EventBus = useEventBus();
    const { forAccount } = location.state || {};
    
    useEffect(() => {
        if (!forAccount) {
            toast({
                title: 'Lỗi',
                description: 'Không tìm thấy thông tin phiên đăng nhập.',
                variant: 'destructive',
            });
            navigate('/');
        }
    }, [forAccount, navigate, toast]);

    useEffect(() => {
        const handleApprovalSuccess = (data) => {
            if (data.forAccount === forAccount) {
                 toast({
                    title: 'Thành công!',
                    description: 'Đã phê duyệt đăng nhập. Đang chuyển hướng...',
                });
                setTimeout(() => navigate('/'), 2000);
            }
        };

        const unsubscribe = EventBus.subscribe('user_login_approved', handleApprovalSuccess);
        return () => unsubscribe();
    }, [EventBus, forAccount, navigate, toast]);


    return (
        <>
            <Helmet>
                <title>Chờ Phê Duyệt - BVOTE WEB</title>
            </Helmet>
            <div className="min-h-screen flex items-center justify-center main-gradient-bg p-4">
                <Card className="w-full max-w-md bg-card/70 backdrop-blur-lg border-white/10 text-white">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit mb-4">
                            <Smartphone className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Phê duyệt đăng nhập</CardTitle>
                        <CardDescription className="text-slate-400 pt-2">
                           Kiểm tra thông báo trên thiết bị khác của bạn và phê duyệt để tiếp tục.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                            <img 
                                className="w-full h-auto object-contain rounded-md"
                                alt="Illustration of two-factor authentication on mobile devices"
                             src="https://storage.googleapis.com/hostinger-horizons-assets-prod/bd437477-89d8-41b6-a8e0-146e82a742d2/b0d4e0f984ea6f0558aed5c1698e30ad.png" />
                            <div className="flex items-center justify-center mt-4">
                                <Loader className="h-6 w-6 animate-spin text-primary" />
                                <div className="ml-3 text-left">
                                    <p className="font-semibold">Đang chờ phê duyệt...</p>
                                    <p className="text-sm text-slate-400">Hành động này sẽ hết hạn sau vài phút.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default ApprovalPage;