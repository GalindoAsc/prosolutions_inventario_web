import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandId = searchParams.get("brandId")

    const models = await prisma.model.findMany({
      where: brandId ? { brandId } : undefined,
      include: {
        brand: { select: { name: true } },
        _count: { select: { products: true } },
      },
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
    })
    return NextResponse.json(models)
  } catch (error) {
    console.error("Error fetching models:", error)
    return NextResponse.json({ error: "Error al obtener modelos" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { name, brandId } = await req.json()

    if (!name || !brandId) {
      return NextResponse.json({ error: "Nombre y marca son requeridos" }, { status: 400 })
    }

    const slug = generateSlug(name)

    const existingModel = await prisma.model.findFirst({
      where: { brandId, slug },
    })

    if (existingModel) {
      return NextResponse.json({ error: "Este modelo ya existe para esta marca" }, { status: 400 })
    }

    const model = await prisma.model.create({
      data: { name, slug, brandId },
      include: { brand: { select: { name: true } } },
    })

    return NextResponse.json(model)
  } catch (error) {
    console.error("Error creating model:", error)
    return NextResponse.json({ error: "Error al crear modelo" }, { status: 500 })
  }
}
