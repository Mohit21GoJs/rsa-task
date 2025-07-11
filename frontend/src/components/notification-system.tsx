'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Bell, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { applicationApi, NotificationEvent } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Notification extends NotificationEvent {
  id: string
  read: boolean
}

interface NotificationSystemProps {
  onNotificationReceived?: (notification: NotificationEvent) => void
}

export function NotificationSystem({ onNotificationReceived }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const addNotification = useCallback((event: NotificationEvent) => {
    const notification: Notification = {
      ...event,
      id: `${event.applicationId}-${Date.now()}`,
      read: false,
    }

    setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep max 50 notifications
    onNotificationReceived?.(event)
  }, [onNotificationReceived])

  useEffect(() => {
    let eventSource: EventSource | null = null

    const connectToSSE = () => {
      try {
        eventSource = applicationApi.createNotificationStream()
        
        eventSource.onopen = () => {
          console.log('📡 Connected to notification stream')
          setIsConnected(true)
        }

        eventSource.onmessage = (event) => {
          try {
            const data: NotificationEvent = JSON.parse(event.data)
            addNotification(data)
          } catch (error) {
            console.error('Failed to parse notification:', error)
          }
        }

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error)
          setIsConnected(false)
          
          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (eventSource?.readyState === EventSource.CLOSED) {
              connectToSSE()
            }
          }, 5000)
        }
      } catch (error) {
        console.error('Failed to create SSE connection:', error)
        setIsConnected(false)
      }
    }

    connectToSSE()

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [addNotification])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    )
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline_reminder':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'deadline_overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'status_update':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Bell className="h-4 w-4 text-blue-600" />
    }
  }

  const getNotificationVariant = (type: string) => {
    switch (type) {
      case 'deadline_reminder':
        return 'warning'
      case 'deadline_overdue':
        return 'destructive'
      case 'status_update':
        return 'success'
      default:
        return 'secondary'
    }
  }

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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getNotificationVariant(notification.type) as any}>
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-gray-900 mb-1">
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
                          e.stopPropagation()
                          removeNotification(notification.id)
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
  )
} 