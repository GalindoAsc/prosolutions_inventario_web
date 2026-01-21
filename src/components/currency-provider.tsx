"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type Currency = "MXN" | "USD"

interface CurrencyContextType {
  currency: Currency
  exchangeRate: number
  setCurrency: (currency: Currency) => void
  setExchangeRate: (rate: number) => void
  formatPrice: (priceInMXN: number) => string
  convertPrice: (priceInMXN: number) => number
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("MXN")
  const [exchangeRate, setExchangeRateState] = useState<number>(17.50)

  // Cargar preferencia de localStorage
  useEffect(() => {
    const saved = localStorage.getItem("preferred-currency")
    if (saved === "MXN" || saved === "USD") {
      setCurrencyState(saved)
    }

    // Obtener tipo de cambio del servidor
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.exchangeRate) {
          setExchangeRateState(data.exchangeRate)
        }
      })
      .catch(console.error)
  }, [])

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency)
    localStorage.setItem("preferred-currency", newCurrency)
  }

  const setExchangeRate = (rate: number) => {
    setExchangeRateState(rate)
  }

  const convertPrice = (priceInMXN: number): number => {
    if (currency === "USD") {
      return priceInMXN / exchangeRate
    }
    return priceInMXN
  }

  const formatPrice = (priceInMXN: number): string => {
    const convertedPrice = convertPrice(priceInMXN)
    
    if (currency === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(convertedPrice)
    }
    
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(convertedPrice)
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        exchangeRate,
        setCurrency,
        setExchangeRate,
        formatPrice,
        convertPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
