import React, { useRef, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Camera, AlertTriangle } from 'lucide-react';

const LiveVideoWidget = () => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [permissionState, setPermissionState] = useState('idle'); // idle, pending, granted, denied

    const requestCamera = async () => {
        setPermissionState('pending');
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' }
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
                setPermissionState('granted');
            } catch (err) {
                console.error("Lỗi khi truy cập camera: ", err);
                setPermissionState('denied');
            }
        } else {
            setPermissionState('denied');
        }
    };

    useEffect(() => {
        // Attempt to get camera access when the widget mounts
        requestCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const renderContent = () => {
        switch (permissionState) {
            case 'granted':
                return (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover rounded-md"
                    />
                );
            case 'pending':
                return (
                    <motion.div
                        key="pending"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center flex flex-col items-center justify-center h-full"
                    >
                        <Camera className="w-12 h-12 text-blue-400 animate-pulse mb-2" />
                        <p className="text-sm font-semibold text-gray-300">Đang chờ kết nối...</p>
                    </motion.div>
                );
            case 'denied':
            default:
                return (
                     <motion.div
                        key="denied"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center text-center h-full"
                    >
                        <VideoOff className="w-12 h-12 text-red-500 mb-2" />
                        <p className="text-sm font-semibold text-red-400">Không có tín hiệu</p>
                        <p className="text-xs text-gray-400 mt-1">Không thể truy cập camera người dùng.</p>
                    </motion.div>
                );
        }
    };

    return (
        <Card className="cyber-card-bg h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold text-white">Quay Video Trực Tiếp</CardTitle>
                {permissionState === 'granted' ? (
                     <div className="flex items-center space-x-2 text-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold">LIVE</span>
                    </div>
                ) : (
                     <VideoOff className="h-6 w-6 text-gray-500" />
                )}
            </CardHeader>
            <CardContent className="flex-grow p-2">
                <div className="bg-black w-full h-full rounded-md overflow-hidden flex items-center justify-center">
                    <AnimatePresence mode="wait">
                       {renderContent()}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
};

export default LiveVideoWidget;