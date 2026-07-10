import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'
import { redirect } from 'next/navigation'
import { UsersClient } from '@/components/users/users-client'

export default async function UsersPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const { user } = session

  // Strict check to allow only admin users
  if (user.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch all users in descending order of registration
  const users = await sql`
    SELECT id, email, name, role, company_name, assigned_port, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
  `

  return (
    <UsersClient 
      initialUsers={users as any} 
      currentUser={{ id: user.id, role: user.role }} 
    />
  )
}
