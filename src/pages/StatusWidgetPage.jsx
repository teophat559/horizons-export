import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { DynamicStatusWidget } from '@/components/dashboard/DynamicStatusWidget';

const StatusWidgetPage = () => {
  return (
    <>
      <Helmet>
        <title>Widget Trạng Thái - Bảng Điều Khiển</title>
        <meta name="description" content="Quản lý và tùy chỉnh widget trạng thái động." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="p-4"
      >
        <h1 className="text-2xl font-bold text-white mb-4">Widget Trạng Thái Động</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <DynamicStatusWidget />
        </div>
        <div className="mt-6 p-4 rounded-lg bg-gray-800/50 text-gray-300">
            <h2 className="font-semibold text-lg text-white mb-2">Hướng dẫn sử dụng:</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Nhấp vào tiêu đề để chuyển đổi giữa các tiêu đề đã tạo.</li>
                <li>Hiệu ứng nhấp nháy sẽ tự động kích hoạt vào lúc 18:00:00 (giờ Mỹ).</li>
                <li>Sử dụng nút <span className="text-green-400 font-mono">Bật/Tắt</span> để kiểm soát hiệu ứng.</li>
                <li>Nhấn nút <span className="text-blue-400 font-mono">[+]</span> để thêm tiêu đề mới.</li>
                <li>Nhấn nút <span className="text-red-400 font-mono">[X]</span> để xóa tiêu đề hiện tại.</li>
            </ul>
        </div>
      </motion.div>
    </>
  );
};

export default StatusWidgetPage;