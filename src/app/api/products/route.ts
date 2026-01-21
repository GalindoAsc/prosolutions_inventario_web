import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get("categoryId")
    const modelId = searchParams.get("modelId")
    const brandId = searchParams.get("brandId")
    const search = searchParams.get("search")
    const lowStock = searchParams.get("lowStock") === "true"

    let products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoryId && { categoryId }),
        ...(modelId && {
          OR: [
            { models: { some: { modelId } } },
            { isUniversal: true },
          ],
        }),
        ...(brandId && {
          models: { some: { model: { brandId } } },
        }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        models: {
          include: {
            model: {
              include: { brand: true },
            },
          },
        },
        category: true,
        _count: { select: { reservations: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // Filtrar por lowStock en JS (porque no se puede comparar columnas en Prisma)
    if (lowStock) {
      products = products.filter(p => p.stock <= p.minStock)
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      description,
      barcode,
      retailPrice,
      wholesalePrice,
      stock,
      minStock,
      images,
      isPublic,
      isUniversal,
      categoryId,
      modelIds, // Array de IDs de modelos
    } = body

    if (!name || !retailPrice || !wholesalePrice || !categoryId) {
      return NextResponse.json(
        { error: "Nombre, precios y categoría son requeridos" },
        { status: 400 }
      )
    }

    if (!isUniversal && (!modelIds || modelIds.length === 0)) {
      return NextResponse.json(
        { error: "Selecciona al menos un modelo o marca como universal" },
        { status: 400 }
      )
    }

    // Check if barcode already exists
    if (barcode) {
      const existingProduct = await prisma.product.findUnique({
        where: { barcode },
      })
      if (existingProduct) {
        return NextResponse.json(
          { error: "Ya existe un producto con este código de barras" },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        barcode: barcode || null,
        retailPrice: parseFloat(retailPrice),
        wholesalePrice: parseFloat(wholesalePrice),
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 1,
        images: images || [],
        isPublic: isPublic || false,
        isUniversal: isUniversal || false,
        categoryId,
        models: isUniversal
          ? undefined
          : {
              create: modelIds.map((modelId: string) => ({
                modelId,
              })),
            },
      },
      include: {
        models: {
          include: {
            model: {
              include: { brand: true },
            },
          },
        },
        category: true,
      },
    })

    // Create initial inventory movement
    if (product.stock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: "IN",
          quantity: product.stock,
          previousStock: 0,
          newStock: product.stock,
          reason: "Stock inicial",
          userId: session.user.id,
        },
      })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
  }
}
