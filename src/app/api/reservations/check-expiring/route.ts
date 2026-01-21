import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendNotificationToAdmins } from "../../notifications/stream/route"

// GET /api/reservations/check-expiring - Verificar y notificar reservas próximas a expirar
// Puede ser llamada por un cron job externo cada 5-10 minutos
export async function GET() {
  try {
    const now = new Date()
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000)

    // 1. Buscar reservas que expiran en los próximos 30 minutos y aún están activas
    const expiringReservations = await prisma.reservation.findMany({
      where: {
        status: {
          in: ["PENDING", "DEPOSIT_VERIFIED", "APPROVED"],
        },
        expiresAt: {
          gt: now,
          lte: thirtyMinutesFromNow,
        },
      },
      include: {
        product: {
          select: { name: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    })

    // 2. Buscar reservas que ya expiraron pero no están marcadas como EXPIRED
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: {
          in: ["PENDING", "DEPOSIT_VERIFIED", "APPROVED"],
        },
        expiresAt: {
          lte: now,
        },
      },
      include: {
        product: {
          select: { id: true, name: true, stock: true },
        },
        user: {
          select: { name: true },
        },
      },
    })

    // 3. Marcar como expiradas y devolver stock
    const expiredResults = []
    for (const reservation of expiredReservations) {
      try {
        // Actualizar reserva a EXPIRED
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { status: "EXPIRED" },
        })

        // Devolver stock
        await prisma.product.update({
          where: { id: reservation.product.id },
          data: {
            stock: {
              increment: reservation.quantity,
            },
          },
        })

        // Registrar movimiento de inventario
        const product = await prisma.product.findUnique({
          where: { id: reservation.product.id },
          select: { stock: true },
        })

        await prisma.inventoryMovement.create({
          data: {
            type: "IN",
            quantity: reservation.quantity,
            previousStock: (product?.stock || 0) - reservation.quantity,
            newStock: product?.stock || 0,
            reason: `Reserva expirada - Stock devuelto (${reservation.user.name})`,
            productId: reservation.product.id,
          },
        })

        expiredResults.push({
          id: reservation.id,
          product: reservation.product.name,
          user: reservation.user.name,
          status: "marked_expired",
        })

        // Notificar a admins
        sendNotificationToAdmins({
          type: "reservation_expired",
          title: "Reserva Expirada",
          message: `La reserva de ${reservation.user.name} para "${reservation.product.name}" ha expirado`,
          data: { reservationId: reservation.id },
        })
      } catch (error) {
        console.error(`Error processing expired reservation ${reservation.id}:`, error)
        expiredResults.push({
          id: reservation.id,
          error: "Failed to process",
        })
      }
    }

    // 4. Notificar sobre reservas próximas a expirar (solo una vez)
    const warningResults = []
    for (const reservation of expiringReservations) {
      const minutesLeft = Math.floor(
        (new Date(reservation.expiresAt).getTime() - now.getTime()) / (1000 * 60)
      )

      // Solo notificar si quedan exactamente entre 25-30 minutos (para evitar spam)
      if (minutesLeft >= 25 && minutesLeft <= 30) {
        sendNotificationToAdmins({
          type: "reservation_expiring_soon",
          title: "Reserva por Expirar",
          message: `Reserva de ${reservation.user.name} para "${reservation.product.name}" expira en ${minutesLeft} minutos`,
          data: {
            reservationId: reservation.id,
            minutesLeft,
          },
        })

        warningResults.push({
          id: reservation.id,
          product: reservation.product.name,
          user: reservation.user.name,
          minutesLeft,
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      expired: {
        count: expiredResults.length,
        reservations: expiredResults,
      },
      expiringSoon: {
        count: warningResults.length,
        reservations: warningResults,
      },
    })
  } catch (error) {
    console.error("Error checking expiring reservations:", error)
    return NextResponse.json(
      { error: "Error al verificar reservas" },
      { status: 500 }
    )
  }
}

// POST - Forzar verificación (requiere auth admin)
export async function POST() {
  // Mismo comportamiento que GET, útil para llamadas manuales
  return GET()
}
