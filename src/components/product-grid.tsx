"use client"

import Image from "next/image"
import { Smartphone, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCurrency } from "@/components/currency-provider"

interface Product {
  id: string
  name: string
  images: string[]
  stock: number
  minStock: number
  hidePrice: boolean
  retailPrice: number
  wholesalePrice: number
  models: Array<{
    model: {
      name: string
      brand: {
        name: string
      }
    }
  }>
  category: {
    name: string
  }
}

interface ProductGridProps {
  products: Product[]
  isLoggedIn: boolean
  isApproved: boolean
  customerType?: string
}

export function ProductGrid({ products, isLoggedIn, isApproved, customerType }: ProductGridProps) {
  const { formatPrice } = useCurrency()

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Smartphone className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p>Próximamente más productos</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden group">
          <div className="aspect-square relative bg-muted">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Smartphone className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            {product.stock <= product.minStock && product.stock > 0 && (
              <Badge variant="destructive" className="absolute top-2 right-2">
                Últimas piezas
              </Badge>
            )}
            {product.stock === 0 && (
              <Badge variant="secondary" className="absolute top-2 right-2">
                Agotado
              </Badge>
            )}
          </div>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              {product.models[0]?.model?.brand?.name} {product.models[0]?.model?.name}
            </div>
            <h3 className="font-medium line-clamp-2 mb-2">
              {product.name}
            </h3>
            <Badge variant="outline" className="mb-3">
              {product.category.name}
            </Badge>

            {/* Mostrar precio según hidePrice y sesión */}
            {product.hidePrice ? (
              // Producto con precio oculto - requiere login
              isLoggedIn && isApproved ? (
                <div className="text-lg font-bold text-primary">
                  {formatPrice(
                    customerType === "WHOLESALE"
                      ? product.wholesalePrice
                      : product.retailPrice
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm">Precio con cuenta</span>
                </div>
              )
            ) : (
              // Producto con precio visible - mostrar precio menudeo
              <div className="text-lg font-bold text-primary">
                {formatPrice(
                  isLoggedIn && isApproved && customerType === "WHOLESALE"
                    ? product.wholesalePrice
                    : product.retailPrice
                )}
                {isLoggedIn && isApproved && customerType === "WHOLESALE" && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    (mayoreo)
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
