import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const users = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        ...(status && { status: status as "PENDING" | "APPROVED" | "REJECTED" }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        customerType: true,
        status: true,
        createdAt: true,
        _count: { select: { reservations: true } },
      },
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}
