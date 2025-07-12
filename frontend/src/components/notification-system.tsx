'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Bell, Clock, AlertTriangle, CheckCircle, FileText, Zap, Calendar } from 'lucide-react';
import { applicationApi, NotificationEvent } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Notification extends NotificationEvent {
  id: string;
  read: boolean;
}

interface NotificationSystemProps {
  onNotificationReceived?: (notification: NotificationEvent) => void;
}

export function NotificationSystem({ onNotificationReceived }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const getNotificationPriority = (type: string): 'urgent' | 'high' | 'normal' => {
    switch (type) {
      case 'deadline_monitor':
      case 'urgent_reminder':
      case 'deadline_overdue':
        return 'urgent';
      case 'deadline_reminder':
      case 'manual_reminder':
        return 'high';
      default:
        return 'normal';
    }
  };

  const sortNotificationsByPriority = (notifications: Notification[]) => {
    return notifications.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2 };
      const aPriority = getNotificationPriority(a.type);
      const bPriority = getNotificationPriority(b.type);
      
      if (aPriority !== bPriority) {
        return priorityOrder[aPriority] - priorityOrder[bPriority];
      }
      
      // If same priority, sort by timestamp (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  };

  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const priority = getNotificationPriority(notification.type);
      
      let title = '';
      let options: NotificationOptions = {
        icon: '/favicon.ico',
        tag: notification.id,
      };

      if (priority === 'urgent') {
        title = '🚨 URGENT: Application Deadline Alert';
        options = {
          ...options,
          body: notification.message,
          requireInteraction: true, // Keeps notification visible until user interacts
          badge: '/favicon.ico',
        };
      } else if (notification.type === 'cover_letter_generated') {
        title = '📄 Cover Letter Generated';
        options = {
          ...options,
          body: `Cover letter ready for ${notification.company} - ${notification.role}`,
        };
      }

      if (title) {
        const browserNotification = new Notification(title, options);
        
        // Auto-close non-urgent notifications after 5 seconds
        if (priority !== 'urgent') {
          setTimeout(() => {
            browserNotification.close();
          }, 5000);
        }

        // Handle notification click
        browserNotification.onclick = () => {
          window.focus();
          setShowNotifications(true);
          markAsRead(notification.id);
          browserNotification.close();
        };
      }
    }
  };

  const addNotification = useCallback(
    (event: NotificationEvent) => {
      const notification: Notification = {
        ...event,
        id: `${event.applicationId}-${Date.now()}`,
        read: false,
      };

      setNotifications((prev) => [notification, ...prev.slice(0, 49)]); // Keep max 50 notifications
      onNotificationReceived?.(event);

      // Show browser notification for urgent alerts and cover letter generation
      const priority = getNotificationPriority(event.type);
      if (priority === 'urgent' || event.type === 'cover_letter_generated') {
        showBrowserNotification(notification);
      }
    },
    [onNotificationReceived],
  );

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    let socketConnection: { close: () => void } | null = null;

    const connectToSocket = () => {
      try {
        socketConnection = applicationApi.createNotificationStream(
          // onMessage callback
          (event) => {
            try {
              console.log('Received notification:', event);
              const data: NotificationEvent = JSON.parse(event.data);
              addNotification(data);
            } catch (error) {
              console.error('Failed to parse notification:', error);
            }
          },
          // onError callback
          (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);

            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
              connectToSocket();
            }, 5000);
          },
          // onOpen callback
          () => {
            console.log('📡 Connected to notification stream via Socket.IO');
            setIsConnected(true);
          },
        );
      } catch (error) {
        console.error('Failed to create Socket.IO connection:', error);
        setIsConnected(false);
      }
    };

    connectToSocket();

    return () => {
      if (socketConnection) {
        socketConnection.close();
      }
    };
  }, [addNotification]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline_reminder':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'deadline_overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'deadline_monitor':
        return <AlertTriangle className="h-4 w-4 text-red-700" />;
      case 'status_update':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'application_deleted':
        return <X className="h-4 w-4 text-red-600" />;
      case 'cover_letter_generated':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'manual_reminder':
        return <Calendar className="h-4 w-4 text-orange-600" />;
      case 'urgent_reminder':
        return <Zap className="h-4 w-4 text-red-700" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNotificationVariant = (type: string) => {
    switch (type) {
      case 'deadline_reminder':
        return 'warning';
      case 'deadline_overdue':
        return 'destructive';
      case 'deadline_monitor':
        return 'destructive';
      case 'status_update':
        return 'success';
      case 'application_deleted':
        return 'destructive';
      case 'cover_letter_generated':
        return 'secondary';
      case 'manual_reminder':
        return 'warning';
      case 'urgent_reminder':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getNotificationStyles = (notification: Notification) => {
    const priority = getNotificationPriority(notification.type);
    let baseClasses = `p-4 border-b cursor-pointer hover:bg-gray-50 ${
      !notification.read ? 'bg-blue-50' : ''
    }`;

    if (priority === 'urgent' && !notification.read) {
      baseClasses = `p-4 border-b cursor-pointer hover:bg-red-50 bg-red-100 border-l-4 border-l-red-500 ${
        !notification.read ? 'animate-pulse' : ''
      }`;
    } else if (priority === 'high' && !notification.read) {
      baseClasses = `p-4 border-b cursor-pointer hover:bg-yellow-50 bg-yellow-50 border-l-4 border-l-yellow-500`;
    }

    return baseClasses;
  };

  // Sort notifications by priority before displaying
  const sortedNotifications = sortNotificationsByPriority(notifications);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {!isConnected && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {showNotifications && (
        <Card className="absolute right-0 top-12 w-96 max-h-96 overflow-hidden z-50 shadow-lg">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                  Clear all
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowNotifications(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {sortedNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No notifications yet</div>
              ) : (
                sortedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={getNotificationStyles(notification)}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getNotificationVariant(notification.type)}>
                            {notification.type.replace(/_/g, ' ')}
                          </Badge>
                          {getNotificationPriority(notification.type) === 'urgent' && (
                            <Badge variant="destructive" className="text-xs">
                              URGENT
                            </Badge>
                          )}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className={`text-sm mb-1 ${
                          getNotificationPriority(notification.type) === 'urgent' 
                            ? 'text-red-900 font-medium' 
                            : 'text-gray-900'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {notification.company} - {notification.role}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {!isConnected && (
              <div className="p-4 bg-yellow-50 border-t">
                <p className="text-xs text-yellow-700">
                  ⚠️ Not connected to real-time notifications
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
