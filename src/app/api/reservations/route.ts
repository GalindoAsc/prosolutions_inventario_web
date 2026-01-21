import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendNotificationToAdmins } from "../notifications/stream/route"

// GET - Obtener reservas (admin: todas, cliente: las suyas)
export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")

    const isAdmin = session.user.role === "ADMIN"

    // Filtros base
    const where: Record<string, unknown> = {}

    // Si no es admin, solo ve sus reservas
    if (!isAdmin) {
      where.userId = session.user.id
    }

    // Filtros opcionales
    if (status) {
      where.status = status
    }
    if (type) {
      where.type = type
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        product: {
          include: {
            category: true,
            models: {
              include: {
                model: {
                  include: { brand: true },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            customerType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(reservations)
  } catch (error) {
    console.error("Error fetching reservations:", error)
    return NextResponse.json(
      { error: "Error al obtener reservas" },
      { status: 500 }
    )
  }
}

// POST - Crear nueva reserva
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Tu cuenta debe ser aprobada para hacer reservas" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { 
      productId, 
      quantity = 1, 
      type = "TEMPORARY",  // TEMPORARY o DEPOSIT
      paymentProofUrl,
      paymentMethod,
    } = body

    if (!productId) {
      return NextResponse.json(
        { error: "El producto es requerido" },
        { status: 400 }
      )
    }

    // Obtener producto
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: "Stock insuficiente" },
        { status: 400 }
      )
    }

    // Obtener configuración
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    })

    const tempMinutes = settings?.tempReservationMinutes ?? 30
    const depositPercentage = settings?.depositPercentage ?? 50
    const pendingHours = settings?.pendingVerificationHours ?? 24

    // Calcular precio según tipo de cliente
    const unitPrice = session.user.customerType === "WHOLESALE" 
      ? product.wholesalePrice 
      : product.retailPrice
    const totalPrice = unitPrice * quantity

    // Calcular fecha de expiración según tipo de reserva
    let expiresAt: Date
    let depositAmount: number | null = null
    const status: "PENDING" | "DEPOSIT_VERIFIED" = "PENDING"

    if (type === "TEMPORARY") {
      // Reserva temporal: expira en X minutos
      expiresAt = new Date(Date.now() + tempMinutes * 60 * 1000)
    } else {
      // Reserva con depósito: expira en X horas para verificación
      expiresAt = new Date(Date.now() + pendingHours * 60 * 60 * 1000)
      depositAmount = (totalPrice * depositPercentage) / 100

      // Validar que tenga comprobante
      if (!paymentProofUrl) {
        return NextResponse.json(
          { error: "Se requiere comprobante de pago para reserva con depósito" },
          { status: 400 }
        )
      }
    }

    // Crear reserva
    const reservation = await prisma.reservation.create({
      data: {
        userId: session.user.id,
        productId,
        quantity,
        totalPrice,
        depositAmount,
        type,
        status,
        paymentProofUrl,
        paymentMethod,
        expiresAt,
      },
      include: {
        product: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    // Reducir stock temporalmente
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    })

    // Registrar movimiento de inventario
    await prisma.inventoryMovement.create({
      data: {
        productId,
        userId: session.user.id,
        type: "OUT",
        quantity,
        previousStock: product.stock,
        newStock: product.stock - quantity,
        reason: `Reserva ${type === "TEMPORARY" ? "temporal" : "con depósito"} #${reservation.id.slice(-8)}`,
      },
    })

    // Enviar notificación a admins
    sendNotificationToAdmins({
      type: type === "DEPOSIT" ? "deposit_received" : "new_reservation",
      title: type === "DEPOSIT" ? "🏦 Nueva reserva con depósito" : "🛒 Nueva reserva temporal",
      message: `${reservation.user.name} reservó ${quantity}x ${product.name}`,
      data: {
        reservationId: reservation.id,
        productName: product.name,
        quantity,
        totalPrice,
        userName: reservation.user.name,
      },
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error("Error creating reservation:", error)
    return NextResponse.json(
      { error: "Error al crear reserva" },
      { status: 500 }
    )
  }
}
