import Image from "next/image"
import Link from "next/link"

// Prevent static generation - requires database at runtime
export const dynamic = 'force-dynamic'

import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { CurrencyToggleCompact } from "@/components/currency-toggle"
import { ProductGrid } from "@/components/product-grid"
import { MobileNav } from "@/components/mobile-nav"
import { prisma } from "@/lib/prisma"
import { LogIn, UserPlus, LayoutDashboard, ShoppingCart, User, CalendarCheck, Search, ArrowRight } from "lucide-react"

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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.jpg"
              alt="Pro-Solutions"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="font-bold hidden sm:inline">Pro-Solutions</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <CurrencyToggleCompact />
            <ThemeToggle />
            {isLoggedIn ? (
              isAdmin ? (
                <Button size="sm" asChild>
                  <Link href="/admin">
                    <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Panel Admin</span>
                  </Link>
                </Button>
              ) : isApproved ? (
                <Button variant="ghost" size="icon" asChild className="md:hidden">
                  <Link href="/perfil">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href="/pending">
                    <User className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Mi Cuenta</span>
                  </Link>
                </Button>
              )
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">
                    <LogIn className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Entrar</span>
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">
                    <UserPlus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Registrarse</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 sm:py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-7xl text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <Image
              src="/logo.jpg"
              alt="Pro-Solutions"
              width={120}
              height={120}
              className="rounded-2xl shadow-lg sm:w-[150px] sm:h-[150px]"
            />
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            Refacciones para Celulares
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Encuentra las mejores refacciones para todo tipo de celulares.
            Pantallas, baterias, flex y mas.
          </p>

          {/* Quick Actions for Logged In Users */}
          {isLoggedIn && isApproved && !isAdmin && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto mb-6">
              <Button size="lg" className="flex-1" asChild>
                <Link href="/catalogo">
                  <Search className="mr-2 h-5 w-5" />
                  Ver Catalogo
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="flex-1" asChild>
                <Link href="/mis-reservas">
                  <CalendarCheck className="mr-2 h-5 w-5" />
                  Mis Reservas
                </Link>
              </Button>
            </div>
          )}

          {/* CTA for non-logged users */}
          {!isLoggedIn && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto mb-6">
              <Button size="lg" className="flex-1" asChild>
                <Link href="/register">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Solicitar Cuenta
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="flex-1" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-5 w-5" />
                  Ya tengo cuenta
                </Link>
              </Button>
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.brandsCount}+</div>
              <div className="text-sm text-muted-foreground">Marcas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.productsCount}+</div>
              <div className="text-sm text-muted-foreground">Productos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Products */}
      <section className="py-8 sm:py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">
              Productos Destacados
            </h2>
            {isLoggedIn && isApproved && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/catalogo">
                  Ver todos
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          <ProductGrid
            products={products}
            isLoggedIn={isLoggedIn}
            isApproved={isApproved}
            customerType={session?.user?.customerType}
          />

          {products.length > 0 && !isLoggedIn && (
            <div className="text-center mt-8 p-6 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground mb-4">
                Accede a precios de mayoreo y productos exclusivos
              </p>
              <Button asChild>
                <Link href="/register">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Solicitar Acceso
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 px-4 mb-16 md:mb-0">
        <div className="container mx-auto max-w-7xl text-center text-muted-foreground">
          <p className="text-sm">Pro-Solutions - Tec. Diego Alvarez</p>
          <p className="text-xs mt-1">
            Refacciones para celulares de todas las marcas
          </p>
        </div>
      </footer>

      {/* Mobile Navigation - only for logged in approved customers */}
      {isLoggedIn && isApproved && !isAdmin && <MobileNav />}
    </div>
  )
}
