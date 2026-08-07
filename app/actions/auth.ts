'use server'

import { redirect } from 'next/navigation'
import { sql } from '@/lib/db'
import { hashPassword, verifyPassword, createSession, destroySession, getSession } from '@/lib/auth'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Correo y contraseña son requeridos' }
  }

  // Mensaje genérico para no revelar si el email existe o no
  const INVALID_MSG = 'Credenciales incorrectas. Verifique su correo y contraseña.'

  const result = await sql`
    SELECT id, password_hash, failed_login_attempts, locked_until
    FROM users
    WHERE email = ${email.toLowerCase().trim()}
  `

  if (result.length === 0) {
    // Simular retardo para evitar enumeración de usuarios
    await verifyPassword('dummy', '$2b$12$dummyhashtopreventtimingattack00000000000000000000000')
    return { error: INVALID_MSG }
  }

  const user = result[0]

  // --- Verificar bloqueo de cuenta ---
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutesLeft = Math.ceil(
      (new Date(user.locked_until).getTime() - Date.now()) / 60000
    )
    return {
      error: `Cuenta bloqueada por ${minutesLeft} minuto${minutesLeft !== 1 ? 's' : ''} debido a múltiples intentos fallidos. Intente más tarde.`,
      locked: true,
    }
  }

  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    const newAttempts = (user.failed_login_attempts || 0) + 1

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      // Bloquear la cuenta
      const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
      await sql`
        UPDATE users
        SET failed_login_attempts = ${newAttempts}, locked_until = ${lockedUntil.toISOString()}
        WHERE id = ${user.id}
      `
      return {
        error: `Cuenta bloqueada por ${LOCKOUT_MINUTES} minutos por superar el límite de intentos fallidos (${MAX_FAILED_ATTEMPTS}).`,
        locked: true,
      }
    } else {
      await sql`
        UPDATE users
        SET failed_login_attempts = ${newAttempts}
        WHERE id = ${user.id}
      `
      const remaining = MAX_FAILED_ATTEMPTS - newAttempts
      return {
        error: `${INVALID_MSG} Le quedan ${remaining} intento${remaining !== 1 ? 's' : ''} antes del bloqueo.`,
      }
    }
  }

  // Login exitoso — resetear contador
  await sql`
    UPDATE users
    SET failed_login_attempts = 0, locked_until = NULL
    WHERE id = ${user.id}
  `

  await createSession(user.id)
  redirect('/dashboard')
}

export async function logout() {
  await destroySession()
  redirect('/login')
}

export async function logoutInactive() {
  await destroySession()
  // No redirect — el cliente maneja la navegación
}

// register() ahora está PROTEGIDO: solo admins autenticados pueden crear usuarios.
// El registro público fue eliminado — usar /dashboard/users para crear cuentas.
export async function register(formData: FormData) {
  const session = await getSession()

  if (!session || session.user.role !== 'admin') {
    return { error: 'No autorizado. Solo administradores pueden registrar nuevos usuarios.' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const companyName = formData.get('company_name') as string | null
  const assignedPort = formData.get('assigned_port') as string | null

  if (!email || !password || !name || !role) {
    return { error: 'Todos los campos son requeridos' }
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  const authorityRoles = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa']
  if (authorityRoles.includes(role) && !assignedPort) {
    return { error: 'Debe seleccionar un puerto asignado para este tipo de usuario' }
  }

  const existingUser = await sql`
    SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}
  `

  if (existingUser.length > 0) {
    return { error: 'El correo electrónico ya está registrado' }
  }

  const passwordHash = await hashPassword(password)

  await sql`
    INSERT INTO users (email, password_hash, name, role, company_name, assigned_port)
    VALUES (${email.toLowerCase().trim()}, ${passwordHash}, ${name}, ${role}, ${companyName || null}, ${assignedPort || null})
  `

  return { success: true }
}
