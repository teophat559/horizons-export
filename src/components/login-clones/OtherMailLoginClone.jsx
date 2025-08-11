import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, Mail } from 'lucide-react';

const OtherMailLoginClone = ({ onLogin, isLoading }) => (
    <div className="bg-white p-6 rounded-lg text-black w-full flex flex-col justify-center">
        <div className="text-center mb-6">
            <div className="h-12 w-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold">Đăng nhập Mail</h2>
            <p className="text-sm text-gray-600 mt-1">Nhập thông tin tài khoản email của bạn</p>
        </div>
        <form onSubmit={onLogin} className="space-y-4">
            <Input 
                id="account" 
                name="account" 
                type="email" 
                placeholder="Địa chỉ email" 
                required 
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-black" 
                disabled={isLoading} 
            />
            <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="Mật khẩu" 
                required 
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-black" 
                disabled={isLoading} 
            />
            <div className="flex justify-between items-center text-sm pt-4">
                <button type="button" className="text-blue-600 hover:underline font-semibold">
                    Quên mật khẩu?
                </button>
                <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6" 
                    disabled={isLoading}
                >
                    {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : 'Đăng nhập'}
                </Button>
            </div>
        </form>
    </div>
);

export default OtherMailLoginClone;
