import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Circle } from 'lucide-react';

const StatusIndicator = ({ color, text, isBlinking }) => (
  <div className="flex items-center space-x-2">
    <div className="relative flex items-center justify-center h-4 w-4">
      {isBlinking && <div className={`absolute h-4 w-4 rounded-full ${color} opacity-75 animate-ping`}></div>}
      <div className={`relative h-2.5 w-2.5 rounded-full ${color}`}></div>
    </div>
    <span className="text-sm text-gray-300">{text}</span>
  </div>
);

export const SystemStatusWidget = () => {
  return (
    <Card className="cyber-card-bg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-center text-gray-200">Hệ Thống</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-3 pt-2">
        <StatusIndicator color="bg-green-500" text="Online" isBlinking={true} />
        <StatusIndicator color="bg-blue-500" text="Đang chạy" />
        <StatusIndicator color="bg-yellow-500" text="Chờ OTP" />
        <StatusIndicator color="bg-red-500" text="Bị lắc" />
      </CardContent>
    </Card>
  );
};