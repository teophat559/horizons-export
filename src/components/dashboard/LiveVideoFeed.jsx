import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Radio, StopCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export const LiveVideoFeed = () => {
  const [isRecording, setIsRecording] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
    toast.success("Đã gửi yêu cầu bắt đầu quay video!");
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast.info("Đã gửi yêu cầu dừng quay video.");
  };

  return (
    <Card className="cyber-card-bg overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold text-white">
          Khung hình Video Trực tiếp
        </CardTitle>
        <div className="flex items-center space-x-2">
          {isRecording && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
          <span className={`font-mono text-sm ${isRecording ? 'text-red-400' : 'text-gray-400'}`}>
            {isRecording ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-black rounded-md flex items-center justify-center border border-slate-700">
          <div className="text-center text-gray-500">
            <Video className="mx-auto h-12 w-12" />
            <p className="mt-2 text-sm">
              {isRecording ? 'Đang nhận tín hiệu từ user...' : 'Chưa có tín hiệu'}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button 
          onClick={handleStartRecording} 
          disabled={isRecording}
          variant="outline"
          className="border-green-500 text-green-400 hover:bg-green-500/10 hover:text-green-300"
        >
          <Radio className="mr-2 h-4 w-4" />
          Bắt đầu Quay
        </Button>
        <Button 
          onClick={handleStopRecording} 
          disabled={!isRecording}
          variant="destructive"
        >
          <StopCircle className="mr-2 h-4 w-4" />
          Dừng Quay
        </Button>
      </CardFooter>
    </Card>
  );
};