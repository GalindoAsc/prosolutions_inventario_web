"use client"

import { useState, useEffect } from "react"
import { Save, RefreshCw, DollarSign, Clock, Percent, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Settings {
  tempReservationMinutes: number
  depositPercentage: number
  depositReservationHours: number
  pendingVerificationHours: number
  exchangeRate: number
}

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<Settings>({
    tempReservationMinutes: 30,
    depositPercentage: 50,
    depositReservationHours: 48,
    pendingVerificationHours: 24,
    exchangeRate: 17.50,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setSaving(false)
    }
  }

  function handleChange(field: keyof Settings, value: string) {
    const numValue = parseFloat(value) || 0
    setSettings((prev) => ({ ...prev, [field]: numValue }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">
            Ajusta los parámetros del sistema
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : saved ? (
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saved ? "Guardado" : "Guardar cambios"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuración de Moneda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Moneda
            </CardTitle>
            <CardDescription>
              Configura el tipo de cambio para mostrar precios en dólares
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exchangeRate">Tipo de cambio (MXN → USD)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$1 USD =</span>
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.01"
                  min="1"
                  value={settings.exchangeRate}
                  onChange={(e) => handleChange("exchangeRate", e.target.value)}
                  className="w-28"
                />
                <span className="text-muted-foreground">MXN</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Los precios se almacenan en MXN y se convierten usando este tipo de cambio
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Reservas Temporales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Reservas Temporales
            </CardTitle>
            <CardDescription>
              Reservas sin pago previo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tempMinutes">Duración de reserva</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tempMinutes"
                  type="number"
                  min="5"
                  value={settings.tempReservationMinutes}
                  onChange={(e) => handleChange("tempReservationMinutes", e.target.value)}
                  className="w-28"
                />
                <span className="text-muted-foreground">minutos</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tiempo que el cliente tiene para pasar a recoger
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Depósito */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Reservas con Depósito
            </CardTitle>
            <CardDescription>
              Reservas que requieren anticipo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="depositPercent">Porcentaje de anticipo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="depositPercent"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.depositPercentage}
                  onChange={(e) => handleChange("depositPercentage", e.target.value)}
                  className="w-28"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositHours">Tiempo para recoger</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="depositHours"
                  type="number"
                  min="1"
                  value={settings.depositReservationHours}
                  onChange={(e) => handleChange("depositReservationHours", e.target.value)}
                  className="w-28"
                />
                <span className="text-muted-foreground">horas</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Después de verificar el depósito
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Verificación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Verificación
            </CardTitle>
            <CardDescription>
              Tiempos para verificar depósitos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verifyHours">Tiempo máximo para verificar</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="verifyHours"
                  type="number"
                  min="1"
                  value={settings.pendingVerificationHours}
                  onChange={(e) => handleChange("pendingVerificationHours", e.target.value)}
                  className="w-28"
                />
                <span className="text-muted-foreground">horas</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Si no se verifica, la reserva expira automáticamente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">${settings.exchangeRate.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">MXN por USD</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{settings.tempReservationMinutes}</p>
              <p className="text-sm text-muted-foreground">min reserva temp.</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{settings.depositPercentage}%</p>
              <p className="text-sm text-muted-foreground">anticipo</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{settings.depositReservationHours}h</p>
              <p className="text-sm text-muted-foreground">para recoger</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{settings.pendingVerificationHours}h</p>
              <p className="text-sm text-muted-foreground">para verificar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
