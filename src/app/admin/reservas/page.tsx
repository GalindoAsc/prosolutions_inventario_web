"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  User,
  DollarSign,
  Image as ImageIcon,
  RefreshCw,
  Eye,
  Timer,
  CreditCard,
  Settings,
  Loader2,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"

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
  adminNotes: string | null
  expiresAt: string
  createdAt: string
  product: {
    id: string
    name: string
    images: string[]
    retailPrice: number
    wholesalePrice: number
  }
  user: {
    id: string
    name: string
    email: string | null
    phone: string | null
    customerType: string
  }
}

interface Settings {
  tempReservationMinutes: number
  depositPercentage: number
  depositReservationHours: number
  pendingVerificationHours: number
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pendiente", variant: "outline" },
  DEPOSIT_VERIFIED: { label: "Depósito Verificado", variant: "default" },
  APPROVED: { label: "Aprobada", variant: "default" },
  REJECTED: { label: "Rechazada", variant: "destructive" },
  COMPLETED: { label: "Completada", variant: "secondary" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
  EXPIRED: { label: "Expirada", variant: "secondary" },
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const [showSettings, setShowSettings] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReservations = useCallback(async () => {
    try {
      const url = filter === "all" ? "/api/reservations" : `/api/reservations?status=${filter}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setReservations(data)
      }
    } catch (error) {
      console.error("Error fetching reservations:", error)
    }
  }, [filter])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchReservations(), fetchSettings()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchReservations])

  const handleAction = async (reservationId: string, action: string, adminNotes?: string) => {
    setActionLoading(reservationId)
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNotes }),
      })

      if (res.ok) {
        await fetchReservations()
        setSelectedReservation(null)
      }
    } catch (error) {
      console.error("Error updating reservation:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const saveSettings = async () => {
    if (!settings) return
    setIsSavingSettings(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setShowSettings(false)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setIsSavingSettings(false)
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
      return `${hours}h ${minutes}m`
    }
    return `${minutes} min`
  }

  const pendingCount = reservations.filter(r => r.status === "PENDING").length
  const depositPendingCount = reservations.filter(r => r.type === "DEPOSIT" && r.status === "PENDING").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6" />
            Reservas
          </h1>
          <p className="text-muted-foreground">
            Gestiona las reservas de productos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchReservations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{reservations.length}</div>
            <p className="text-xs text-muted-foreground">Total Reservas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{depositPendingCount}</div>
            <p className="text-xs text-muted-foreground">Depósitos por verificar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {reservations.filter(r => r.status === "COMPLETED").length}
            </div>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Panel */}
      {showSettings && settings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuración de Reservas</CardTitle>
            <CardDescription>
              Ajusta los tiempos y porcentajes de las reservas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tempMinutes">
                  <Timer className="h-4 w-4 inline mr-1" />
                  Reserva temporal (minutos)
                </Label>
                <Input
                  id="tempMinutes"
                  type="number"
                  value={settings.tempReservationMinutes}
                  onChange={(e) => setSettings({ ...settings, tempReservationMinutes: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositPercent">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Porcentaje de depósito
                </Label>
                <Input
                  id="depositPercent"
                  type="number"
                  value={settings.depositPercentage}
                  onChange={(e) => setSettings({ ...settings, depositPercentage: parseInt(e.target.value) || 50 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositHours">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Horas para recoger
                </Label>
                <Input
                  id="depositHours"
                  type="number"
                  value={settings.depositReservationHours}
                  onChange={(e) => setSettings({ ...settings, depositReservationHours: parseInt(e.target.value) || 48 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pendingHours">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Horas para verificar
                </Label>
                <Input
                  id="pendingHours"
                  type="number"
                  value={settings.pendingVerificationHours}
                  onChange={(e) => setSettings({ ...settings, pendingVerificationHours: parseInt(e.target.value) || 24 })}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={saveSettings} disabled={isSavingSettings}>
                {isSavingSettings && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar Configuración
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "Todas" },
          { value: "PENDING", label: "Pendientes" },
          { value: "DEPOSIT_VERIFIED", label: "Verificadas" },
          { value: "APPROVED", label: "Aprobadas" },
          { value: "COMPLETED", label: "Completadas" },
          { value: "CANCELLED", label: "Canceladas" },
          { value: "EXPIRED", label: "Expiradas" },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Reservations List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reservations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay reservas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reservations.map((reservation) => (
            <Card key={reservation.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Product Info */}
                  <div className="flex gap-4 flex-1">
                    <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium truncate">{reservation.product.name}</h3>
                        <Badge variant={statusLabels[reservation.status]?.variant || "outline"}>
                          {statusLabels[reservation.status]?.label || reservation.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{reservation.user.name}</span>
                        <span>•</span>
                        <span>{reservation.user.email || reservation.user.phone}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
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
                        <span className="text-sm">
                          Total: <strong>{formatPrice(reservation.totalPrice)}</strong>
                        </span>
                        {reservation.depositAmount && (
                          <span className="text-sm text-orange-600">
                            Depósito: <strong>{formatPrice(reservation.depositAmount)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Time & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {["PENDING", "DEPOSIT_VERIFIED", "APPROVED"].includes(reservation.status) && (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4" />
                        <span className={new Date(reservation.expiresAt) < new Date() ? "text-destructive" : ""}>
                          {getTimeRemaining(reservation.expiresAt)}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap justify-end">
                      {reservation.paymentProofUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(reservation.paymentProofUrl!, "_blank")}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Comprobante
                        </Button>
                      )}

                      {reservation.status === "PENDING" && reservation.type === "DEPOSIT" && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(reservation.id, "verify_deposit")}
                          disabled={actionLoading === reservation.id}
                        >
                          {actionLoading === reservation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verificar
                            </>
                          )}
                        </Button>
                      )}

                      {reservation.status === "PENDING" && reservation.type === "TEMPORARY" && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(reservation.id, "approve")}
                          disabled={actionLoading === reservation.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                      )}

                      {["APPROVED", "DEPOSIT_VERIFIED"].includes(reservation.status) && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAction(reservation.id, "complete")}
                          disabled={actionLoading === reservation.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completar
                        </Button>
                      )}

                      {["PENDING", "DEPOSIT_VERIFIED", "APPROVED"].includes(reservation.status) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(reservation.id, "reject")}
                          disabled={actionLoading === reservation.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
