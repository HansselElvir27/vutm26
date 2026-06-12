'use server'

import { redirect } from 'next/navigation'
import { sql } from '@/lib/db'
import { hashPassword, verifyPassword, createSession, destroySession } from '@/lib/auth'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const result = await sql`
    SELECT id, password_hash FROM users WHERE email = ${email.toLowerCase()}
  `

  if (result.length === 0) {
    return { error: 'Invalid email or password' }
  }

  const user = result[0]
  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    return { error: 'Invalid email or password' }
  }

  await createSession(user.id)
  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const companyName = formData.get('company_name') as string | null
  const assignedPort = formData.get('assigned_port') as string | null

  if (!email || !password || !name || !role) {
    return { error: 'All fields are required' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  // Validate that authority roles have an assigned port
  const authorityRoles = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa']
  if (authorityRoles.includes(role) && !assignedPort) {
    return { error: 'Debe seleccionar un puerto asignado para este tipo de usuario' }
  }

  const existingUser = await sql`
    SELECT id FROM users WHERE email = ${email.toLowerCase()}
  `

  if (existingUser.length > 0) {
    return { error: 'Email already registered' }
  }

  const passwordHash = await hashPassword(password)

  await sql`
    INSERT INTO users (email, password_hash, name, role, company_name, assigned_port)
    VALUES (${email.toLowerCase()}, ${passwordHash}, ${name}, ${role}, ${companyName}, ${assignedPort})
  `
  
  const newUser = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`

  await createSession(newUser[0].id)
  redirect('/dashboard')
}

export async function logout() {
  await destroySession()
  redirect('/login')
}
