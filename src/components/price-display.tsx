"use client"

import { useCurrency } from "@/components/currency-provider"
import { cn } from "@/lib/utils"

interface PriceDisplayProps {
  price: number
  className?: string
  showOriginal?: boolean // Mostrar precio original en MXN si está en USD
}

export function PriceDisplay({ price, className, showOriginal = false }: PriceDisplayProps) {
  const { formatPrice, currency } = useCurrency()

  return (
    <span className={cn("", className)}>
      {formatPrice(price)}
      {showOriginal && currency === "USD" && (
        <span className="text-xs text-muted-foreground ml-1">
          ({new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
          }).format(price)})
        </span>
      )}
    </span>
  )
}

// Para usar en server components, pasar el formatPrice como prop
interface PriceDisplayServerProps {
  price: number
  className?: string
}

export function PriceDisplayStatic({ price, className }: PriceDisplayServerProps) {
  // Esta versión siempre muestra en MXN (para server components)
  const formatted = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price)

  return <span className={className}>{formatted}</span>
}
