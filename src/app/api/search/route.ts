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
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    // Search in parallel
    const [products, models, variants] = await Promise.all([
      // Search products by name or barcode
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { barcode: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          category: { select: { name: true } },
        },
        take: 5,
      }),
      // Search models by name
      prisma.model.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        include: {
          brand: { select: { name: true } },
        },
        take: 5,
      }),
      // Search by SKU/variant
      prisma.modelVariant.findMany({
        where: {
          sku: { contains: query, mode: "insensitive" },
        },
        include: {
          model: {
            include: {
              brand: { select: { name: true } },
            },
          },
        },
        take: 5,
      }),
    ])

    // Format results
    const results = [
      ...products.map((p) => ({
        type: "product" as const,
        id: p.id,
        name: p.name,
        subtitle: `${p.category.name} - ${p.barcode || "Sin código"}`,
      })),
      ...models.map((m) => ({
        type: "model" as const,
        id: m.id,
        name: `${m.brand.name} ${m.name}`,
        subtitle: "Modelo de celular",
      })),
      ...variants.map((v) => ({
        type: "model" as const,
        id: v.modelId,
        name: `${v.model.brand.name} ${v.model.name}`,
        subtitle: `SKU: ${v.sku}${v.region ? ` (${v.region})` : ""}`,
      })),
    ]

    // Remove duplicates (models found both by name and variant)
    const uniqueResults = results.filter(
      (result, index, self) =>
        index === self.findIndex((r) => r.type === result.type && r.id === result.id)
    )

    return NextResponse.json(uniqueResults.slice(0, 10))
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Error en la búsqueda" }, { status: 500 })
  }
}
