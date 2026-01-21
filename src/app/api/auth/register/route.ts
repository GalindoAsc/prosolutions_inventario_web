import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { sendNotificationToAdmins } from "@/app/api/notifications/stream/route"

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, customerType } = await req.json()

    // Validate: name and password are required, plus either email or phone
    if (!name || !password) {
      return NextResponse.json(
        { error: "Nombre y contraseña son requeridos" },
        { status: 400 }
      )
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Correo electrónico o teléfono es requerido" },
        { status: 400 }
      )
    }

    // Validate customerType
    const validTypes = ["RETAIL", "WHOLESALE"]
    const requestedType = validTypes.includes(customerType) ? customerType : "RETAIL"

    // Check if user already exists (by email or phone)
    if (email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      })
      if (existingByEmail) {
        return NextResponse.json(
          { error: "Este correo ya está registrado" },
          { status: 400 }
        )
      }
    }

    if (phone) {
      const existingByPhone = await prisma.user.findFirst({
        where: { phone },
      })
      if (existingByPhone) {
        return NextResponse.json(
          { error: "Este teléfono ya está registrado" },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with PENDING status
    // requestedCustomerType guarda lo que el cliente solicita
    // customerType se establece como RETAIL por defecto (admin puede cambiarlo)
    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        role: "CUSTOMER",
        customerType: "RETAIL",
        requestedCustomerType: requestedType,
        status: "PENDING",
      },
    })

    // Enviar notificación a admins
    sendNotificationToAdmins({
      type: "user_registered",
      title: "👤 Nueva solicitud de cuenta",
      message: `${name} solicita cuenta ${requestedType === "WHOLESALE" ? "mayorista" : "menudeo"}`,
      data: {
        userId: user.id,
        name,
        email,
        phone,
        requestedType,
      },
    })

    return NextResponse.json({
      message: "Solicitud enviada correctamente",
      userId: user.id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}
