import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: { select: { models: true } },
      },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(brands)
  } catch (error) {
    console.error("Error fetching brands:", error)
    return NextResponse.json({ error: "Error al obtener marcas" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { name, logo } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const slug = generateSlug(name)

    const existingBrand = await prisma.brand.findFirst({
      where: { OR: [{ name }, { slug }] },
    })

    if (existingBrand) {
      return NextResponse.json({ error: "Esta marca ya existe" }, { status: 400 })
    }

    const brand = await prisma.brand.create({
      data: { name, slug, logo },
    })

    return NextResponse.json(brand)
  } catch (error) {
    console.error("Error creating brand:", error)
    return NextResponse.json({ error: "Error al crear marca" }, { status: 500 })
  }
}
