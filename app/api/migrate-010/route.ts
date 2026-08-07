import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * Endpoint temporal de migración de seguridad (010).
 * Solo puede ser ejecutado por un admin autenticado.
 * Eliminar este archivo después de ejecutar la migración.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP DEFAULT NULL`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL`

    return NextResponse.json({
      success: true,
      message: 'Migración 010 ejecutada: campos de seguridad de login agregados a la tabla users.',
    })
  } catch (error: any) {
    console.error('[Migration 010] Error:', error)
    return NextResponse.json({ error: 'Error al ejecutar la migración' }, { status: 500 })
  }
}
