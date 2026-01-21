import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendNotificationToAdmins, NotificationType } from "../stream/route"

// API para enviar notificaciones programáticamente
export async function POST(req: NextRequest) {
  const session = await auth()

  // Solo admins pueden enviar notificaciones manuales
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type, title, message, data } = body as {
      type: NotificationType
      title: string
      message: string
      data?: Record<string, unknown>
    }

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "type, title y message son requeridos" },
        { status: 400 }
      )
    }

    sendNotificationToAdmins({ type, title, message, data })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Error al procesar la notificación" },
      { status: 500 }
    )
  }
}
