import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Candidate } from '../../types';
import { AdvancedDashboard } from '../analytics/AdvancedDashboard';
import { NotificationCenter } from '../ui/AdvancedComponents';
import { useWebSocket } from '../../hooks/useWebSocket';

interface EnhancedDashboardProps {
  candidates: Candidate[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

export const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ candidates }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // WebSocket connection
  const { isConnected, lastMessage } = useWebSocket('ws://localhost:3001/ws');

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const newNotification: Notification = {
        id: Date.now().toString(),
        title: lastMessage.data.title || 'اعلان جدید',
        message: lastMessage.data.message || 'پیام جدید دریافت شد',
        type: lastMessage.data.type || 'info',
        timestamp: new Date(lastMessage.timestamp),
        read: false
      };

      setNotifications(prev => [newNotification, ...prev]);
    }
  }, [lastMessage]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with status indicators */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">داشبورد پیشرفته</h1>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'متصل' : 'قطع شده'}
                </span>
              </div>

              {/* Online Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isOnline ? 'آنلاین' : 'آفلاین'}
                </span>
              </div>

              {/* Notification Center */}
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onClearAll={handleClearAll}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6"
      >
        <AdvancedDashboard candidates={candidates} />
      </motion.div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        onClick={() => {
          // Add new candidate action
          console.log('Add new candidate');
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </motion.button>
    </div>
  );
};

