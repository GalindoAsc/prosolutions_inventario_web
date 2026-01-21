import Image from "next/image"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { CurrencyToggleCompact } from "@/components/currency-toggle"
import { ProductGrid } from "@/components/product-grid"
import { prisma } from "@/lib/prisma"
import { Smartphone, LogIn, UserPlus, LayoutDashboard, ShoppingCart, User, CalendarCheck } from "lucide-react"

async function getPublicProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isPublic: true,
        isActive: true,
      },
      include: {
        models: {
          include: {
            model: {
              include: { brand: true },
            },
          },
        },
        category: true,
      },
      take: 12,
      orderBy: { createdAt: "desc" },
    })
    return products
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

async function getStats() {
  try {
    const [brandsCount, productsCount] = await Promise.all([
      prisma.brand.count(),
      prisma.product.count({ where: { isActive: true } }),
    ])
    return { brandsCount, productsCount }
  } catch {
    return { brandsCount: 0, productsCount: 0 }
  }
}

export default async function HomePage() {
  const session = await auth()
  const products = await getPublicProducts()
  const stats = await getStats()

  const isLoggedIn = !!session
  const isAdmin = session?.user?.role === "ADMIN"
  const isApproved = session?.user?.status === "APPROVED"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            <CurrencyToggleCompact />
            <ThemeToggle />
            {isLoggedIn ? (
              isAdmin ? (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                    <Link href="/admin">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/admin">
                      <span className="sm:hidden">Admin</span>
                      <span className="hidden sm:inline">Panel Admin</span>
                    </Link>
                  </Button>
                </>
              ) : isApproved ? (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                    <Link href="/catalogo">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Catálogo
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                    <Link href="/mis-reservas">
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      Mis Reservas
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/perfil">
                      <User className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Mi Cuenta</span>
                    </Link>
                  </Button>
                </>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href="/pending">
                    <User className="mr-2 h-4 w-4" />
                    Mi Cuenta
                  </Link>
                </Button>
              )
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Entrar</span>
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Solicitar Acceso</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-7xl text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.jpg"
              alt="Pro-Solutions"
              width={150}
              height={150}
              className="rounded-2xl shadow-lg"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Refacciones para Celulares
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Encuentra las mejores refacciones para todo tipo de celulares.
            Pantallas, baterías, flex y más.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {!isLoggedIn && (
              <Button size="lg" asChild>
                <Link href="/register">
                  Solicitar Cuenta
                </Link>
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.brandsCount}+</div>
              <div className="text-muted-foreground">Marcas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.productsCount}+</div>
              <div className="text-muted-foreground">Productos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Products */}
      <section className="py-12 sm:py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Productos Destacados
          </h2>

          <ProductGrid
            products={products}
            isLoggedIn={isLoggedIn}
            isApproved={isApproved}
            customerType={session?.user?.customerType}
          />

          {products.length > 0 && !isLoggedIn && (
            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">
                ¿Quieres acceder a precios de mayoreo y productos exclusivos?
              </p>
              <Button asChild>
                <Link href="/register">Solicitar Acceso</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto max-w-7xl text-center text-muted-foreground">
          <p>Pro-Solutions - Téc. Diego Alvarez</p>
          <p className="text-sm mt-2">
            Refacciones para celulares de todas las marcas
          </p>
        </div>
      </footer>
    </div>
  )
}
