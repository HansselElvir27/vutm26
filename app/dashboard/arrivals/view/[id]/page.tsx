import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Ship, MapPin, Calendar, Users, FileText, 
  CheckCircle, XCircle, Clock, Anchor
} from 'lucide-react'
import { ArrivalActions } from '@/components/arrivals/arrival-actions'
import { DocumentUpload } from '@/components/documents/document-upload'
import { DocumentList } from '@/components/documents/document-list'
import { ZarpeIssue } from '@/components/zarpe/zarpe-issue'
import { ZarpeDisplay } from '@/components/zarpe/zarpe-display'
import { getZarpe } from '@/app/actions/zarpe'
import { ApproveAllDocumentsButton } from '@/components/approvals/approve-all-documents-button'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getArrival(id: string) {
  const result = await sql`
    SELECT a.*, u.name as agent_name, u.email as agent_email, u.company_name as agent_company
    FROM arrivals a
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.id = ${id}
  `
  return result[0] || null
}

async function getDocuments(arrivalId: string) {
  const docs = await sql`
    SELECT d.id, d.document_type, d.file_name, d.uploaded_at as created_at, u.name as uploaded_by_name
    FROM documents d
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE d.arrival_id = ${arrivalId}
    ORDER BY d.uploaded_at DESC
  `
  
  // Get approvals for each document
  const docIds = docs.map((d: any) => d.id)
  if (docIds.length === 0) return []
  
  const approvals = await sql`
    SELECT da.*, u.name as approver_name
    FROM document_approvals da
    LEFT JOIN users u ON da.approved_by = u.id
    WHERE da.document_id = ANY(${docIds})
    ORDER BY da.approved_at DESC
  `
  
  // Attach approvals to documents
  return docs.map((doc: any) => ({
    ...doc,
    approvals: approvals.filter((a: any) => a.document_id === doc.id)
  }))
}

async function getApprovals(arrivalId: string) {
  return sql`
    SELECT aa.*, u.name as approved_by_name, u.role as approver_role
    FROM arrival_approvals aa
    LEFT JOIN users u ON aa.approved_by = u.id
    WHERE aa.arrival_id = ${arrivalId}
    ORDER BY aa.approved_at DESC
  `
}

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  pending: { label: 'Borrador', bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock },
  submitted: { label: 'Enviado', bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
  approved_by_captain: { label: 'Aprobado', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  documents_complete: { label: 'Docs Completos', bg: 'bg-amber-100', text: 'text-amber-700', icon: FileText },
  ready_for_zarpe: { label: 'Listo para Zarpe', bg: 'bg-purple-100', text: 'text-purple-700', icon: CheckCircle },
  zarpe_approved: { label: 'Zarpe Aprobado', bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Anchor },
  completed: { label: 'Completado', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
}

const roleLabels: Record<string, string> = {
  capitan_puerto: 'Capitania de Puerto',
  aduanas: 'Aduanas',
  migracion: 'Migracion',
  salud: 'Sanidad',
  senassa: 'SENASA',
  admin: 'Administrador',
}

export default async function ArrivalDetailPage({ params }: PageProps) {
  const { id } = await params
  
  // Validate that ID is numeric - non-numeric IDs should be handled by other routes
  const numericId = parseInt(id, 10)
  if (isNaN(numericId) || numericId <= 0) {
    notFound()
  }
  
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const arrival = await getArrival(id)
  
  if (!arrival) {
    notFound()
  }

  const { user } = session
  const isOwner = arrival.created_by === user.id
  const isAuthority = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa', 'oficial_cim', 'admin'].includes(user.role)
  const canEdit = isOwner && arrival.status === 'pending'
  const canSubmit = isOwner && arrival.status === 'pending'
  const canDelete = isOwner && arrival.status === 'pending'
  const canApprove = isAuthority && ['submitted', 'approved_by_captain', 'documents_complete'].includes(arrival.status)
  // La naviera solicita el zarpe cuando el arribo está listo
  const canRequestZarpe = (isOwner || user.role === 'naviera') && arrival.status === 'ready_for_zarpe'
  const canIssueZarpe = (isOwner || user.role === 'naviera') && arrival.status === 'ready_for_zarpe'; // Declared canIssueZarpe

  const documents = await getDocuments(id)
  const approvals = await getApprovals(id)
  const zarpe = await getZarpe(id)

  const status = statusConfig[arrival.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{arrival.ship_name}</h1>
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${status.bg} ${status.text}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </span>
          </div>
          <p className="text-muted-foreground font-mono">OMI: {arrival.omi_number}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ArrivalActions
            arrivalId={id}
            canEdit={canEdit}
            canSubmit={canSubmit}
            canDelete={canDelete}
            canApprove={canApprove}
            userRole={user.role}
          />
          {canRequestZarpe && !zarpe && (
            <ZarpeIssue arrivalId={id} vesselName={arrival.ship_name} />
          )}
        </div>
      </div>

      {zarpe && (
        <ZarpeDisplay 
          zarpe={zarpe} 
          vesselName={arrival.ship_name} 
          omiNumber={arrival.omi_number}
          canApprove={['capitan_puerto', 'oficial_cim', 'admin'].includes(user.role)}
          userRole={user.role}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="w-5 h-5" />
                Informacion del Buque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Nombre</dt>
                  <dd className="font-medium">{arrival.ship_name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Numero OMI</dt>
                  <dd className="font-medium">{arrival.omi_number}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Bandera</dt>
                  <dd className="font-medium">{arrival.flag}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Tipo de Embarcacion</dt>
                  <dd className="font-medium">{arrival.vessel_type}</dd>
                </div>
                {arrival.call_sign && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Indicativo de Llamada</dt>
                    <dd className="font-medium">{arrival.call_sign}</dd>
                  </div>
                )}
                {arrival.gt && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Arqueo Bruto (GT)</dt>
                    <dd className="font-medium">{arrival.gt}</dd>
                  </div>
                )}
                {arrival.length && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Eslora</dt>
                    <dd className="font-medium">{arrival.length}</dd>
                  </div>
                )}
                {arrival.breadth && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Manga</dt>
                    <dd className="font-medium">{arrival.breadth}</dd>
                  </div>
                )}
                {arrival.voyage_number && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Numero de Viaje</dt>
                    <dd className="font-medium">{arrival.voyage_number}</dd>
                  </div>
                )}
                {(arrival.vessel_type === 'Contenedor' || arrival.vessel_type === 'Carga General' || arrival.vessel_type === 'Contenedor Frigorífico') && (
                  <>
                    {arrival.container_total !== null && arrival.container_total !== undefined && (
                      <div>
                        <dt className="text-sm text-muted-foreground">Total de Contenedores</dt>
                        <dd className="font-medium">{arrival.container_total}</dd>
                      </div>
                    )}
                    {arrival.container_loaded !== null && arrival.container_loaded !== undefined && (
                      <div>
                        <dt className="text-sm text-muted-foreground">Contenedores Cargados</dt>
                        <dd className="font-medium">{arrival.container_loaded}</dd>
                      </div>
                    )}
                    {arrival.container_empty !== null && arrival.container_empty !== undefined && (
                      <div>
                        <dt className="text-sm text-muted-foreground">Contenedores sin Carga</dt>
                        <dd className="font-medium">{arrival.container_empty}</dd>
                      </div>
                    )}
                  </>
                )}
                {arrival.vessel_type === 'Crucero' && (
                  <>
                    {arrival.passenger_total !== null && arrival.passenger_total !== undefined && (
                      <div>
                        <dt className="text-sm text-muted-foreground">Total de Pasajeros</dt>
                        <dd className="font-medium">{arrival.passenger_total}</dd>
                      </div>
                    )}
                    {arrival.passenger_disembark !== null && arrival.passenger_disembark !== undefined && (
                      <div>
                        <dt className="text-sm text-muted-foreground">Pasajeros Desembarcaron</dt>
                        <dd className="font-medium">{arrival.passenger_disembark}</dd>
                      </div>
                    )}
                    {arrival.passenger_onboard !== null && arrival.passenger_onboard !== undefined && (
                      <div>
                        <dt className="text-sm text-muted-foreground">Pasajeros no Desembarcaron</dt>
                        <dd className="font-medium">{arrival.passenger_onboard}</dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ruta y Fechas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                {arrival.last_port_name && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Ultimo Puerto</dt>
                    <dd className="font-medium">{arrival.last_port_name}{arrival.last_port_country && `, ${arrival.last_port_country}`}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-muted-foreground">Puerto de Arribo</dt>
                  <dd className="font-medium">{arrival.port_of_arrival}</dd>
                </div>
                {arrival.terminal && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Terminal de Arribo</dt>
                    <dd className="font-medium">{arrival.terminal}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-muted-foreground">Fecha Estimada de Arribo</dt>
                  <dd className="font-medium">
                    {new Date(arrival.estimated_arrival_date).toLocaleDateString('es-HN', {
                      dateStyle: 'long',
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Hora Estimada de Arribo</dt>
                  <dd className="font-medium">{arrival.estimated_arrival_time}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Informacion Adicional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Donacion</dt>
                  <dd className="font-medium">{arrival.is_donation ? 'Si' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Arribo Rapido</dt>
                  <dd className="font-medium">{arrival.is_fast_arrival ? 'Si' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Cambio de Tripulacion</dt>
                  <dd className="font-medium">{arrival.crew_change ? 'Si' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Necesita Ayuda</dt>
                  <dd className="font-medium">{arrival.needs_help ? 'Si' : 'No'}</dd>
                </div>
                {arrival.observation && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm text-muted-foreground">Observaciones</dt>
                    <dd className="font-medium mt-1">{arrival.observation}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentos
                </CardTitle>
                <CardDescription>
                  Documentos adjuntos a esta notificacion
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isAuthority && documents.length > 0 && (
                  <ApproveAllDocumentsButton pendingCount={documents.filter((d: any) => !d.approvals || d.approvals.length === 0).length} />
                )}
                {isOwner && (
                  <DocumentUpload arrivalId={id} />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <DocumentList documents={documents} userRole={user.role} arrivalId={parseInt(id, 10)} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agente Naviero</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-muted-foreground">Nombre</dt>
                  <dd className="font-medium">{arrival.agent_name || 'No disponible'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Email</dt>
                  <dd className="font-medium text-sm">{arrival.agent_email || 'No disponible'}</dd>
                </div>
                {arrival.agent_company && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Empresa</dt>
                    <dd className="font-medium">{arrival.agent_company}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Aprobaciones
              </CardTitle>
              <CardDescription>
                Estado de revision por autoridades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin aprobaciones aun
                </p>
              ) : (
                <div className="space-y-3">
                  {approvals.map((approval: any) => (
                    <div
                      key={approval.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        approval.approved ? 'bg-success/20' : 'bg-destructive/20'
                      }`}>
                        {approval.approved ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{roleLabels[approval.approver_role] || approval.approver_role}</p>
                        <p className="text-xs text-muted-foreground">{approval.approved_by_name}</p>
                        {approval.comments && (
                          <p className="text-sm mt-1">{approval.comments}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(approval.approved_at).toLocaleString('es-HN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registro</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Creado</dt>
                  <dd className="font-medium">
                    {new Date(arrival.created_at).toLocaleString('es-HN')}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Actualizado</dt>
                  <dd className="font-medium">
                    {new Date(arrival.updated_at).toLocaleString('es-HN')}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
