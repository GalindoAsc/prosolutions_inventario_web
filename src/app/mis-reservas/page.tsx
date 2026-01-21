"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  CalendarCheck,
  Clock,
  Package,
  ArrowLeft,
  Timer,
  CreditCard,
  XCircle,
  Loader2,
  Home,
  ShoppingCart,
  User,
  LogOut,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { signOut, useSession } from "next-auth/react"

interface Reservation {
  id: string
  quantity: number
  totalPrice: number
  depositAmount: number | null
  depositPaid: boolean
  type: "TEMPORARY" | "DEPOSIT"
  status: string
  paymentProofUrl: string | null
  paymentMethod: string | null
  expiresAt: string
  createdAt: string
  product: {
    id: string
    name: string
    images: string[]
    category: {
      name: string
    }
  }
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; description: string }> = {
  PENDING: { 
    label: "Pendiente", 
    variant: "outline",
    description: "Esperando verificación del depósito"
  },
  DEPOSIT_VERIFIED: { 
    label: "Depósito Verificado", 
    variant: "default",
    description: "Tu depósito ha sido verificado, puedes pasar a recoger"
  },
  APPROVED: { 
    label: "Lista para recoger", 
    variant: "default",
    description: "Tu reserva está lista, pasa a recogerla"
  },
  REJECTED: { 
    label: "Rechazada", 
    variant: "destructive",
    description: "Tu reserva fue rechazada"
  },
  COMPLETED: { 
    label: "Entregada", 
    variant: "secondary",
    description: "Producto entregado exitosamente"
  },
  CANCELLED: { 
    label: "Cancelada", 
    variant: "destructive",
    description: "Esta reserva fue cancelada"
  },
  EXPIRED: { 
    label: "Expirada", 
    variant: "secondary",
    description: "La reserva expiró"
  },
}

export default function MisReservasPage() {
  const sessionData = useSession()
  const session = sessionData?.data
  const status = sessionData?.status
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await fetch("/api/reservations")
        if (res.ok) {
          const data = await res.json()
          setReservations(data)
        }
      } catch (error) {
        console.error("Error fetching reservations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchReservations()
    }
  }, [session])

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      })

      if (res.ok) {
        setReservations(prev => 
          prev.map(r => r.id === id ? { ...r, status: "CANCELLED" } : r)
        )
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error)
    } finally {
      setCancellingId(null)
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()

    if (diff <= 0) return "Expirada"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`
    }
    return `${minutes} min restantes`
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const activeReservations = reservations.filter(r => 
    ["PENDING", "DEPOSIT_VERIFIED", "APPROVED"].includes(r.status)
  )
  const pastReservations = reservations.filter(r => 
    ["COMPLETED", "CANCELLED", "EXPIRED", "REJECTED"].includes(r.status)
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.jpg"
              alt="Pro-Solutions"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="font-bold text-lg hidden sm:inline">Pro-Solutions</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/catalogo">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Catálogo
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/perfil">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Perfil</span>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6" />
            Mis Reservas
          </h1>
          <p className="text-muted-foreground">
            Revisa el estado de tus reservas
          </p>
        </div>

        {reservations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CalendarCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tienes reservas</h3>
              <p className="text-muted-foreground mb-4">
                Cuando reserves un producto, aparecerá aquí
              </p>
              <Button asChild>
                <Link href="/catalogo">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ver Catálogo
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Active Reservations */}
            {activeReservations.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Reservas Activas ({activeReservations.length})
                </h2>
                <div className="space-y-4">
                  {activeReservations.map((reservation) => (
                    <Card key={reservation.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            {reservation.product.images[0] ? (
                              <img
                                src={reservation.product.images[0]}
                                alt={reservation.product.name}
                                className="h-full w-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <h3 className="font-medium">{reservation.product.name}</h3>
                              <Badge variant={statusLabels[reservation.status]?.variant || "outline"}>
                                {statusLabels[reservation.status]?.label || reservation.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {statusLabels[reservation.status]?.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                              <Badge variant="outline">
                                {reservation.type === "TEMPORARY" ? (
                                  <>
                                    <Timer className="h-3 w-3 mr-1" />
                                    Temporal
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Con Depósito
                                  </>
                                )}
                              </Badge>
                              <span className="text-sm">
                                Cantidad: <strong>{reservation.quantity}</strong>
                              </span>
                              <span className="text-sm font-medium text-primary">
                                {formatPrice(reservation.totalPrice)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {getTimeRemaining(reservation.expiresAt)}
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancel(reservation.id)}
                                disabled={cancellingId === reservation.id}
                              >
                                {cancellingId === reservation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancelar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Past Reservations */}
            {pastReservations.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                  Historial ({pastReservations.length})
                </h2>
                <div className="space-y-4">
                  {pastReservations.map((reservation) => (
                    <Card key={reservation.id} className="overflow-hidden opacity-75">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            {reservation.product.images[0] ? (
                              <img
                                src={reservation.product.images[0]}
                                alt={reservation.product.name}
                                className="h-full w-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium text-sm">{reservation.product.name}</h3>
                              <Badge variant={statusLabels[reservation.status]?.variant || "outline"} className="text-xs">
                                {statusLabels[reservation.status]?.label || reservation.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>Cantidad: {reservation.quantity}</span>
                              <span>{formatPrice(reservation.totalPrice)}</span>
                              <span>
                                {new Date(reservation.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
