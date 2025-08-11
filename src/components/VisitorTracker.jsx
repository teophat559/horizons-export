import React, { useEffect, useRef } from 'react';
import { useNotifications } from '@/lib/hooks/useNotifications';

const VisitorTracker = ({ children }) => {
  const { addNotification } = useNotifications();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      // Optionally record a generic notification through backend
      addNotification({
        type: 'info',
        message: 'Có một lượt truy cập mới trên website.',
      });

      hasTracked.current = true;
    }
  }, [addNotification]);

  return <>{children}</>;
};

export default VisitorTracker;