"use client"

import { useState } from "react"
import { useCart } from "@/components/cart-context"
import { useCurrency } from "@/components/currency-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, ShoppingCart, ArrowLeft, Upload, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImageUpload } from "@/components/image-upload"

export default function CartPage() {
    const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart()
    const { formatPrice } = useCurrency()
    const router = useRouter()

    const [reservationType, setReservationType] = useState<"TEMPORARY" | "DEPOSIT">("TEMPORARY")
    const [proofImages, setProofImages] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const handleCheckout = async () => {
        if (items.length === 0) return
        if (reservationType === "DEPOSIT" && proofImages.length === 0) {
            alert("Por favor sube el comprobante de pago para reservas con depósito")
            return
        }

        setLoading(true)
        try {
            // Process items sequentially
            for (const item of items) {
                const body = {
                    productId: item.productId,
                    quantity: item.quantity,
                    type: reservationType,
                    paymentProofUrl: reservationType === "DEPOSIT" ? proofImages[0] : undefined
                }

                const res = await fetch("/api/reservations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                })

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(`Error reservando ${item.name}: ${data.error}`)
                }
            }

            clearCart()
            alert("Reserva exitosa! Redirigiendo a tus reservas...")
            router.push("/mis-reservas")
        } catch (error: any) {
            console.error("Checkout error:", error)
            alert(error.message || "Error al procesar reserva")
        } finally {
            setLoading(false)
        }
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-muted p-6 rounded-full mb-4">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Tu carrito está vacío</h1>
                <p className="text-muted-foreground mb-8">Agrega productos del catálogo para reservar.</p>
                <Button asChild>
                    <Link href="/catalogo">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Ir al Catálogo
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/40 pb-24">
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur px-4 h-14 flex items-center">
                <h1 className="font-bold text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Carrito de Compras
                </h1>
            </header>

            <main className="container max-w-lg mx-auto p-4 space-y-6">
                {/* Items List */}
                <div className="space-y-4">
                    {items.map((item) => (
                        <Card key={item.productId} className="overflow-hidden">
                            <CardContent className="p-3 flex gap-3">
                                <div className="h-20 w-20 bg-muted rounded-md relative flex-shrink-0 overflow-hidden">
                                    {item.image ? (
                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                                        <p className="text-primary font-bold">{formatPrice(item.price)}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2 border rounded-md">
                                            <button
                                                className="px-2 py-1 hover:bg-muted"
                                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                            >-</button>
                                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                            <button
                                                className="px-2 py-1 hover:bg-muted"
                                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                            >+</button>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => removeItem(item.productId)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Reservation Type & Checkout */}
                <Card className="border-primary/20 shadow-md">
                    <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold">Tipo de Reserva</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div
                                className={`border rounded-lg p-3 cursor-pointer transition-colors ${reservationType === "TEMPORARY" ? "bg-primary/5 border-primary ring-1 ring-primary" : "hover:bg-muted/50"}`}
                                onClick={() => setReservationType("TEMPORARY")}
                            >
                                <div className="font-medium text-sm">Temporal</div>
                                <div className="text-xs text-muted-foreground mt-1">Expira en 30 min</div>
                                <div className="text-xs text-muted-foreground">Sin pago previo</div>
                            </div>
                            <div
                                className={`border rounded-lg p-3 cursor-pointer transition-colors ${reservationType === "DEPOSIT" ? "bg-primary/5 border-primary ring-1 ring-primary" : "hover:bg-muted/50"}`}
                                onClick={() => setReservationType("DEPOSIT")}
                            >
                                <div className="font-medium text-sm">Con Depósito</div>
                                <div className="text-xs text-muted-foreground mt-1">Expira en 24h</div>
                                <div className="text-xs text-muted-foreground">Requiere comprobante</div>
                            </div>
                        </div>

                        {reservationType === "DEPOSIT" && (
                            <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    Subir Comprobante
                                </label>
                                <ImageUpload
                                    images={proofImages}
                                    onChange={setProofImages}
                                    maxImages={1}
                                    className="w-full"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Sube una foto o captura de tu transferencia.
                                </p>
                            </div>
                        )}

                        <div className="pt-4 border-t flex items-center justify-between">
                            <span className="font-medium">Total Estimado</span>
                            <span className="text-xl font-bold text-primary">{formatPrice(totalPrice)}</span>
                        </div>

                        <Button className="w-full h-12 text-lg" onClick={handleCheckout} disabled={loading}>
                            {loading ? "Procesando..." : (
                                <>
                                    <CheckCircle2 className="mr-2 h-5 w-5" />
                                    Confirmar Reserva
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
