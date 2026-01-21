"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface VerifyActionsProps {
  qrCode: string
  canComplete: boolean
  status: string
  isExpired: boolean
}

export function VerifyActions({
  qrCode,
  canComplete,
  status,
  isExpired,
}: VerifyActionsProps) {
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(status === "COMPLETED")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleComplete = async () => {
    setCompleting(true)
    setError("")

    try {
      const res = await fetch("/api/reservations/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al completar")
        return
      }

      setCompleted(true)
      router.refresh()
    } catch {
      setError("Error de conexión")
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="space-y-3 pt-4 border-t">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm dark:bg-red-950/30">
          {error}
        </div>
      )}

      {completed ? (
        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="font-medium text-green-700 dark:text-green-400">
            Reserva Completada
          </p>
          <p className="text-sm text-green-600 dark:text-green-500">
            El producto ha sido entregado exitosamente
          </p>
        </div>
      ) : canComplete ? (
        <Button
          onClick={handleComplete}
          disabled={completing}
          className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
        >
          {completing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Completando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Completar Entrega
            </>
          )}
        </Button>
      ) : isExpired ? (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-center text-sm text-red-600 dark:text-red-400">
          Esta reserva ha expirado y no puede ser completada
        </div>
      ) : (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg text-center text-sm text-yellow-600 dark:text-yellow-400">
          Esta reserva aún no está lista para entrega.
          Estado actual: {status}
        </div>
      )}

      <Button variant="outline" className="w-full" asChild>
        <Link href="/admin/reservas">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Reservas
        </Link>
      </Button>
    </div>
  )
}
