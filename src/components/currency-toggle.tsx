"use client"

import { useCurrency } from "@/components/currency-provider"
import { cn } from "@/lib/utils"

export function CurrencyToggle({ className }: { className?: string }) {
  const { currency, setCurrency, exchangeRate } = useCurrency()

  return (
    <div
      className={cn("flex items-center", className)}
      title={`Tipo de cambio: 1 USD = $${exchangeRate.toFixed(2)} MXN`}
    >
      <button
        onClick={() => setCurrency("MXN")}
        className={cn(
          "px-3 py-1.5 text-sm font-medium rounded-l-md border transition-colors",
          currency === "MXN"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-muted-foreground border-input hover:bg-accent"
        )}
      >
        $MXN
      </button>
      <button
        onClick={() => setCurrency("USD")}
        className={cn(
          "px-3 py-1.5 text-sm font-medium rounded-r-md border-y border-r transition-colors",
          currency === "USD"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-muted-foreground border-input hover:bg-accent"
        )}
      >
        $USD
      </button>
    </div>
  )
}

export function CurrencyToggleCompact({ className }: { className?: string }) {
  const { currency, setCurrency, exchangeRate } = useCurrency()

  return (
    <button
      type="button"
      onClick={() => setCurrency(currency === "MXN" ? "USD" : "MXN")}
      className={cn(
        "relative flex items-center h-8 w-16 rounded-full p-1 transition-colors cursor-pointer hover:opacity-90 active:scale-95",
        currency === "MXN" ? "bg-green-600" : "bg-blue-600",
        className
      )}
      title={`Click para cambiar. 1 USD = $${exchangeRate.toFixed(2)} MXN`}
    >
      {/* Slider ball */}
      <span
        className={cn(
          "absolute h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center text-xs transition-transform",
          currency === "MXN" ? "translate-x-0" : "translate-x-8"
        )}
      >
        {currency === "MXN" ? "🇲🇽" : "🇺🇸"}
      </span>
      {/* Labels */}
      <span className={cn(
        "absolute left-2 text-[10px] font-bold text-white/90 user-select-none",
        currency === "MXN" ? "opacity-0" : "opacity-100"
      )}>
        MX
      </span>
      <span className={cn(
        "absolute right-2 text-[10px] font-bold text-white/90 user-select-none",
        currency === "USD" ? "opacity-0" : "opacity-100"
      )}>
        US
      </span>
    </button>
  )
}
