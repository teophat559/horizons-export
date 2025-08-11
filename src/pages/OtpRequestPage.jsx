import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Loader } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useEventBus } from '@/contexts/AppContext';

const OtpRequestPage = () => {
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const EventBus = useEventBus();
    const inputRefs = useRef([]);

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
                    description: 'Đăng nhập thành công. Đang chuyển hướng...',
                });
                setTimeout(() => navigate('/'), 2000);
            }
        };

        const unsubscribe = EventBus.subscribe('user_login_approved', handleApprovalSuccess);
        return () => unsubscribe();
    }, [EventBus, forAccount, navigate, toast]);


    const handleInputChange = (e, index) => {
        const { value } = e.target;
        if (/^[0-9]$/.test(value)) {
            const newOtp = otp.substring(0, index) + value + otp.substring(index + 1);
            setOtp(newOtp);
            if (index < 5) {
                inputRefs.current[index + 1].focus();
            }
        }
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng nhập đủ 6 chữ số OTP.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        EventBus.dispatch('user_submitted_otp', { id: forAccount, otp });
        
        toast({
          title: 'Đã gửi OTP!',
          description: 'Vui lòng chờ admin xác nhận.',
        });
        
        setTimeout(() => setIsSubmitting(false), 2000);
    };

    return (
        <>
            <Helmet>
                <title>Nhập Mã OTP - BVOTE WEB</title>
            </Helmet>
            <div className="min-h-screen flex items-center justify-center main-gradient-bg p-4">
                <Card className="w-full max-w-md bg-card/70 backdrop-blur-lg border-white/10 text-white">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit mb-4">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Xác thực hai yếu tố</CardTitle>
                        <CardDescription className="text-slate-400 pt-2">
                           Nhập mã gồm 6 chữ số từ ứng dụng xác thực của bạn.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex justify-center gap-2">
                                {Array(6).fill('').map((_, index) => (
                                    <Input
                                        key={index}
                                        ref={el => inputRefs.current[index] = el}
                                        type="tel"
                                        maxLength="1"
                                        value={otp[index] || ''}
                                        onChange={(e) => handleInputChange(e, index)}
                                        className="w-12 h-14 text-center text-2xl font-bold bg-slate-800/50 border-slate-700 focus:ring-primary"
                                    />
                                ))}
                            </div>
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                                {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                Gửi mã
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default OtpRequestPage;