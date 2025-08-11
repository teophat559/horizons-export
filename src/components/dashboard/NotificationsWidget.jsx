import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, CheckCircle, AlertTriangle, XCircle, Info, ArrowRight } from 'lucide-react';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-400" />;
    default:
      return <Info className="h-5 w-5 text-blue-400" />;
  }
};

export const NotificationsWidget = () => {
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const latestNotifications = notifications.slice(0, 3);

  return (
    <Card className="cyber-card-bg p-4 text-slate-200 shadow-lg flex flex-col h-full">
      <h2 className="text-center font-bold text-xl mb-3 text-white" style={{ textShadow: '0 0 5px #4a00e0' }}>Thông Báo</h2>
      <div className="flex-grow space-y-3 text-sm text-slate-300 overflow-y-auto pr-2">
        {latestNotifications.length > 0 ? (
          latestNotifications.map(n => (
            <div key={n.id} className="flex items-start space-x-3 p-1 rounded hover:bg-slate-700/50 transition-colors">
              <span className="mt-0.5">{getNotificationIcon(n.type)}</span>
              <p className="truncate flex-1" title={n.message}>{n.message}</p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Bell className="h-8 w-8 mb-2" />
            <p>Không có thông báo mới.</p>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-3 w-full text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 text-sm"
        onClick={() => navigate('/admin/notification-management/history')}
      >
        Xem tất cả <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  );
};