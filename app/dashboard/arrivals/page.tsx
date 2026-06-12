import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Ship, Plus, Search, Filter, MapPin } from 'lucide-react'
import Link from 'next/link'
import { isAuthorityRole, getPortLabel } from '@/lib/ports'
import { ArrivalsList } from './arrivals-list'

async function getArrivals(userId: number, role: string, assignedPort: string | null) {
  const isNaviera = role === 'naviera'
  const isAuthority = isAuthorityRole(role)

  if (isNaviera) {
    return sql`
      SELECT a.*, u.name as agent_name
      FROM arrivals a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.created_by = ${userId}
      ORDER BY a.created_at DESC
    `
  } else if (isAuthority) {
    if (assignedPort) {
      return sql`
        SELECT a.*, u.name as agent_name
        FROM arrivals a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.port_of_arrival = ${assignedPort} AND a.status != 'pending'
        ORDER BY a.created_at DESC
      `
    } else {
      return sql`
        SELECT a.*, u.name as agent_name
        FROM arrivals a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.status != 'pending'
        ORDER BY a.created_at DESC
      `
    }
  } else {
    return sql`
      SELECT a.*, u.name as agent_name
      FROM arrivals a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.status != 'pending'
      ORDER BY a.created_at DESC
    `
  }
}

export default async function ArrivalsPage() {
  const session = await getSession()
  if (!session) return null

  const { user } = session
  const arrivals = await getArrivals(user.id, user.role, user.assigned_port)
  const isNaviera = user.role === 'naviera'
  const isAuthority = isAuthorityRole(user.role)

  return (
    <ArrivalsList 
      arrivals={arrivals}
      isNaviera={isNaviera}
      isAuthority={isAuthority}
      assignedPort={user.assigned_port}
    />
  )
}

