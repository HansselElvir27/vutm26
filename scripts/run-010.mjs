import postgres from 'postgres'
import { readFileSync } from 'fs'

// Lee .env manualmente y decodifica la URL
const envContent = readFileSync('.env', 'utf-8')
let dbUrl = ''
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (trimmed.startsWith('DATABASE_URL=')) {
    dbUrl = trimmed.slice('DATABASE_URL='.length).trim()
    // Decodificar URL encoding (%24 -> $)
    dbUrl = decodeURIComponent(dbUrl)
    break
  }
}

if (!dbUrl) { console.error('No DATABASE_URL en .env'); process.exit(1) }

console.log('Conectando a:', dbUrl.replace(/:([^:@]+)@/, ':***@'))

const sql = postgres(dbUrl, { max: 1 })

try {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0`
  console.log('✓ Campo failed_login_attempts agregado')
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP DEFAULT NULL`
  console.log('✓ Campo locked_until agregado')
  await sql`CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL`
  console.log('✓ Índice creado')
  console.log('✓ Migración 010 completada exitosamente')
} catch (e) {
  console.error('Error en migración:', e.message)
  process.exit(1)
} finally {
  await sql.end()
}
