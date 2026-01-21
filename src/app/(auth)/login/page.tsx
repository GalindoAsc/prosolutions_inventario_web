"use client"

import { useState, useRef, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Loader2, Eye, EyeOff, Mail, Phone, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Lista de ladas de países
const countryCodes = [
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+1", country: "USA/Canadá", flag: "🇺🇸" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+51", country: "Perú", flag: "🇵🇪" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+502", country: "Guatemala", flag: "🇬🇹" },
  { code: "+503", country: "El Salvador", flag: "🇸🇻" },
  { code: "+504", country: "Honduras", flag: "🇭🇳" },
  { code: "+505", country: "Nicaragua", flag: "🇳🇮" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
  { code: "+507", country: "Panamá", flag: "🇵🇦" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴" },
  { code: "+595", country: "Paraguay", flag: "🇵🇾" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+34", country: "España", flag: "🇪🇸" },
]

type LoginMethod = "email" | "phone"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const error = searchParams.get("error")

  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [countryCode, setCountryCode] = useState("+52")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(error || "")

  // Country code dropdown
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")

    const identifier = loginMethod === "email" 
      ? email 
      : `${countryCode}${phone.replace(/\s/g, "")}`

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      })

      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setErrorMsg("Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCountry = countryCodes.find(c => c.code === countryCode)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.jpg"
              alt="Pro-Solutions"
              width={120}
              height={120}
              className="rounded-lg"
            />
          </div>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {errorMsg}
              </div>
            )}

            {/* Login Method Toggle */}
            <div className="space-y-3">
              <Label>Iniciar sesión con</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLoginMethod("email")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                    loginMethod === "email"
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-muted-foreground/50"
                  )}
                  disabled={isLoading}
                >
                  <Mail className={cn(
                    "h-5 w-5",
                    loginMethod === "email" ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium text-sm",
                    loginMethod === "email" ? "text-primary" : ""
                  )}>
                    Correo
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod("phone")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                    loginMethod === "phone"
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-muted-foreground/50"
                  )}
                  disabled={isLoading}
                >
                  <Phone className={cn(
                    "h-5 w-5",
                    loginMethod === "phone" ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium text-sm",
                    loginMethod === "phone" ? "text-primary" : ""
                  )}>
                    Teléfono
                  </span>
                </button>
              </div>
            </div>

            {/* Email Input */}
            {loginMethod === "email" && (
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={loginMethod === "email"}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Phone Input */}
            {loginMethod === "phone" && (
              <div className="space-y-2">
                <Label htmlFor="phone">Número de teléfono</Label>
                <div className="flex gap-2">
                  <div className="relative" ref={countryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="flex items-center gap-1 h-10 px-3 border rounded-md bg-muted hover:bg-accent transition-colors min-w-[100px]"
                      disabled={isLoading}
                    >
                      <span className="text-lg">{selectedCountry?.flag}</span>
                      <span className="text-sm font-medium">{countryCode}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute z-20 w-56 mt-1 bg-popover border rounded-md shadow-lg max-h-64 overflow-auto">
                        {countryCodes.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                            onClick={() => {
                              setCountryCode(country.code)
                              setShowCountryDropdown(false)
                            }}
                          >
                            <span className="text-lg">{country.flag}</span>
                            <span className="flex-1">{country.country}</span>
                            <span className="text-muted-foreground">{country.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="55 1234 5678"
                    value={phone}
                    onChange={handlePhoneChange}
                    required={loginMethod === "phone"}
                    disabled={isLoading}
                    className="flex-1"
                    maxLength={14}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Solicitar acceso
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
