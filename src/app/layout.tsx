import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { CurrencyProvider } from "@/components/currency-provider"
import { SessionProvider } from "@/components/session-provider"
import { MobileNav } from "@/components/mobile-nav"
import { auth } from "@/lib/auth"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Pro-Solutions | Refacciones para Celulares",
    template: "%s | Pro-Solutions"
  },
  description: "Catálogo de refacciones para celulares - Pro-Solutions Téc. Diego Alvarez",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pro-Solutions",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CurrencyProvider>
              {children}
            </CurrencyProvider>
            <MobileNav isAdmin={isAdmin} />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
