import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, Trash2, CheckCheck } from 'lucide-react';
import NotificationItem from '@/components/notifications/NotificationItem';

const NotificationsPage = () => {
  const {
    notifications,
    markAllAsRead,
    deleteAll,
    deleteNotification,
    markAsRead,
  } = useNotifications();

  return (
    <>
      <Helmet>
        <title>Lịch sử Thông báo - BVOTE WEB</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cyber-main-bg rounded-lg min-h-[calc(100vh-20px)]"
      >
        <div className="p-4 border-b border-purple-500/30 flex items-center">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <h2 className="text-center font-bold text-lg flex-1 text-white" style={{ textShadow: '0 0 8px rgba(138, 45, 226, 0.8)' }}>
            LỊCH SỬ THÔNG BÁO
          </h2>
        </div>

        <div className="p-4">
          <Card className="cyber-card-bg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center">
                  <Bell className="mr-3 text-yellow-400" />
                  Hộp thư Thông báo
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Tất cả thông báo từ hệ thống sẽ được hiển thị ở đây.
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button onClick={markAllAsRead} variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300">
                  <CheckCheck className="mr-2 h-4 w-4" /> Đánh dấu tất cả đã đọc
                </Button>
                <Button onClick={deleteAll} variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Xóa tất cả
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onDelete={deleteNotification}
                      onMarkAsRead={markAsRead}
                    />
                  ))
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <Bell className="mx-auto h-12 w-12 mb-4" />
                    <p>Không có thông báo nào.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </>
  );
};

export default NotificationsPage;