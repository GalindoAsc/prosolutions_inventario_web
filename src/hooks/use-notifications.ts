"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export type NotificationType =
  | "new_reservation"
  | "reservation_updated"
  | "deposit_received"
  | "user_registered"
  | "low_stock"
  | "connected"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  timestamp: string
  read: boolean
}

interface UseNotificationsOptions {
  onNotification?: (notification: Notification) => void
  enabled?: boolean
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { onNotification, enabled = true } = options
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource("/api/notifications/stream")
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      console.log("SSE: Conectado a notificaciones")
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === "connected") {
          setIsConnected(true)
          return
        }

        const notification: Notification = {
          id: crypto.randomUUID(),
          type: data.type,
          title: data.title || "Notificación",
          message: data.message,
          data: data.data,
          timestamp: data.timestamp,
          read: false,
        }

        setNotifications((prev) => [notification, ...prev])
        setUnreadCount((prev) => prev + 1)
        onNotification?.(notification)
      } catch (error) {
        console.error("SSE: Error parsing message", error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
      
      // Reconectar después de 5 segundos
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        if (enabled) {
          connect()
        }
      }, 5000)
    }
  }, [enabled, onNotification])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    setIsConnected(false)
  }, [])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    reconnect: connect,
  }
}
