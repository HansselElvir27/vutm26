import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { DocumentsList } from './documents-list'

async function getDocuments(userId: number, role: string, assignedPort: string | null) {
  const isNaviera = role === 'naviera'
  const isAuthority = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa'].includes(role)

  if (isNaviera) {
    return sql`
      SELECT d.id, d.document_type, d.file_name, d.uploaded_at, 
             a.ship_name, a.omi_number, a.id as arrival_id, u.name as uploaded_by_name
      FROM documents d
      JOIN arrivals a ON d.arrival_id = a.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE a.created_by = ${userId}
      ORDER BY d.uploaded_at DESC
    `
  } else if (isAuthority && assignedPort) {
    return sql`
      SELECT d.id, d.document_type, d.file_name, d.uploaded_at, 
             a.ship_name, a.omi_number, a.id as arrival_id, u.name as uploaded_by_name
      FROM documents d
      JOIN arrivals a ON d.arrival_id = a.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE a.port_of_arrival = ${assignedPort}
      ORDER BY d.uploaded_at DESC
    `
  } else {
    return sql`
      SELECT d.id, d.document_type, d.file_name, d.uploaded_at, 
             a.ship_name, a.omi_number, a.id as arrival_id, u.name as uploaded_by_name
      FROM documents d
      JOIN arrivals a ON d.arrival_id = a.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      ORDER BY d.uploaded_at DESC
    `
  }
}

export default async function DocumentsPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const { user } = session
  const documents = await getDocuments(user.id, user.role, user.assigned_port)
  const isNaviera = user.role === 'naviera'

  return (
    <DocumentsList 
      documents={documents}
      isNaviera={isNaviera}
    />
  )
}

