'use server'

import { revalidatePath } from 'next/cache'
import { sql } from '@/lib/db'
import { getSession, hashPassword, verifyPassword } from '@/lib/auth'

export async function updateProfile(data: {
  name: string
  currentPassword?: string
  newPassword?: string
}) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  const { name, currentPassword, newPassword } = data

  if (!name?.trim()) {
    return { error: 'El nombre es obligatorio' }
  }

  try {
    // If the user wants to change the password, verify the current one first
    if (newPassword) {
      if (!currentPassword) {
        return { error: 'Debe ingresar su contraseña actual para cambiarla' }
      }
      if (newPassword.length < 8) {
        return { error: 'La nueva contraseña debe tener al menos 8 caracteres' }
      }

      const userRow = await sql`
        SELECT password_hash FROM users WHERE id = ${session.user.id}
      `
      const isValid = await verifyPassword(currentPassword, userRow[0].password_hash)
      if (!isValid) {
        return { error: 'La contraseña actual es incorrecta' }
      }

      const newHash = await hashPassword(newPassword)
      await sql`
        UPDATE users SET name = ${name.trim()}, password_hash = ${newHash}, updated_at = NOW()
        WHERE id = ${session.user.id}
      `
    } else {
      await sql`
        UPDATE users SET name = ${name.trim()}, updated_at = NOW()
        WHERE id = ${session.user.id}
      `
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return { error: 'Error al actualizar el perfil' }
  }
}
