"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { CurrencyToggleCompact } from "@/components/currency-toggle"
import {
    User,
    Mail,
    LogOut,
    ShoppingCart,
    Package,
    CalendarCheck,
    Shield,
    Clock,
    Home
} from "lucide-react"
import Link from "next/link"

interface UserData {
    name?: string | null
    email?: string | null
    role?: string
    status?: string
    customerType?: string
}

function getStatusBadge(status: string) {
    switch (status) {
        case "APPROVED":
            return <Badge className="bg-green-500">Aprobado</Badge>
        case "PENDING":
            return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">Pendiente</Badge>
        case "REJECTED":
            return <Badge variant="destructive">Rechazado</Badge>
        default:
            return <Badge variant="secondary">{status}</Badge>
    }
}

function getCustomerTypeBadge(type: string) {
    switch (type) {
        case "WHOLESALE":
            return <Badge variant="secondary">Mayoreo</Badge>
        case "RETAIL":
            return <Badge variant="outline">Menudeo</Badge>
        default:
            return <Badge variant="outline">{type}</Badge>
    }
}

export default function PerfilClient({ user }: { user: UserData }) {
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        await signOut({ callbackUrl: "/" })
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto max-w-4xl flex h-16 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        <span className="font-bold">Pro-Solutions</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <CurrencyToggleCompact />
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="container mx-auto max-w-4xl px-4 py-8">
                <div className="space-y-6">
                    {/* Profile Card */}
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">{user?.name || "Usuario"}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                            {user?.role === "ADMIN" ? (
                                                <span className="flex items-center gap-1">
                                                    <Shield className="h-3 w-3" />
                                                    Administrador
                                                </span>
                                            ) : (
                                                <span>Cliente</span>
                                            )}
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                    {getStatusBadge(user?.status || "")}
                                    {user?.role !== "ADMIN" && getCustomerTypeBadge(user?.customerType || "")}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Contact Info */}
                            <div className="grid gap-3">
                                {user?.email && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{user.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Account Status */}
                            {user?.status === "PENDING" && (
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    <div className="flex items-start gap-3">
                                        <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                                Cuenta pendiente de aprobación
                                            </p>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                                Tu cuenta está siendo revisada. Te notificaremos cuando sea aprobada.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Acceso Rápido</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {user?.role === "ADMIN" ? (
                                    <>
                                        <Button variant="outline" className="justify-start h-auto py-3" asChild>
                                            <Link href="/admin">
                                                <Package className="mr-3 h-5 w-5" />
                                                <div className="text-left">
                                                    <div className="font-medium">Panel Admin</div>
                                                    <div className="text-xs text-muted-foreground">Gestionar inventario</div>
                                                </div>
                                            </Link>
                                        </Button>
                                        <Button variant="outline" className="justify-start h-auto py-3" asChild>
                                            <Link href="/admin/reservas">
                                                <ShoppingCart className="mr-3 h-5 w-5" />
                                                <div className="text-left">
                                                    <div className="font-medium">Reservas</div>
                                                    <div className="text-xs text-muted-foreground">Ver solicitudes</div>
                                                </div>
                                            </Link>
                                        </Button>
                                    </>
                                ) : user?.status === "APPROVED" ? (
                                    <>
                                        <Button variant="outline" className="justify-start h-auto py-3" asChild>
                                            <Link href="/">
                                                <Package className="mr-3 h-5 w-5" />
                                                <div className="text-left">
                                                    <div className="font-medium">Catálogo</div>
                                                    <div className="text-xs text-muted-foreground">Ver productos</div>
                                                </div>
                                            </Link>
                                        </Button>
                                        <Button variant="outline" className="justify-start h-auto py-3" asChild>
                                            <Link href="/mis-reservas">
                                                <CalendarCheck className="mr-3 h-5 w-5" />
                                                <div className="text-left">
                                                    <div className="font-medium">Mis Reservas</div>
                                                    <div className="text-xs text-muted-foreground">Ver estado</div>
                                                </div>
                                            </Link>
                                        </Button>
                                    </>
                                ) : (
                                    <div className="col-span-2 text-center text-muted-foreground py-4">
                                        Las funciones estarán disponibles cuando tu cuenta sea aprobada
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logout */}
                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        {isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}
                    </Button>
                </div>
            </main>
        </div>
    )
}
