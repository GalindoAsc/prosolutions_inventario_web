"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Loader2,
  Search,
  Package,
  ScanBarcode,
  AlertTriangle,
  Eye,
  EyeOff,
  Globe,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface ProductModel {
  model: {
    id: string
    name: string
    brand: { name: string }
  }
}

interface Product {
  id: string
  name: string
  barcode: string | null
  retailPrice: number
  wholesalePrice: number
  stock: number
  minStock: number
  images: string[]
  isPublic: boolean
  isUniversal: boolean
  models: ProductModel[]
  category: { name: string }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "low-stock" | "public">("all")

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (filter === "low-stock") params.append("lowStock", "true")

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [filter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts()
  }

  const filteredProducts = filter === "public"
    ? products.filter((p) => p.isPublic)
    : products

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Productos</h2>
          <p className="text-muted-foreground">
            Gestiona las refacciones del inventario
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/productos/escanear">
              <ScanBarcode className="mr-2 h-4 w-4" />
              Escanear
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/productos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Todos
          </Button>
          <Button
            variant={filter === "low-stock" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("low-stock")}
          >
            <AlertTriangle className="mr-1 h-4 w-4" />
            Stock bajo
          </Button>
          <Button
            variant={filter === "public" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("public")}
          >
            <Eye className="mr-1 h-4 w-4" />
            Públicos
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/admin/productos/${product.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="aspect-square relative bg-muted">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}

                  {/* Status badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isUniversal && (
                      <Badge variant="secondary">
                        <Globe className="mr-1 h-3 w-3" />
                        Universal
                      </Badge>
                    )}
                    {product.isPublic ? (
                      <Badge variant="outline" className="bg-background">
                        <Eye className="mr-1 h-3 w-3" />
                        Público
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-background">
                        <EyeOff className="mr-1 h-3 w-3" />
                        Privado
                      </Badge>
                    )}
                  </div>

                  {/* Stock badge */}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={
                        product.stock === 0
                          ? "destructive"
                          : product.stock <= product.minStock
                          ? "warning"
                          : "success"
                      }
                    >
                      {product.stock} uds
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    {product.isUniversal
                      ? "Universal"
                      : product.models
                          .map((pm) => `${pm.model.brand.name} ${pm.model.name}`)
                          .join(", ")}
                  </div>
                  <h3 className="font-medium line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                  <Badge variant="outline" className="mb-3">
                    {product.category.name}
                  </Badge>

                  {product.barcode && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Código: {product.barcode}
                    </p>
                  )}

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-muted-foreground">Menudeo</p>
                      <p className="font-bold text-primary">
                        {formatPrice(product.retailPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Mayoreo</p>
                      <p className="font-semibold text-secondary">
                        {formatPrice(product.wholesalePrice)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>No se encontraron productos</p>
          <Button className="mt-4" asChild>
            <Link href="/admin/productos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Agregar primer producto
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
