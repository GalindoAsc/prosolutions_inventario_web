import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  UserPlus,
  Clock,
  TrendingUp,
  Boxes,
} from "lucide-react"
import { formatPrice, formatDate } from "@/lib/utils"

async function getDashboardStats() {
  try {
    const [
      totalProducts,
      totalUsers,
      pendingUsers,
      pendingReservations,
      allProducts,
      totalBrands,
      recentReservations,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.reservation.count({ where: { status: "PENDING" } }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { stock: true, minStock: true },
      }),
      prisma.brand.count(),
      prisma.reservation.findMany({
        where: { status: { in: ["PENDING", "DEPOSIT_VERIFIED"] } },
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ])

    // Contar productos con stock bajo en JS
    const lowStockProducts = allProducts.filter(p => p.stock <= p.minStock).length

    return {
      totalProducts,
      totalUsers,
      pendingUsers,
      pendingReservations,
      lowStockProducts,
      totalBrands,
      recentReservations,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalProducts: 0,
      totalUsers: 0,
      pendingUsers: 0,
      pendingReservations: 0,
      lowStockProducts: 0,
      totalBrands: 0,
      recentReservations: [],
    }
  }
}

async function getLowStockProducts() {
  try {
    // Obtener productos con stock bajo (stock <= minStock)
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        models: {
          include: {
            model: { include: { brand: true } },
          },
          take: 1,
        },
        category: true,
      },
      orderBy: { stock: "asc" },
      take: 10,
    })
    // Filtrar en JS los que tienen stock <= minStock
    return products.filter(p => p.stock <= p.minStock).slice(0, 5)
  } catch (error) {
    console.error("Error fetching low stock products:", error)
    return []
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()
  const lowStockProducts = await getLowStockProducts()

  const statCards = [
    {
      title: "Productos",
      value: stats.totalProducts,
      description: "Productos activos",
      icon: Package,
      href: "/admin/productos",
    },
    {
      title: "Usuarios",
      value: stats.totalUsers,
      description: "Clientes registrados",
      icon: Users,
      href: "/admin/usuarios",
      alert: stats.pendingUsers > 0 ? `${stats.pendingUsers} pendientes` : null,
    },
    {
      title: "Reservas",
      value: stats.pendingReservations,
      description: "Pendientes de aprobar",
      icon: ShoppingCart,
      href: "/admin/reservas",
      alert: stats.pendingReservations > 0 ? "Requiere atención" : null,
    },
    {
      title: "Stock Bajo",
      value: stats.lowStockProducts,
      description: "Productos por reabastecer",
      icon: AlertTriangle,
      href: "/admin/productos?filter=low-stock",
      alert: stats.lowStockProducts > 0 ? "Revisar inventario" : null,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen general de Pro-Solutions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                {stat.alert && (
                  <Badge variant="destructive" className="mt-2">
                    {stat.alert}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Users */}
        {stats.pendingUsers > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Solicitudes de Cuenta
              </CardTitle>
              <CardDescription>
                Usuarios esperando aprobación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-warning">
                  {stats.pendingUsers}
                </span>
                <Button asChild>
                  <Link href="/admin/usuarios?filter=pending">
                    Revisar
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Reservations */}
        <Card className={stats.pendingUsers > 0 ? "" : "md:col-span-2"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Reservas Pendientes
            </CardTitle>
            <CardDescription>
              Reservas que requieren verificación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentReservations.length > 0 ? (
              <div className="space-y-4">
                {stats.recentReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{reservation.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {reservation.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(reservation.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          reservation.status === "DEPOSIT_VERIFIED"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {reservation.status === "DEPOSIT_VERIFIED"
                          ? "Anticipo"
                          : "Pendiente"}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        {formatPrice(reservation.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/reservas">Ver todas</Link>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No hay reservas pendientes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Alerta de Stock Bajo
            </CardTitle>
            <CardDescription>
              Productos que necesitan reabastecimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.models[0]?.model.brand.name} {product.models[0]?.model.name} - {product.category.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={product.stock === 0 ? "destructive" : "warning"}>
                      {product.stock} unidades
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mínimo: {product.minStock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/admin/productos?filter=low-stock">
                <Boxes className="mr-2 h-4 w-4" />
                Gestionar Inventario
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Marcas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBrands}</div>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/admin/marcas">Gestionar marcas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
