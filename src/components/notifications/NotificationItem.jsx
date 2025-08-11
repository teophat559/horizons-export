import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

const getBadgeVariant = (type) => {
  switch (type) {
    case 'success': return 'bg-green-900/80 text-green-300 border-green-500/30';
    case 'warning': return 'bg-yellow-900/80 text-yellow-300 border-yellow-500/30';
    case 'error': return 'bg-red-900/80 text-red-300 border-red-500/30';
    default: return 'bg-blue-900/80 text-blue-300 border-blue-500/30';
  }
};

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const notificationType = notification.type || 'info';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start space-x-4 p-4 rounded-lg border ${notification.read ? 'bg-gray-800/30 border-gray-700/50' : 'bg-blue-900/30 border-blue-500/50'}`}
    >
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <Badge className={getBadgeVariant(notificationType)}>{notificationType.toUpperCase()}</Badge>
          <span className={`text-xs ${notification.read ? 'text-gray-500' : 'text-gray-400'}`}>{notification.time}</span>
        </div>
        <p className={`mt-2 ${notification.read ? 'text-gray-400' : 'text-white'}`}>{notification.message}</p>
      </div>
      <div className="flex flex-col space-y-2">
        {!notification.read && (
          <Button onClick={() => onMarkAsRead(notification.id)} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            Đã đọc
          </Button>
        )}
        <Button onClick={() => onDelete(notification.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default NotificationItem;