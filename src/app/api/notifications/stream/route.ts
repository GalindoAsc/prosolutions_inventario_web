import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Almacenar conexiones activas
const connections = new Map<string, ReadableStreamDefaultController>()

// Tipos de eventos
export type NotificationType = 
  | "new_reservation"
  | "reservation_updated"
  | "deposit_received"
  | "user_registered"
  | "low_stock"

export interface NotificationPayload {
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  timestamp: string
}

// Función para enviar notificación a todos los admins conectados
export function sendNotificationToAdmins(notification: Omit<NotificationPayload, "timestamp">) {
  const payload: NotificationPayload = {
    ...notification,
    timestamp: new Date().toISOString(),
  }

  const data = `data: ${JSON.stringify(payload)}\n\n`

  connections.forEach((controller, id) => {
    try {
      controller.enqueue(new TextEncoder().encode(data))
    } catch {
      // Si falla, eliminar la conexión
      connections.delete(id)
    }
  })
}

export async function GET(req: NextRequest) {
  const session = await auth()

  // Solo admins pueden conectarse - enviar SSE de error en lugar de JSON
  if (!session?.user || session.user.role !== "ADMIN") {
    const errorStream = new ReadableStream({
      start(controller) {
        const errorEvent = `data: ${JSON.stringify({
          type: "error",
          code: "UNAUTHORIZED",
          message: "No autorizado para recibir notificaciones",
          timestamp: new Date().toISOString(),
        })}\n\n`
        controller.enqueue(new TextEncoder().encode(errorEvent))
        controller.close()
      },
    })

    return new Response(errorStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
      },
    })
  }

  const connectionId = crypto.randomUUID()

  const stream = new ReadableStream({
    start(controller) {
      connections.set(connectionId, controller)

      // Enviar evento de conexión
      const connectEvent = `data: ${JSON.stringify({
        type: "connected",
        message: "Conectado a notificaciones",
        timestamp: new Date().toISOString(),
      })}\n\n`
      controller.enqueue(new TextEncoder().encode(connectEvent))

      // Heartbeat cada 30 segundos para mantener la conexión
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
          connections.delete(connectionId)
        }
      }, 30000)

      // Cleanup cuando se cierra la conexión
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        connections.delete(connectionId)
        try {
          controller.close()
        } catch {
          // Ya cerrado
        }
      })
    },
    cancel() {
      connections.delete(connectionId)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
