import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MovementType } from "@prisma/client"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const productId = searchParams.get("productId")
        const type = searchParams.get("type") as MovementType | null
        const limit = parseInt(searchParams.get("limit") || "50")
        const offset = parseInt(searchParams.get("offset") || "0")

        const where: Record<string, unknown> = {}
        if (productId) where.productId = productId
        if (type) where.type = type

        const [movements, total] = await Promise.all([
            prisma.inventoryMovement.findMany({
                where,
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            barcode: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            prisma.inventoryMovement.count({ where }),
        ])

        return NextResponse.json({ movements, total })
    } catch (error) {
        console.error("Error fetching movements:", error)
        return NextResponse.json(
            { error: "Error al cargar movimientos" },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()
        const { productId, type, quantity, reason, notes } = body

        if (!productId || !type || !quantity) {
            return NextResponse.json(
                { error: "Producto, tipo y cantidad son requeridos" },
                { status: 400 }
            )
        }

        // Get current product stock
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true, stock: true },
        })

        if (!product) {
            return NextResponse.json(
                { error: "Producto no encontrado" },
                { status: 404 }
            )
        }

        const previousStock = product.stock
        let newStock = previousStock

        // Calculate new stock based on movement type
        switch (type) {
            case "IN":
            case "ADJUSTMENT_IN":
            case "RETURN":
                newStock = previousStock + quantity
                break
            case "OUT":
            case "ADJUSTMENT_OUT":
            case "SALE":
            case "DAMAGED":
            case "LOST":
                newStock = previousStock - quantity
                break
        }

        // Prevent negative stock
        if (newStock < 0) {
            return NextResponse.json(
                { error: "Stock insuficiente. Stock actual: " + previousStock },
                { status: 400 }
            )
        }

        // Create movement and update product stock in transaction
        const movement = await prisma.$transaction(async (tx) => {
            // Update product stock
            await tx.product.update({
                where: { id: productId },
                data: { stock: newStock },
            })

            // Create movement record
            return tx.inventoryMovement.create({
                data: {
                    productId,
                    type,
                    quantity,
                    previousStock,
                    newStock,
                    reason,
                    notes,
                    userId: session.user.id,
                },
                include: {
                    product: {
                        select: { id: true, name: true },
                    },
                    user: {
                        select: { id: true, name: true },
                    },
                },
            })
        })

        return NextResponse.json(movement, { status: 201 })
    } catch (error) {
        console.error("Error creating movement:", error)
        return NextResponse.json(
            { error: "Error al crear movimiento" },
            { status: 500 }
        )
    }
}
