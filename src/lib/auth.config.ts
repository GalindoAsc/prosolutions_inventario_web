import type { NextAuthConfig } from "next-auth"

// Definimos los tipos localmente para evitar problemas con Edge runtime
type UserRole = "ADMIN" | "CUSTOMER"
type CustomerType = "RETAIL" | "WHOLESALE"
type UserStatus = "PENDING" | "APPROVED" | "REJECTED"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    customerType: CustomerType
    status: UserStatus
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      customerType: CustomerType
      status: UserStatus
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: UserRole
    customerType: CustomerType
    status: UserStatus
  }
}

// Configuración base de auth que puede ser usada en Edge runtime
export const authConfig: NextAuthConfig = {
  providers: [], // Se agregan en auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAdmin = auth?.user?.role === "ADMIN"
      const isApproved = auth?.user?.status === "APPROVED"
      const isPending = auth?.user?.status === "PENDING"

      // Public paths that don't require authentication
      const publicPaths = ["/", "/login", "/register", "/api/auth"]
      const isPublicPath = publicPaths.some(path =>
        nextUrl.pathname === path || nextUrl.pathname.startsWith("/api/auth")
      )

      // Admin paths
      const isAdminPath = nextUrl.pathname.startsWith("/admin")

      // Protected paths (require login and approval)
      const protectedPaths = ["/catalogo", "/mis-reservas", "/perfil"]
      const isProtectedPath = protectedPaths.some(path =>
        nextUrl.pathname.startsWith(path)
      )

      // If user is logged in but pending, redirect to pending page
      if (isLoggedIn && isPending && !isPublicPath && nextUrl.pathname !== "/pending") {
        return Response.redirect(new URL("/pending", nextUrl))
      }

      // If trying to access admin routes without being admin
      if (isAdminPath) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/login", nextUrl))
        }
        if (!isAdmin) {
          return Response.redirect(new URL("/", nextUrl))
        }
        return true
      }

      // If trying to access protected routes without being logged in or approved
      if (isProtectedPath) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/login", nextUrl))
        }
        if (!isApproved && !isAdmin) {
          return Response.redirect(new URL("/pending", nextUrl))
        }
        return true
      }

      // If trying to access login/register while already logged in
      if ((nextUrl.pathname === "/login" || nextUrl.pathname === "/register") && isLoggedIn) {
        if (isAdmin) {
          return Response.redirect(new URL("/admin", nextUrl))
        }
        if (isApproved) {
          return Response.redirect(new URL("/catalogo", nextUrl))
        }
        return Response.redirect(new URL("/pending", nextUrl))
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.customerType = user.customerType
        token.status = user.status
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.customerType = token.customerType
        session.user.status = token.status
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
}
