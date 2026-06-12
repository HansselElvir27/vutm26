import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Ship, FileText, CheckCircle, Clock, Anchor, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { isAuthorityRole, getPortLabel } from '@/lib/ports'

async function getStats(userId: number, role: string, assignedPort: string | null) {
  const isNaviera = role === 'naviera'
  const isAuthority = isAuthorityRole(role)
  
  let arrivalsQuery, pendingQuery, approvedQuery, documentsQuery

  if (isNaviera) {
    arrivalsQuery = sql`SELECT COUNT(*) as count FROM arrivals WHERE created_by = ${userId}`
    pendingQuery = sql`SELECT COUNT(*) as count FROM arrivals WHERE created_by = ${userId} AND status IN ('pending', 'approved_by_captain', 'documents_complete')`
    approvedQuery = sql`SELECT COUNT(*) as count FROM arrivals WHERE created_by = ${userId} AND status IN ('ready_for_zarpe', 'zarpe_approved', 'completed')`
    documentsQuery = sql`SELECT COUNT(*) as count FROM documents d JOIN arrivals a ON d.arrival_id = a.id WHERE a.created_by = ${userId}`
  } else if (isAuthority && assignedPort) {
    arrivalsQuery = sql`SELECT COUNT(*) as count FROM arrivals WHERE port_of_arrival = ${assignedPort}`
    pendingQuery = sql`SELECT COUNT(*) as count FROM arrivals WHERE port_of_arrival = ${assignedPort} AND status IN ('pending', 'approved_by_captain', 'documents_complete')`
    approvedQuery = sql`SELECT COUNT(*) as count FROM arrivals WHERE port_of_arrival = ${assignedPort} AND status IN ('ready_for_zarpe', 'zarpe_approved', 'completed')`
    documentsQuery = sql`SELECT COUNT(*) as count FROM documents d JOIN arrivals a ON d.arrival_id = a.id WHERE a.port_of_arrival = ${assignedPort}`
  } else {
    arrivalsQuery = sql`SELECT COUNT(*) as count FROM arrivals`
    pendingQuery = sql`SELECT COUNT(*) as count FROM arrivals WHERE status IN ('pending', 'approved_by_captain', 'documents_complete')`
    approvedQuery = sql`SELECT COUNT(*) as count FROM arrivals WHERE status IN ('ready_for_zarpe', 'zarpe_approved', 'completed')`
    documentsQuery = sql`SELECT COUNT(*) as count FROM documents`
  }

  const [arrivals, pending, approved, documents] = await Promise.all([
    arrivalsQuery,
    pendingQuery,
    approvedQuery,
    documentsQuery,
  ])

  return {
    totalArrivals: Number(arrivals[0]?.count || 0),
    pendingArrivals: Number(pending[0]?.count || 0),
    approvedArrivals: Number(approved[0]?.count || 0),
    totalDocuments: Number(documents[0]?.count || 0),
  }
}

async function getRecentArrivals(userId: number, role: string, assignedPort: string | null) {
  const isNaviera = role === 'naviera'
  const isAuthority = isAuthorityRole(role)
  
  if (isNaviera) {
    return sql`
      SELECT a.*, u.name as agent_name
      FROM arrivals a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.created_by = ${userId}
      ORDER BY a.created_at DESC
      LIMIT 5
    `
  } else if (isAuthority && assignedPort) {
    return sql`
      SELECT a.*, u.name as agent_name
      FROM arrivals a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.port_of_arrival = ${assignedPort} AND a.status != 'pending'
      ORDER BY a.created_at DESC
      LIMIT 5
    `
  } else if (isAuthority) {
    return sql`
      SELECT a.*, u.name as agent_name
      FROM arrivals a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.status != 'pending'
      ORDER BY a.created_at DESC
      LIMIT 5
    `
  } else {
    return sql`
      SELECT a.*, u.name as agent_name
      FROM arrivals a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.status != 'pending'
      ORDER BY a.created_at DESC
      LIMIT 5
    `
  }
}

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  pending: { label: 'Borrador', bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock },
  submitted: { label: 'Enviado', bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
  approved_by_captain: { label: 'Aprobado', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  documents_complete: { label: 'Docs Completos', bg: 'bg-amber-100', text: 'text-amber-700', icon: FileText },
  ready_for_zarpe: { label: 'Listo para Zarpe', bg: 'bg-purple-100', text: 'text-purple-700', icon: CheckCircle },
  zarpe_approved: { label: 'Zarpe Aprobado', bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Anchor },
  completed: { label: 'Completado', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  const { user } = session
  const stats = await getStats(user.id, user.role, user.assigned_port)
  const recentArrivals = await getRecentArrivals(user.id, user.role, user.assigned_port)

  const isNaviera = user.role === 'naviera'
  const isAuthority = isAuthorityRole(user.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bienvenido, {user.name}</h1>
          <p className="text-muted-foreground">
            {isNaviera ? 'Panel de control de agente naviero' : 'Panel de control de autoridad'}
          </p>
          {isAuthority && user.assigned_port && (
            <div className="flex items-center gap-1 mt-1 text-sm text-primary">
              <MapPin className="w-4 h-4" />
              <span>{getPortLabel(user.assigned_port)}</span>
            </div>
          )}
        </div>
        {isNaviera && (
          <Link href="/dashboard/arrivals/new">
            <Button>
              <Ship className="w-4 h-4 mr-2" />
              Nuevo Arribo
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Arribos</CardTitle>
            <Ship className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArrivals}</div>
            <p className="text-xs text-muted-foreground">
              {isNaviera ? 'Registrados por usted' : isAuthority && user.assigned_port ? 'En su puerto' : 'En el sistema'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingArrivals}</div>
            <p className="text-xs text-muted-foreground">
              En espera de aprobacion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedArrivals}</div>
            <p className="text-xs text-muted-foreground">
              Listos para zarpe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Archivos cargados
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arribos Recientes</CardTitle>
          <CardDescription>
            {isNaviera 
              ? 'Sus ultimas notificaciones de arribo' 
              : isAuthority && user.assigned_port 
                ? `Ultimas notificaciones en ${getPortLabel(user.assigned_port)}` 
                : 'Ultimas notificaciones en el sistema'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentArrivals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ship className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay arribos registrados</p>
              {isNaviera && (
                <Link href="/dashboard/arrivals/new">
                  <Button variant="link" className="mt-2">
                    Crear primera notificacion de arribo
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {recentArrivals.map((arrival: any) => {
                const status = statusConfig[arrival.status] || { label: arrival.status, bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock }
                return (
                  <Link
                    key={arrival.id}
                    href={`/dashboard/arrivals/view/${arrival.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Ship className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{arrival.ship_name}</p>
                        <p className="text-sm text-slate-500">
                          {arrival.omi_number} - {getPortLabel(arrival.port_of_arrival)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-slate-500">ETA</p>
                        <p className="text-sm font-medium text-slate-900">
                          {new Date(arrival.estimated_arrival_date).toLocaleDateString('es-HN')}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
