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
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const onNotificationRef = useRef(onNotification)
  
  // Actualizar ref cuando cambia onNotification
  useEffect(() => {
    onNotificationRef.current = onNotification
  }, [onNotification])

  const connect = useCallback(() => {
    // Evitar reconexiones excesivas
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log("SSE: Máximo de intentos de reconexión alcanzado")
      return
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource("/api/notifications/stream")
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      reconnectAttemptsRef.current = 0 // Reset intentos al conectar
      console.log("SSE: Conectado a notificaciones")
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Si recibimos error de autenticación, no reconectar
        if (data.type === "error" && data.code === "UNAUTHORIZED") {
          console.log("SSE: No autorizado, desconectando")
          eventSource.close()
          setIsConnected(false)
          return
        }
        
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
        onNotificationRef.current?.(notification)
      } catch (error) {
        console.error("SSE: Error parsing message", error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
      reconnectAttemptsRef.current += 1
      
      // Reconectar con backoff exponencial
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(5000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000)
        console.log(`SSE: Reconectando en ${delay/1000}s (intento ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }
    }
  }, [])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    reconnectAttemptsRef.current = 0
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

  const resetAndReconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    reconnect: resetAndReconnect,
  }
}
