import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Send, CheckCheck, Trash2, BellRing } from 'lucide-react';
import NotificationItem from '@/components/notifications/NotificationItem';

const NotificationList = ({ notifications, onSendNotification, onMarkAsRead, onMarkAllAsRead, onDeleteNotification, onDeleteAll }) => {
  return (
    <Card className="cyber-card-bg">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Button onClick={onSendNotification} className="glowing-button-cyber">
            <Send className="mr-2 h-4 w-4" /> Gửi Thông Báo
          </Button>
          <div className="flex items-center space-x-2">
            <Button onClick={onMarkAllAsRead} variant="outline" size="sm" className="border-blue-500 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300">
              <CheckCheck className="mr-2 h-4 w-4" /> Đánh dấu đã đọc
            </Button>
            <Button onClick={onDeleteAll} variant="destructive" size="sm" className="bg-red-800/50 hover:bg-red-700/50 border border-red-600 text-red-300">
              <Trash2 className="mr-2 h-4 w-4" /> Xóa tất cả
            </Button>
          </div>
        </div>
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
          {notifications.length > 0 ? (
            notifications.map(n => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDeleteNotification}
              />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BellRing className="mx-auto h-12 w-12 mb-4" />
              <p>Không có thông báo nào.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationList;