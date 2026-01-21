"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Store,
  ShoppingBag,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  customerType: "RETAIL" | "WHOLESALE"
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  _count: { reservations: number }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      const params = filter !== "all" ? `?status=${filter.toUpperCase()}` : ""
      const res = await fetch(`/api/users${params}`)
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const updateUser = async (id: string, data: { status?: string; customerType?: string }) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setUpdating(null)
    }
  }

  const pendingCount = users.filter((u) => u.status === "PENDING").length

  const statusColors = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "destructive",
  } as const

  const statusIcons = {
    PENDING: Clock,
    APPROVED: CheckCircle,
    REJECTED: XCircle,
  }

  const statusLabels = {
    PENDING: "Pendiente",
    APPROVED: "Aprobado",
    REJECTED: "Rechazado",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Usuarios</h2>
        <p className="text-muted-foreground">
          Gestiona las cuentas de clientes
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          <Users className="mr-2 h-4 w-4" />
          Todos ({users.length})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          <Clock className="mr-2 h-4 w-4" />
          Pendientes
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={filter === "approved" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("approved")}
        >
          <UserCheck className="mr-2 h-4 w-4" />
          Aprobados
        </Button>
        <Button
          variant={filter === "rejected" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("rejected")}
        >
          <UserX className="mr-2 h-4 w-4" />
          Rechazados
        </Button>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {users.length > 0 ? (
          users.map((user) => {
            const StatusIcon = statusIcons[user.status]
            return (
              <Card key={user.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColors[user.status]}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusLabels[user.status]}
                      </Badge>
                      <Badge variant="outline">
                        {user.customerType === "WHOLESALE" ? (
                          <>
                            <Store className="mr-1 h-3 w-3" />
                            Mayoreo
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="mr-1 h-3 w-3" />
                            Menudeo
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p>Registrado: {formatDate(user.createdAt)}</p>
                      <p>Reservas: {user._count.reservations}</p>
                    </div>

                    <div className="flex gap-2">
                      {user.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUser(user.id, { status: "REJECTED" })}
                            disabled={updating === user.id}
                          >
                            {updating === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="mr-1 h-4 w-4" />
                            )}
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateUser(user.id, { status: "APPROVED" })}
                            disabled={updating === user.id}
                          >
                            {updating === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-1 h-4 w-4" />
                            )}
                            Aprobar
                          </Button>
                        </>
                      )}

                      {user.status === "APPROVED" && (
                        <select
                          value={user.customerType}
                          onChange={(e) =>
                            updateUser(user.id, { customerType: e.target.value })
                          }
                          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                          disabled={updating === user.id}
                        >
                          <option value="RETAIL">Menudeo</option>
                          <option value="WHOLESALE">Mayoreo</option>
                        </select>
                      )}

                      {user.status === "REJECTED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateUser(user.id, { status: "APPROVED" })}
                          disabled={updating === user.id}
                        >
                          Reactivar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No hay usuarios {filter !== "all" ? `${statusLabels[filter.toUpperCase() as keyof typeof statusLabels]?.toLowerCase()}s` : ""}</p>
          </div>
        )}
      </div>
    </div>
  )
}
