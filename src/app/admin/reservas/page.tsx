"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  User,
  DollarSign,
  RefreshCw,
  Eye,
  Timer,
  CreditCard,
  Settings,
  Loader2,
  QrCode,
  ScanLine,
} from "lucide-react"
import { useCurrency } from "@/components/currency-provider"
import { CountdownTimer } from "@/components/countdown-timer"
import { ReservationQR } from "@/components/reservation-qr"
import { BarcodeScanner } from "@/components/barcode-scanner"

interface Reservation {
  id: string
  qrCode?: string
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
  const { formatPrice } = useCurrency()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const [showSettings, setShowSettings] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [selectedQR, setSelectedQR] = useState<{ qrCode: string; id: string } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null)

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

  const handleScan = async (code: string) => {
    setShowScanner(false)
    setScanResult(null)

    try {
      // Extraer el código QR de la URL si es una URL completa
      const qrCode = code.includes("/verificar/") ? code.split("/verificar/").pop() : code

      const res = await fetch(`/api/reservations/verify?code=${qrCode}`)
      const data = await res.json()

      if (!res.ok) {
        setScanResult({ success: false, message: data.error || "Error al verificar" })
        return
      }

      // Si se puede completar, mostrar opción
      if (data.canComplete) {
        const complete = window.confirm(
          `Reserva de ${data.reservation.user.name}\n` +
          `Producto: ${data.reservation.product.name}\n` +
          `Cantidad: ${data.reservation.quantity}\n\n` +
          `¿Marcar como completada?`
        )

        if (complete) {
          const completeRes = await fetch("/api/reservations/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qrCode }),
          })

          if (completeRes.ok) {
            setScanResult({ success: true, message: "Reserva completada exitosamente" })
            fetchReservations()
          } else {
            const errorData = await completeRes.json()
            setScanResult({ success: false, message: errorData.error })
          }
        }
      } else {
        setScanResult({ success: false, message: data.message })
      }
    } catch (error) {
      setScanResult({ success: false, message: "Error de conexión" })
    }
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
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowScanner(true)}>
            <ScanLine className="h-4 w-4 mr-2" />
            Escanear QR
          </Button>
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

      {/* Scan Result Message */}
      {scanResult && (
        <div className={`p-4 rounded-lg ${scanResult.success ? "bg-green-50 text-green-700 dark:bg-green-950/30" : "bg-red-50 text-red-700 dark:bg-red-950/30"}`}>
          <div className="flex items-center gap-2">
            {scanResult.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <span>{scanResult.message}</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setScanResult(null)}>
              Cerrar
            </Button>
          </div>
        </div>
      )}

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
                  Reserva temporal (min)
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
                  % de depósito
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
                Guardar
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
                  {/* QR Code - Solo para reservas activas */}
                  {reservation.qrCode && ["PENDING", "DEPOSIT_VERIFIED", "APPROVED"].includes(reservation.status) && (
                    <div className="flex-shrink-0 flex justify-center lg:justify-start">
                      <button
                        onClick={() => {
                          setSelectedQR({ qrCode: reservation.qrCode!, id: reservation.id })
                          setShowQRDialog(true)
                        }}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <ReservationQR
                          qrCode={reservation.qrCode}
                          reservationId={reservation.id}
                          size={80}
                          showCode={false}
                        />
                      </button>
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex gap-4 flex-1">
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium truncate">{reservation.product.name}</h3>
                        <Badge variant={statusLabels[reservation.status]?.variant || "outline"}>
                          {statusLabels[reservation.status]?.label || reservation.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="truncate">{reservation.user.name}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline truncate">{reservation.user.email || reservation.user.phone}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {reservation.type === "TEMPORARY" ? (
                            <>
                              <Timer className="h-3 w-3 mr-1" />
                              Temporal
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-3 w-3 mr-1" />
                              Depósito
                            </>
                          )}
                        </Badge>
                        <span className="text-xs">
                          x{reservation.quantity} • <strong>{formatPrice(reservation.totalPrice)}</strong>
                        </span>
                        {reservation.depositAmount && (
                          <span className="text-xs text-orange-600">
                            Dep: {formatPrice(reservation.depositAmount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Time & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {["PENDING", "DEPOSIT_VERIFIED", "APPROVED"].includes(reservation.status) && (
                      <CountdownTimer expiresAt={reservation.expiresAt} compact />
                    )}

                    <div className="flex gap-2 flex-wrap justify-end">
                      {reservation.paymentProofUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(reservation.paymentProofUrl!, "_blank")}
                        >
                          <Eye className="h-4 w-4" />
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
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAction(reservation.id, "complete")}
                          disabled={actionLoading === reservation.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Entregar
                        </Button>
                      )}

                      {["PENDING", "DEPOSIT_VERIFIED", "APPROVED"].includes(reservation.status) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(reservation.id, "reject")}
                          disabled={actionLoading === reservation.id}
                        >
                          <XCircle className="h-4 w-4" />
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

      {/* Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escanear Código QR</DialogTitle>
            <DialogDescription>
              Escanea el código QR de la reserva para verificarla
            </DialogDescription>
          </DialogHeader>
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
          />
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Código QR
            </DialogTitle>
          </DialogHeader>
          {selectedQR && (
            <div className="flex flex-col items-center py-4">
              <ReservationQR
                qrCode={selectedQR.qrCode}
                reservationId={selectedQR.id}
                size={200}
              />
              <p className="text-sm text-muted-foreground mt-4 text-center">
                El cliente puede mostrar este código para recoger su reserva
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
