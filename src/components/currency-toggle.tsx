"use client"

import { useCurrency } from "@/components/currency-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CurrencyToggle({ className }: { className?: string }) {
  const { currency, setCurrency, exchangeRate } = useCurrency()

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant={currency === "MXN" ? "default" : "ghost"}
        size="sm"
        className="h-8 px-2 text-xs font-medium"
        onClick={() => setCurrency("MXN")}
      >
        MXN
      </Button>
      <Button
        variant={currency === "USD" ? "default" : "ghost"}
        size="sm"
        className="h-8 px-2 text-xs font-medium"
        onClick={() => setCurrency("USD")}
        title={`1 USD = $${exchangeRate.toFixed(2)} MXN`}
      >
        USD
      </Button>
    </div>
  )
}

export function CurrencyToggleCompact({ className }: { className?: string }) {
  const { currency, setCurrency, exchangeRate } = useCurrency()

  return (
    <button
      onClick={() => setCurrency(currency === "MXN" ? "USD" : "MXN")}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium",
        "bg-muted hover:bg-muted/80 transition-colors",
        className
      )}
      title={`1 USD = $${exchangeRate.toFixed(2)} MXN`}
    >
      <span className={currency === "MXN" ? "text-primary" : "text-muted-foreground"}>
        🇲🇽
      </span>
      <span className="text-xs">/</span>
      <span className={currency === "USD" ? "text-primary" : "text-muted-foreground"}>
        🇺🇸
      </span>
    </button>
  )
}
