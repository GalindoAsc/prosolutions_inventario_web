"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  X,
  Home,
  ShoppingCart,
  User,
  CalendarCheck,
  ChevronDown,
  Package,
  Smartphone,
  SlidersHorizontal,
} from "lucide-react"
import { useCart } from "@/components/cart-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { CurrencyToggleCompact } from "@/components/currency-toggle"
import { useCurrency } from "@/components/currency-provider"
import { cn } from "@/lib/utils"

interface Brand {
  id: string
  name: string
  _count: { models: number }
}

interface Model {
  id: string
  name: string
  brandId: string
  brand: { name: string }
}

interface Category {
  id: string
  name: string
  _count: { products: number }
}

interface Product {
  id: string
  name: string
  images: string[]
  stock: number
  minStock: number
  hidePrice: boolean
  retailPrice: number
  wholesalePrice: number
  isPublic: boolean
  models: Array<{
    model: {
      name: string
      brand: { name: string }
    }
  }>
  category: { name: string }
}

export default function CatalogoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { formatPrice } = useCurrency()

  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const isLoggedIn = !!session
  const isApproved = session?.user?.status === "APPROVED"
  const customerType = session?.user?.customerType

  // Redirect if not logged in or not approved
  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
    } else if (session.user?.status !== "APPROVED") {
      router.push("/pending")
    }
  }, [session, status, router])

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          fetch("/api/brands"),
          fetch("/api/categories"),
        ])

        const brandsData = await brandsRes.json()
        const categoriesData = await categoriesRes.json()

        setBrands(brandsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()
  }, [])

  // Load models when brand changes
  useEffect(() => {
    const loadModels = async () => {
      if (!selectedBrand) {
        setModels([])
        setSelectedModel(null)
        return
      }

      try {
        const res = await fetch(`/api/models?brandId=${selectedBrand}`)
        const data = await res.json()
        setModels(data)
      } catch (error) {
        console.error("Error loading models:", error)
      }
    }

    loadModels()
  }, [selectedBrand])

  // Load products when filters change
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (search) params.set("search", search)
        if (selectedBrand) params.set("brandId", selectedBrand)
        if (selectedModel) params.set("modelId", selectedModel)
        if (selectedCategory) params.set("categoryId", selectedCategory)

        const res = await fetch(`/api/products?${params.toString()}`)
        const data = await res.json()

        // Filter only public products for non-admin
        const filteredProducts = session?.user?.role === "ADMIN"
          ? data
          : data.filter((p: Product) => p.isPublic)

        setProducts(filteredProducts)
      } catch (error) {
        console.error("Error loading products:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(loadProducts, 300)
    return () => clearTimeout(debounce)
  }, [search, selectedBrand, selectedModel, selectedCategory, session])

  const clearFilters = () => {
    setSearch("")
    setSelectedBrand(null)
    setSelectedModel(null)
    setSelectedCategory(null)
  }

  const hasActiveFilters = search || selectedBrand || selectedModel || selectedCategory

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="text-sm font-medium mb-2 block">Buscar</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nombre, codigo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="text-sm font-medium mb-2 block">Categoria</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            >
              {cat.name}
              {cat._count.products > 0 && (
                <span className="ml-1 text-xs opacity-70">({cat._count.products})</span>
              )}
            </Badge>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <label className="text-sm font-medium mb-2 block">Marca</label>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => (
            <Badge
              key={brand.id}
              variant={selectedBrand === brand.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                setSelectedBrand(selectedBrand === brand.id ? null : brand.id)
                setSelectedModel(null)
              }}
            >
              {brand.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Models (only show if brand selected) */}
      {selectedBrand && models.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">Modelo</label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {models.map((model) => (
              <Badge
                key={model.id}
                variant={selectedModel === model.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedModel(selectedModel === model.id ? null : model.id)}
              >
                {model.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Limpiar Filtros
        </Button>
      )}
    </div>
  )

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Cart integration
  const { addItem } = useCart()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [reservationOpen, setReservationOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const handleAddToCartClick = (product: Product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setReservationOpen(true)
  }

  const handleConfirmAddToCart = () => {
    if (!selectedProduct) return

    const price = customerType === "WHOLESALE"
      ? selectedProduct.wholesalePrice
      : selectedProduct.retailPrice

    addItem({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: price,
      quantity: quantity,
      image: selectedProduct.images[0],
      maxStock: selectedProduct.stock
    })

    setReservationOpen(false)
    // Optional: Toast notification
    alert("Producto agregado al carrito")
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Reservation Dialog */}
      <Dialog open={reservationOpen} onOpenChange={setReservationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservar Producto</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Precio Unitario:</span>
              <span className="font-bold text-primary">
                {selectedProduct && formatPrice(
                  customerType === "WHOLESALE"
                    ? selectedProduct.wholesalePrice
                    : selectedProduct.retailPrice
                )}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad</label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(selectedProduct?.stock || 1, quantity + 1))}
                  disabled={quantity >= (selectedProduct?.stock || 1)}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                Disponibles: {selectedProduct?.stock}
              </p>
            </div>

            <div className="pt-2 border-t flex justify-between items-end">
              <span className="text-sm font-medium">Subtotal:</span>
              <span className="text-xl font-bold text-primary">
                {selectedProduct && formatPrice(
                  (customerType === "WHOLESALE"
                    ? selectedProduct.wholesalePrice
                    : selectedProduct.retailPrice) * quantity
                )}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReservationOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAddToCart}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Agregar al Carrito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl flex h-14 items-center justify-between px-4 gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo.jpg"
              alt="Pro-Solutions"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-bold hidden sm:inline">Pro-Solutions</span>
          </Link>

          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <CurrencyToggleCompact />
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
              <Link href="/mis-reservas">
                <CalendarCheck className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/perfil">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl px-4 py-4">
        {/* Mobile search + filter button */}
        <div className="md:hidden flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-4 overflow-y-auto">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Filtros:</span>
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {categories.find(c => c.id === selectedCategory)?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory(null)} />
              </Badge>
            )}
            {selectedBrand && (
              <Badge variant="secondary" className="gap-1">
                {brands.find(b => b.id === selectedBrand)?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => { setSelectedBrand(null); setSelectedModel(null); }} />
              </Badge>
            )}
            {selectedModel && (
              <Badge variant="secondary" className="gap-1">
                {models.find(m => m.id === selectedModel)?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedModel(null)} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
              Limpiar todo
            </Button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop sidebar filters */}
          <aside className="hidden md:block w-64 shrink-0">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                </h3>
                <FilterContent />
              </CardContent>
            </Card>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {products.length} producto{products.length !== 1 ? 's' : ''}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted" />
                    <CardContent className="p-3">
                      <div className="h-4 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No se encontraron productos</p>
                {hasActiveFilters && (
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    Limpiar filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden group hover:shadow-md transition-shadow relative">
                    <div className="aspect-square relative bg-gradient-to-br from-muted to-muted/50">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                      )}

                      {/* Stock badge */}
                      {product.stock > 0 && product.stock <= product.minStock && (
                        <Badge variant="destructive" className="absolute top-2 right-2 text-[10px] px-1.5">
                          {product.stock} UD
                        </Badge>
                      )}
                      {product.stock === 0 && (
                        <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] px-1.5">
                          Agotado
                        </Badge>
                      )}
                      {product.stock > product.minStock && (
                        <Badge variant="default" className="absolute top-2 right-2 text-[10px] px-1.5 bg-green-600">
                          {product.stock} UD
                        </Badge>
                      )}

                      {/* Add button overlay on desktop, always visible on mobile if stock > 0 */}
                      {product.stock > 0 && (
                        <div className="absolute bottom-2 right-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            className="h-8 w-8 rounded-full shadow-lg p-0"
                            onClick={(e) => {
                              e.preventDefault()
                              handleAddToCartClick(product)
                            }}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="text-[10px] text-muted-foreground truncate mb-0.5">
                        {product.models[0]?.model?.brand?.name} {product.models[0]?.model?.name}
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>
                      <Badge variant="outline" className="mb-2 text-[10px] px-1.5 py-0">
                        {product.category.name}
                      </Badge>
                      <div className="flex items-center justify-between">
                        <div className="text-base font-bold text-primary">
                          {formatPrice(
                            customerType === "WHOLESALE"
                              ? product.wholesalePrice
                              : product.retailPrice
                          )}
                        </div>
                        {customerType === "WHOLESALE" && (
                          <span className="text-[10px] text-cyan-600">mayoreo</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex items-center justify-around h-16">
          <Link href="/" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-5 w-5" />
            <span className="text-[10px]">Inicio</span>
          </Link>
          <Link href="/catalogo" className="flex flex-col items-center gap-1 text-primary">
            <ShoppingCart className="h-5 w-5" />
            <span className="text-[10px]">Catalogo</span>
          </Link>
          <Link href="/mis-reservas" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <CalendarCheck className="h-5 w-5" />
            <span className="text-[10px]">Reservas</span>
          </Link>
          <Link href="/perfil" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <User className="h-5 w-5" />
            <span className="text-[10px]">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
