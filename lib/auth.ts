import { cookies } from 'next/headers'
import { sql, type User, type Session } from './db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const SESSION_COOKIE_NAME = 'vutmhn_session'
const SESSION_EXPIRY_DAYS = 7

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: number): Promise<string> {
  const sessionToken = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS)

  await sql`
    INSERT INTO sessions (session_token, user_id, expires_at)
    VALUES (${sessionToken}, ${userId}, ${expiresAt.toISOString()})
  `

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })

  return sessionToken
}

export async function getSession(): Promise<{ user: User; session: Session } | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) {
    return null
  }

  const result = await sql`
    SELECT 
      s.id as session_id,
      s.user_id,
      s.expires_at as session_expires_at,
      s.created_at as session_created_at,
      u.id,
      u.email,
      u.name,
      u.role,
      u.company_name,
      u.assigned_port,
      u.created_at,
      u.updated_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_token = ${sessionId}
      AND s.expires_at > NOW()
  `

  if (result.length === 0) {
    return null
  }

  const row = result[0]
  return {
    session: {
      id: row.session_id,
      user_id: row.user_id,
      expires_at: row.session_expires_at,
      created_at: row.session_created_at,
    },
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      company_name: row.company_name,
      assigned_port: row.assigned_port,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (sessionId) {
    await sql`DELETE FROM sessions WHERE session_token = ${sessionId}`
    cookieStore.delete(SESSION_COOKIE_NAME)
  }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireRole(allowedRoles: User['role'][]) {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden')
  }
  return session
}
