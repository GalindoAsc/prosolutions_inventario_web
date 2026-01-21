"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Search,
    Package,
    RefreshCw,
    Plus,
    Minus,
    ScanBarcode,
    Loader2,
    History,
} from "lucide-react"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { cn } from "@/lib/utils"

interface Movement {
    id: string
    type: string
    quantity: number
    previousStock: number
    newStock: number
    reason: string | null
    notes: string | null
    createdAt: string
    product: {
        id: string
        name: string
        barcode: string | null
    }
    user: {
        id: string
        name: string
    } | null
}

interface Product {
    id: string
    name: string
    barcode: string | null
    stock: number
}

const movementTypes = [
    { value: "IN", label: "Entrada", icon: ArrowDownCircle, color: "text-green-600" },
    { value: "OUT", label: "Salida", icon: ArrowUpCircle, color: "text-red-600" },
    { value: "SALE", label: "Venta", icon: ArrowUpCircle, color: "text-blue-600" },
    { value: "RETURN", label: "Devolución", icon: ArrowDownCircle, color: "text-yellow-600" },
    { value: "ADJUSTMENT_IN", label: "Ajuste +", icon: Plus, color: "text-green-600" },
    { value: "ADJUSTMENT_OUT", label: "Ajuste -", icon: Minus, color: "text-red-600" },
    { value: "DAMAGED", label: "Dañado", icon: ArrowUpCircle, color: "text-orange-600" },
    { value: "LOST", label: "Perdido", icon: ArrowUpCircle, color: "text-gray-600" },
]

function getMovementInfo(type: string) {
    return movementTypes.find((t) => t.value === type) || movementTypes[0]
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export default function InventarioPage() {
    const [movements, setMovements] = useState<Movement[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState<string>("all")
    const [showScanner, setShowScanner] = useState(false)
    const [showNewMovement, setShowNewMovement] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [newMovement, setNewMovement] = useState({
        type: "IN",
        quantity: 1,
        reason: "",
        notes: "",
    })
    const [saving, setSaving] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [searchProducts, setSearchProducts] = useState("")

    const fetchMovements = useCallback(async () => {
        try {
            const params = new URLSearchParams()
            if (filterType !== "all") params.set("type", filterType)

            const res = await fetch(`/api/inventory?${params}`)
            const data = await res.json()
            setMovements(data.movements || [])
        } catch (error) {
            console.error("Error fetching movements:", error)
        } finally {
            setLoading(false)
        }
    }, [filterType])

    const searchProductsApi = useCallback(async (query: string) => {
        if (query.length < 2) {
            setProducts([])
            return
        }
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
            const data = await res.json()
            setProducts(data.products || [])
        } catch (error) {
            console.error("Error searching products:", error)
        }
    }, [])

    useEffect(() => {
        fetchMovements()
    }, [fetchMovements])

    useEffect(() => {
        const debounce = setTimeout(() => {
            searchProductsApi(searchProducts)
        }, 300)
        return () => clearTimeout(debounce)
    }, [searchProducts, searchProductsApi])

    const handleScan = async (code: string) => {
        setShowScanner(false)
        // Search for product by barcode
        const res = await fetch(`/api/search?q=${encodeURIComponent(code)}`)
        const data = await res.json()
        if (data.products && data.products.length > 0) {
            setSelectedProduct(data.products[0])
            setShowNewMovement(true)
        } else {
            alert("Producto no encontrado con código: " + code)
        }
    }

    const handleCreateMovement = async () => {
        if (!selectedProduct) return

        setSaving(true)
        try {
            const res = await fetch("/api/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    type: newMovement.type,
                    quantity: newMovement.quantity,
                    reason: newMovement.reason || null,
                    notes: newMovement.notes || null,
                }),
            })

            if (!res.ok) {
                const error = await res.json()
                alert(error.error || "Error al crear movimiento")
                return
            }

            setShowNewMovement(false)
            setSelectedProduct(null)
            setNewMovement({ type: "IN", quantity: 1, reason: "", notes: "" })
            fetchMovements()
        } catch (error) {
            console.error("Error creating movement:", error)
            alert("Error al crear movimiento")
        } finally {
            setSaving(false)
        }
    }

    const filteredMovements = movements.filter((m) =>
        m.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.product.barcode?.includes(searchQuery)
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Inventario</h1>
                    <p className="text-muted-foreground">
                        Movimientos de stock y ajustes de inventario
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowScanner(true)} variant="outline">
                        <ScanBarcode className="h-4 w-4 mr-2" />
                        Escanear
                    </Button>
                    <Button onClick={() => setShowNewMovement(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Movimiento
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por producto..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Tipo de movimiento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los tipos</SelectItem>
                                {movementTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={fetchMovements}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Movements List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Historial de Movimientos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredMovements.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay movimientos registrados</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredMovements.map((movement) => {
                                const typeInfo = getMovementInfo(movement.type)
                                const Icon = typeInfo.icon
                                const isIncrease = ["IN", "ADJUSTMENT_IN", "RETURN"].includes(movement.type)

                                return (
                                    <div
                                        key={movement.id}
                                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50"
                                    >
                                        <div className={cn("p-2 rounded-full bg-muted", typeInfo.color)}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{movement.product.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {movement.reason || typeInfo.label}
                                                {movement.user && ` • ${movement.user.name}`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn("font-bold", isIncrease ? "text-green-600" : "text-red-600")}>
                                                {isIncrease ? "+" : "-"}{movement.quantity}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {movement.previousStock} → {movement.newStock}
                                            </p>
                                        </div>
                                        <div className="hidden sm:block text-right text-sm text-muted-foreground">
                                            {formatDate(movement.createdAt)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Scanner Dialog */}
            <Dialog open={showScanner} onOpenChange={setShowScanner}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Escanear Producto</DialogTitle>
                    </DialogHeader>
                    <BarcodeScanner
                        onScan={handleScan}
                        onClose={() => setShowScanner(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* New Movement Dialog */}
            <Dialog open={showNewMovement} onOpenChange={setShowNewMovement}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nuevo Movimiento de Inventario</DialogTitle>
                        <DialogDescription>
                            Registra entrada, salida o ajuste de stock
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {!selectedProduct ? (
                            <div className="space-y-2">
                                <Label>Buscar Producto</Label>
                                <Input
                                    placeholder="Nombre o código de barras..."
                                    value={searchProducts}
                                    onChange={(e) => setSearchProducts(e.target.value)}
                                />
                                {products.length > 0 && (
                                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                                        {products.map((product) => (
                                            <button
                                                key={product.id}
                                                className="w-full text-left p-3 hover:bg-muted border-b last:border-0"
                                                onClick={() => setSelectedProduct(product)}
                                            >
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Stock: {product.stock}
                                                    {product.barcode && ` • ${product.barcode}`}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="p-3 bg-muted rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{selectedProduct.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Stock actual: {selectedProduct.stock}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedProduct(null)}
                                        >
                                            Cambiar
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tipo de Movimiento</Label>
                                    <Select
                                        value={newMovement.type}
                                        onValueChange={(value) =>
                                            setNewMovement({ ...newMovement, type: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {movementTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Cantidad</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={newMovement.quantity}
                                        onChange={(e) =>
                                            setNewMovement({
                                                ...newMovement,
                                                quantity: parseInt(e.target.value) || 1,
                                            })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Razón (opcional)</Label>
                                    <Input
                                        placeholder="Ej: Compra a proveedor"
                                        value={newMovement.reason}
                                        onChange={(e) =>
                                            setNewMovement({ ...newMovement, reason: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Notas (opcional)</Label>
                                    <Textarea
                                        placeholder="Notas adicionales..."
                                        value={newMovement.notes}
                                        onChange={(e) =>
                                            setNewMovement({ ...newMovement, notes: e.target.value })
                                        }
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowNewMovement(false)
                                setSelectedProduct(null)
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateMovement}
                            disabled={!selectedProduct || saving}
                        >
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
