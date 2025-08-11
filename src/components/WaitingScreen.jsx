import React from 'react';
import { motion } from 'framer-motion';
import { Loader, ShieldCheck, FileText } from 'lucide-react';

const screenConfig = {
  approval: {
    icon: ShieldCheck,
    title: "Đang chờ phê duyệt...",
    description: "Admin cần xác nhận phiên đăng nhập của bạn. Vui lòng chờ trong giây lát.",
    image: "https://storage.googleapis.com/hostinger-horizons-assets-prod/bd437477-89d8-41b6-a8e0-146e82a742d2/b0d4e0f984ea6f0558aed5c1698e30ad.png",
    alt: "Illustration of two-factor authentication on mobile devices"
  },
  otp_request: {
    icon: FileText,
    title: "Đang chờ xác nhận code...",
    description: "Hệ thống đang yêu cầu mã OTP. Admin sẽ cung cấp mã cho bạn ngay.",
    image: "https://storage.googleapis.com/hostinger-horizons-assets-prod/bd437477-89d8-41b6-a8e0-146e82a742d2/94a0d249f05b9b777a83d34d0b16f31d.png",
    alt: "Illustration of a person entering a code on a phone"
  },
};

export const WaitingScreen = ({ state }) => {
  const config = screenConfig[state] || screenConfig['approval'];
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg text-black w-full max-w-sm text-center"
    >
        <div className="flex justify-center items-center mb-4">
            <Icon className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
        <p className="text-gray-600 mb-4">{config.description}</p>
        <div className="bg-gray-100 rounded-lg p-4">
            <img 
                className="w-full h-auto object-contain rounded-md"
                alt={config.alt}
                src={config.image}
            />
            <div className="flex items-center justify-center mt-4">
                <Loader className="h-6 w-6 animate-spin text-gray-500" />
                <div className="ml-3 text-left">
                    <p className="font-semibold">Vui lòng chờ...</p>
                    <p className="text-sm text-gray-500">Quá trình sẽ sớm hoàn tất.</p>
                </div>
            </div>
        </div>
    </motion.div>
  );
};