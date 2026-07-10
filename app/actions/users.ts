'use server'

import { revalidatePath } from 'next/cache'
import { sql } from '@/lib/db'
import { getSession, hashPassword } from '@/lib/auth'
import { isAuthorityRole } from '@/lib/ports'

export async function createUser(data: {
  email: string
  name: string
  role: string
  password?: string
  companyName?: string | null
  assignedPort?: string | null
}) {
  const session = await getSession()
  if (!session || session.user.role !== 'admin') {
    return { error: 'No autorizado' }
  }

  const { email, name, role, password, companyName, assignedPort } = data

  if (!email || !name || !role || !password) {
    return { error: 'Todos los campos obligatorios deben completarse' }
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  // Validaciones de rol
  if (isAuthorityRole(role) && !assignedPort) {
    return { error: 'Debe seleccionar un puerto asignado para roles de autoridad' }
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${normalizedEmail}
    `
    if (existingUser.length > 0) {
      return { error: 'El correo electrónico ya está registrado' }
    }

    const passwordHash = await hashPassword(password)
    
    // Insert user
    await sql`
      INSERT INTO users (email, password_hash, name, role, company_name, assigned_port)
      VALUES (
        ${normalizedEmail}, 
        ${passwordHash}, 
        ${name.trim()}, 
        ${role}, 
        ${role === 'naviera' ? (companyName || null) : null}, 
        ${isAuthorityRole(role) ? (assignedPort || null) : null}
      )
    `

    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error: any) {
    console.error('Error creating user:', error)
    return { error: error.message || 'Error interno del servidor al crear usuario' }
  }
}

export async function updateUser(id: number, data: {
  email: string
  name: string
  role: string
  password?: string
  companyName?: string | null
  assignedPort?: string | null
}) {
  const session = await getSession()
  if (!session || session.user.role !== 'admin') {
    return { error: 'No autorizado' }
  }

  // Prevenir que el admin se cambie su propio rol
  if (session.user.id === id && data.role !== 'admin') {
    return { error: 'No puede cambiar su propio rol de administrador' }
  }

  const { email, name, role, password, companyName, assignedPort } = data

  if (!email || !name || !role) {
    return { error: 'Todos los campos obligatorios deben completarse' }
  }

  if (password && password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  // Validaciones de rol
  if (isAuthorityRole(role) && !assignedPort) {
    return { error: 'Debe seleccionar un puerto asignado para roles de autoridad' }
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${normalizedEmail} AND id != ${id}
    `
    if (existingUser.length > 0) {
      return { error: 'El correo electrónico ya está registrado por otro usuario' }
    }

    const finalCompanyName = role === 'naviera' ? (companyName || null) : null
    const finalAssignedPort = isAuthorityRole(role) ? (assignedPort || null) : null

    if (password) {
      const passwordHash = await hashPassword(password)
      await sql`
        UPDATE users
        SET 
          email = ${normalizedEmail},
          name = ${name.trim()},
          role = ${role},
          password_hash = ${passwordHash},
          company_name = ${finalCompanyName},
          assigned_port = ${finalAssignedPort},
          updated_at = NOW()
        WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE users
        SET 
          email = ${normalizedEmail},
          name = ${name.trim()},
          role = ${role},
          company_name = ${finalCompanyName},
          assigned_port = ${finalAssignedPort},
          updated_at = NOW()
        WHERE id = ${id}
      `
    }

    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating user:', error)
    return { error: error.message || 'Error interno del servidor al actualizar usuario' }
  }
}

export async function deleteUser(id: number) {
  const session = await getSession()
  if (!session || session.user.role !== 'admin') {
    return { error: 'No autorizado' }
  }

  // Prevenir que el admin se elimine a sí mismo
  if (session.user.id === id) {
    return { error: 'No puede eliminarse a sí mismo como administrador activo' }
  }

  try {
    await sql`
      DELETE FROM users WHERE id = ${id}
    `
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return { error: error.message || 'Error al eliminar el usuario' }
  }
}
