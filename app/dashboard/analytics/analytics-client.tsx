'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ship, FileText, Anchor, Users, Clock, Download, TableIcon } from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300']

interface AnalyticsData {
  arrivalsByMonth: any[]
  arrivalsByPort: any[]
  mostActivePort: any | null
  mostActiveAgent: any | null
  arrivalsByStatus: any[]
  topVesselTypes: any[]
  topFlags: any[]
  zarpeStats: any
  avgCrewPassengers: any
  stats: {
    totalArrivals: number
    pendingApprovals: number
    completedZarpes: number
    totalDocuments: number
    activeUsers: number
  }
  docCompliance: {
    total: number
    withDocs: number
  }
  arrivalsReport: any[]
}

interface Props {
  data: AnalyticsData
  userRole: string
  userPort: string | null
}

const portLabels: Record<string, string> = {
  puerto_cortes: 'Puerto Cortes',
  puerto_roatan: 'Puerto Roatan',
  puerto_san_lorenzo: 'Puerto San Lorenzo',
  puerto_castilla: 'Puerto Castilla',
  puerto_tela: 'Puerto Tela',
  puerto_ceiba: 'Puerto Ceiba',
  puerto_omoa: 'Puerto Omoa',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  approved_by_captain: 'Aprobado por Capitán',
  documents_complete: 'Docs Completos',
  ready_for_zarpe: 'Listo para Zarpe',
  zarpe_approved: 'Zarpe Aprobado',
  completed: 'Completado',
}

export default function AnalyticsClient({ data, userRole, userPort }: Props) {
  // Prepare chart data
  const portChartData = data.arrivalsByPort.map((item: any) => ({
    name: portLabels[item.port] || item.port,
    value: Number(item.count)
  }))

  const statusChartData = data.arrivalsByStatus.map((item: any) => ({
    name: statusLabels[item.status] || item.status,
    value: Number(item.count)
  }))

  const vesselTypesData = data.topVesselTypes.map((item: any) => ({
    name: item.type || 'Sin tipo',
    value: Number(item.count)
  }))

  const flagsData = data.topFlags.map((item: any) => ({
    name: item.flag,
    value: Number(item.count)
  }))

  const monthlyData = data.arrivalsByMonth.map((item: any) => ({
    month: item.month,
    arrivals: Number(item.count)
  }))

  const compliancePercent = data.docCompliance.total > 0 
    ? Math.round((data.docCompliance.withDocs / data.docCompliance.total) * 100) 
    : 0

  // CSV export for the arrivals report
  const exportToCSV = () => {
    const headers = ['No.', 'Buque', 'Bandera', 'IMO', 'Actividad', 'Agencia Nav', 'Arribo', 'N° Arribo', 'Puerto', 'Muelle/Terminal']
    const rows = data.arrivalsReport.map((row: any, idx: number) => [
      idx + 1,
      row.ship_name || '',
      row.flag || '',
      row.omi_number || '',
      row.vessel_type || '',
      row.agency_name || row.agent_name || '',
      row.estimated_arrival_date ? new Date(row.estimated_arrival_date).toLocaleDateString('es-HN') : '',
      row.id,
      portLabels[row.port_of_arrival] || row.port_of_arrival || '',
      row.terminal || '',
    ])
    const csvContent = [headers, ...rows]
      .map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `informe-arribos-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Estadisticas del Sistema</h1>
        <p className="text-muted-foreground">
          {userRole === 'capitan_puerto' && userPort
            ? `Datos de ${portLabels[userPort] || userPort}`
            : 'Vision general de todos los puertos'}
        </p>
      </div>

      {/* Summary Cards - Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puerto con Mas Actividad</CardTitle>
            <Anchor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.mostActivePort ? portLabels[data.mostActivePort.port] || data.mostActivePort.port : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.mostActivePort ? `${data.mostActivePort.count} arribos` : 'Sin datos'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Naviera con Mas Actividad</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {data.mostActiveAgent ? data.mostActiveAgent.name : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.mostActiveAgent ? `${data.mostActiveAgent.count} arribos` : 'Sin datos'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Tripulacion</CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.avgCrewPassengers.avg_crew ? Math.round(Number(data.avgCrewPassengers.avg_crew)) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Personas por buque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumplimiento de Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compliancePercent}%</div>
            <p className="text-xs text-muted-foreground">
              {data.docCompliance.withDocs} de {data.docCompliance.total} arrivals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 - Monthly Trend and Ports */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Arribos por Mes</CardTitle>
            <CardDescription>Tendencia de los ultimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="arrivals" 
                    stroke="#0088FE" 
                    strokeWidth={2}
                    dot={{ fill: '#0088FE' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arribos por Puerto</CardTitle>
            <CardDescription>Distribucion por puerto de destino</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0088FE" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - Status and Vessel Types */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Arribos</CardTitle>
            <CardDescription>Distribucion por estado actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Tipos de Buques</CardTitle>
            <CardDescription>Tipos de buques con mas arrivals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vesselTypesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#00C49F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 - Flags and Zarpes */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Banderas</CardTitle>
            <CardDescription>Paises de origen con mas buques</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flagsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#FFBB28" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estadisticas de Zarpes</CardTitle>
            <CardDescription>Estado de zarpes emitidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Zarpes Aprobados</span>
                </div>
                <span className="font-semibold">{Number(data.zarpeStats.approved)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Zarpes Pendientes</span>
                </div>
                <span className="font-semibold">{Number(data.zarpeStats.pending)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Total Zarpes</span>
                </div>
                <span className="font-semibold">{Number(data.zarpeStats.total)}</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Promedio Pasajeros</span>
                  </div>
                  <span className="font-semibold">
                    {data.avgCrewPassengers.avg_passengers 
                      ? Math.round(Number(data.avgCrewPassengers.avg_passengers)) 
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Arribos</CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalArrivals}</div>
            <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Esperando aprobacion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zarpes Emitidos</CardTitle>
            <Anchor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.completedZarpes}</div>
            <p className="text-xs text-muted-foreground">Aprobados y firmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">Total procesados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Navieras Activas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Ultimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Arrivals Report Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <TableIcon className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Informe de Arribos</CardTitle>
                <CardDescription>
                  Listado detallado de todos los buques registrados
                  {data.arrivalsReport.length >= 200 ? ' (últimos 200 registros)' : ` — ${data.arrivalsReport.length} registro${data.arrivalsReport.length !== 1 ? 's' : ''}`}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2 shrink-0"
              disabled={data.arrivalsReport.length === 0}
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {['No.', 'Buque', 'Bandera', 'IMO', 'Actividad', 'Agencia Nav', 'Arribo', 'N° Arribo', 'Puerto', 'Muelle/Terminal'].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.arrivalsReport.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                      No hay registros de arribos disponibles.
                    </td>
                  </tr>
                ) : (
                  data.arrivalsReport.map((row: any, idx: number) => (
                    <tr
                      key={row.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-muted-foreground tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap max-w-[180px] truncate" title={row.ship_name}>
                        {row.ship_name || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.flag || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{row.omi_number || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {row.vessel_type || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[220px] truncate" title={row.agency_name || row.agent_name}>
                        {row.agency_name || row.agent_name || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                        {row.estimated_arrival_date
                          ? new Date(row.estimated_arrival_date).toLocaleDateString('es-HN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-center">{row.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {portLabels[row.port_of_arrival] || row.port_of_arrival || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.terminal || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

