import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { NextResponse } from "next/server"

const testUsers = [
  {
    email: "agente@test.com",
    password: "Test123!",
    name: "Juan Perez - Agente Naviero",
    role: "naviera",
    company_name: "Agencia Maritima Honduras",
    assigned_port: null,
  },
  {
    email: "puerto.cortes@test.com",
    password: "Test123!",
    name: "Maria Garcia - Capitania Puerto Cortes",
    role: "capitan_puerto",
    company_name: "Empresa Nacional Portuaria",
    assigned_port: "puerto_cortes",
  },
  {
    email: "puerto.roatan@test.com",
    password: "Test123!",
    name: "Pedro Ramirez - Capitania Roatan",
    role: "capitan_puerto",
    company_name: "Empresa Nacional Portuaria",
    assigned_port: "puerto_roatan",
  },
  {
    email: "aduana.cortes@test.com",
    password: "Test123!",
    name: "Carlos Lopez - Aduanas Puerto Cortes",
    role: "aduanas",
    company_name: "Direccion General de Aduanas",
    assigned_port: "puerto_cortes",
  },
  {
    email: "aduana.roatan@test.com",
    password: "Test123!",
    name: "Luis Mendez - Aduanas Roatan",
    role: "aduanas",
    company_name: "Direccion General de Aduanas",
    assigned_port: "puerto_roatan",
  },
  {
    email: "migracion.cortes@test.com",
    password: "Test123!",
    name: "Ana Martinez - Migracion Puerto Cortes",
    role: "migracion",
    company_name: "Direccion General de Migracion",
    assigned_port: "puerto_cortes",
  },
  {
    email: "salud.cortes@test.com",
    password: "Test123!",
    name: "Roberto Hernandez - Salud Puerto Cortes",
    role: "salud",
    company_name: "Secretaria de Salud",
    assigned_port: "puerto_cortes",
  },
  {
    email: "senasa.cortes@test.com",
    password: "Test123!",
    name: "Carmen Flores - SENASA Puerto Cortes",
    role: "senassa",
    company_name: "SENASA",
    assigned_port: "puerto_cortes",
  },
  {
    email: "admin@test.com",
    password: "Test123!",
    name: "Sistema Admin",
    role: "admin",
    company_name: "VUTMHN",
    assigned_port: null,
  },
]

export async function GET() {
  try {
    const results = []

    for (const user of testUsers) {
      // Check if user already exists
      const existing = await sql`SELECT id FROM users WHERE email = ${user.email}`

      if (existing.length > 0) {
        results.push({ email: user.email, status: "already exists" })
        continue
      }

      // Hash password and create user
      const passwordHash = await hashPassword(user.password)

      await sql`
        INSERT INTO users (email, password_hash, name, role, company_name, assigned_port)
        VALUES (${user.email}, ${passwordHash}, ${user.name}, ${user.role}, ${user.company_name}, ${user.assigned_port})
      `

      results.push({ email: user.email, status: "created", port: user.assigned_port })
    }

    return NextResponse.json({
      success: true,
      message: "Test users seeded successfully",
      users: results,
      credentials: {
        password: "Test123!",
        accounts: testUsers.map((u) => ({
          email: u.email,
          role: u.role,
          name: u.name,
          port: u.assigned_port,
        })),
      },
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
