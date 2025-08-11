import React, { useRef, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, VideoOff, PhoneMissed, Camera } from 'lucide-react';

const VideoCallPage = () => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
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
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError("Bạn đã từ chối quyền truy cập camera. Vui lòng cấp quyền trong cài đặt trình duyệt để tiếp tục.");
                } else {
                    setError("Không thể truy cập camera. Hãy chắc chắn rằng thiết bị của bạn có camera và không có ứng dụng nào khác đang sử dụng nó.");
                }
                setPermissionState('denied');
            }
        } else {
            setError("Trình duyệt của bạn không hỗ trợ truy cập camera.");
            setPermissionState('denied');
        }
    };

    useEffect(() => {
        // Automatically start the process when the component mounts
        const timer = setTimeout(() => {
            requestCamera();
        }, 1500); // Wait 1.5 seconds to show the initial message

        return () => {
            clearTimeout(timer);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleEndCall = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setError("Cuộc gọi đã kết thúc.");
        setPermissionState('denied');
    };

    const renderContent = () => {
        switch (permissionState) {
            case 'idle':
            case 'pending':
                return (
                    <motion.div
                        key="pending"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-center flex flex-col items-center"
                    >
                        <Camera className="w-24 h-24 text-blue-400 animate-pulse mb-6" />
                        <h1 className="text-3xl font-bold">Chuẩn bị kết nối...</h1>
                        <p className="text-lg text-gray-300 mt-2">Trình duyệt sẽ yêu cầu quyền truy cập camera của bạn.</p>
                        <p className="text-lg text-gray-300">Vui lòng chọn "Cho phép" để bắt đầu.</p>
                    </motion.div>
                );
            case 'granted':
                return (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                );
            case 'denied':
                return (
                    <motion.div
                        key="denied"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center text-center p-6 bg-red-900/60 rounded-xl shadow-lg"
                    >
                        <VideoOff className="w-20 h-20 text-red-400 mb-4" />
                        <p className="text-2xl font-semibold">Không thể truy cập Camera</p>
                        <p className="text-md text-gray-300 max-w-md mt-2">{error}</p>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Helmet>
                <title>Cuộc gọi Video...</title>
                <meta name="description" content="Đang thực hiện cuộc gọi video..." />
            </Helmet>
            <div className="relative w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>

                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/70 via-transparent to-black/50 z-10 pointer-events-none"></div>

                <div className="relative z-20 flex flex-col items-center justify-between h-full w-full p-8">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center"
                    >
                        {permissionState === 'granted' && (
                            <>
                                <h1 className="text-3xl font-bold text-shadow">Đang trong cuộc gọi</h1>
                                <p className="text-lg text-gray-200 text-shadow">Đã kết nối</p>
                            </>
                        )}
                    </motion.div>

                    <div></div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <button
                            onClick={handleEndCall}
                            className="flex items-center justify-center w-20 h-20 bg-red-600 rounded-full hover:bg-red-700 transition-colors shadow-lg ring-4 ring-red-600/50 animate-pulse"
                            aria-label="Kết thúc cuộc gọi"
                        >
                            <PhoneMissed className="w-10 h-10" />
                        </button>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default VideoCallPage;