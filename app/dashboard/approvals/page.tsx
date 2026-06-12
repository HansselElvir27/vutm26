import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Ship, FileText, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { ApproveAllDocumentsButton } from '@/components/approvals/approve-all-documents-button'

const roleLabels: Record<string, string> = {
  capitan_puerto: 'Capitania de Puerto',
  aduanas: 'Aduanas',
  migracion: 'Migracion',
  salud: 'Sanidad',
  senassa: 'SENASA',
  oficial_cim: 'Oficial CIM',
  admin: 'Administrador',
}

async function getPendingArrivals() {
  return sql`
    SELECT a.*, u.name as agent_name
    FROM arrivals a
    JOIN users u ON a.created_by = u.id
    WHERE a.status IN ('submitted', 'approved_by_captain', 'documents_complete')
    ORDER BY a.created_at ASC
  `
}

async function getPendingDocuments(userId: number) {
  return sql`
    SELECT d.*, a.ship_name, a.omi_number, u.name as uploaded_by_name
    FROM documents d
    JOIN arrivals a ON d.arrival_id = a.id
    JOIN users u ON d.uploaded_by = u.id
    WHERE d.id NOT IN (SELECT document_id FROM document_approvals WHERE approved_by = ${userId})
    ORDER BY d.uploaded_at ASC
  `
}

async function getMyApprovals(userId: number) {
  return sql`
    SELECT aa.*, a.ship_name, a.omi_number
    FROM arrival_approvals aa
    JOIN arrivals a ON aa.arrival_id = a.id
    WHERE aa.approved_by = ${userId}
    ORDER BY aa.approved_at DESC
    LIMIT 20
  `
}

export default async function ApprovalsPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const { user } = session
  const isAuthority = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa', 'oficial_cim', 'admin'].includes(user.role)

  if (!isAuthority) {
    redirect('/dashboard')
  }

  const [pendingArrivals, pendingDocuments, myApprovals] = await Promise.all([
    getPendingArrivals(),
    getPendingDocuments(user.id),
    getMyApprovals(user.id),
  ])

  // Check which arrivals current user has already approved
  const myArrivalApprovals = await sql`
    SELECT arrival_id FROM arrival_approvals 
    WHERE approved_by = ${user.id}
  `
  const approvedArrivalIds = new Set(myArrivalApprovals.map((a: any) => a.arrival_id))

  // Filter to show only arrivals not yet approved by this user
  const arrivalsToReview = pendingArrivals.filter((a: any) => !approvedArrivalIds.has(a.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Centro de Aprobaciones</h1>
        <p className="text-slate-500">
          Revise y apruebe notificaciones de arribo y documentos como {roleLabels[user.role] || user.role}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Arribos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{arrivalsToReview.length}</div>
            <p className="text-xs text-slate-500">Requieren su aprobacion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Documentos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDocuments.length}</div>
            <p className="text-xs text-slate-500">Por revisar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mis Aprobaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myApprovals.length}</div>
            <p className="text-xs text-slate-500">Ultimas 20</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="arrivals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="arrivals">
            <Ship className="w-4 h-4 mr-2" />
            Arribos ({arrivalsToReview.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documentos ({pendingDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <CheckCircle className="w-4 h-4 mr-2" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="arrivals">
          <Card>
            <CardHeader>
              <CardTitle>Arribos Pendientes de Revision</CardTitle>
              <CardDescription>
                Notificaciones de arribo que requieren su aprobacion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {arrivalsToReview.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay arribos pendientes de su aprobacion</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {arrivalsToReview.map((arrival: any) => (
                    <Link
                      key={arrival.id}
                      href={`/dashboard/arrivals/view/${arrival.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                          <Ship className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{arrival.ship_name}</p>
                          <p className="text-sm text-slate-500">
                            OMI: {arrival.omi_number} - {arrival.agent_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-slate-500">ETA</p>
                          <p className="text-sm font-medium text-slate-900">
                            {arrival.estimated_arrival_date ? new Date(arrival.estimated_arrival_date).toLocaleDateString('es-HN') : 'N/A'}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendiente
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Documentos Pendientes</CardTitle>
                  <CardDescription>
                    Documentos que requieren revision y aprobacion
                  </CardDescription>
                </div>
                <div className="flex-shrink-0">
                  <ApproveAllDocumentsButton pendingCount={pendingDocuments.length} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pendingDocuments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay documentos pendientes de revision</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingDocuments.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{doc.file_name}</p>
                          <p className="text-sm text-slate-500">
                            {doc.ship_name} - OMI: {doc.omi_number}
                          </p>
                        </div>
                      </div>
                      <Link href={`/dashboard/arrivals/view/${doc.arrival_id}`}>
                        <Button variant="outline" size="sm">
                          Revisar
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Aprobaciones</CardTitle>
              <CardDescription>
                Sus ultimas decisiones de aprobacion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myApprovals.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No ha realizado aprobaciones aun</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myApprovals.map((approval: any) => (
                    <div
                      key={approval.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          approval.approved ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          {approval.approved ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{approval.ship_name}</p>
                          <p className="text-sm text-slate-500">OMI: {approval.omi_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          approval.approved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {approval.approved ? 'Aprobado' : 'Rechazado'}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          {approval.approved_at ? new Date(approval.approved_at).toLocaleDateString('es-HN') : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
