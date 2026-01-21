import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Obtener configuración
export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
    })

    // Si no existe, crear con valores por defecto
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "default",
          tempReservationMinutes: 30,
          depositPercentage: 50,
          depositReservationHours: 48,
          pendingVerificationHours: 24,
          exchangeRate: 17.50,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar configuración (solo admin)
export async function PATCH(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const {
      tempReservationMinutes,
      depositPercentage,
      depositReservationHours,
      pendingVerificationHours,
      exchangeRate,
    } = body

    const settings = await prisma.settings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        tempReservationMinutes: tempReservationMinutes ?? 30,
        depositPercentage: depositPercentage ?? 50,
        depositReservationHours: depositReservationHours ?? 48,
        pendingVerificationHours: pendingVerificationHours ?? 24,
        exchangeRate: exchangeRate ?? 17.50,
      },
      update: {
        ...(tempReservationMinutes !== undefined && { tempReservationMinutes }),
        ...(depositPercentage !== undefined && { depositPercentage }),
        ...(depositReservationHours !== undefined && { depositReservationHours }),
        ...(pendingVerificationHours !== undefined && { pendingVerificationHours }),
        ...(exchangeRate !== undefined && { exchangeRate }),
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 }
    )
  }
}
