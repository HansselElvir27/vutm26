import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'
import AnalyticsClient from './analytics-client'

async function getAnalyticsData(userPort: string | null, userRole: string) {
  // Get arrivals by month (last 6 months)
  const arrivalsByMonth = await sql`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
      DATE_TRUNC('month', created_at) as month_date,
      COUNT(*) as count
    FROM arrivals
    ${userRole === 'capitan_puerto' && userPort ? sql`WHERE port_of_arrival = ${userPort}` : sql``}
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month_date DESC
    LIMIT 6
  `

  // Get arrivals by port
  const arrivalsByPort = await sql`
    SELECT port_of_arrival as port, COUNT(*) as count
    FROM arrivals
    ${userRole === 'capitan_puerto' && userPort ? sql`WHERE port_of_arrival = ${userPort}` : sql``}
    GROUP BY port_of_arrival
    ORDER BY count DESC
  `

  // Get most active port
  const mostActivePort = await sql`
    SELECT port_of_arrival as port, COUNT(*) as count
    FROM arrivals
    ${userRole === 'capitan_puerto' && userPort ? sql`WHERE port_of_arrival = ${userPort}` : sql``}
    GROUP BY port_of_arrival
    ORDER BY count DESC
    LIMIT 1
  `

  // Get most active shipping agent (naviera)
  const mostActiveAgent = await sql`
    SELECT u.name, u.company_name, COUNT(a.id) as count
    FROM arrivals a
    JOIN users u ON a.created_by = u.id
    WHERE u.role = 'naviera'
    ${userRole === 'capitan_puerto' && userPort ? sql`AND a.port_of_arrival = ${userPort}` : sql``}
    GROUP BY u.id, u.name, u.company_name
    ORDER BY count DESC
    LIMIT 1
  `

  // Get arrivals by status
  const arrivalsByStatus = await sql`
    SELECT status, COUNT(*) as count
    FROM arrivals
    ${userRole === 'capitan_puerto' && userPort ? sql`WHERE port_of_arrival = ${userPort}` : sql``}
    GROUP BY status
  `

  // Get top vessel types
  const topVesselTypes = await sql`
    SELECT vessel_type as type, COUNT(*) as count
    FROM arrivals
    ${userRole === 'capitan_puerto' && userPort ? sql`WHERE port_of_arrival = ${userPort}` : sql``}
    GROUP BY vessel_type
    ORDER BY count DESC
    LIMIT 5
  `

  // Get top flags
  const topFlags = await sql`
    SELECT flag, COUNT(*) as count
    FROM arrivals
    WHERE flag IS NOT NULL AND flag != ''
    ${userRole === 'capitan_puerto' && userPort ? sql`AND port_of_arrival = ${userPort}` : sql``}
    GROUP BY flag
    ORDER BY count DESC
    LIMIT 5
  `

  // Get zarpe statistics
  const zarpeStats = await sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN z.status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN z.status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM zarpes z
    JOIN arrivals a ON z.arrival_id = a.id
    ${userRole === 'capitan_puerto' && userPort ? sql`WHERE a.port_of_arrival = ${userPort}` : sql``}
  `

  // Get average crew and passengers
  const avgCrewPassengers = await sql`
    SELECT 
      AVG(crew_count) as avg_crew,
      AVG(passenger_count) as avg_passengers
    FROM zarpes z
    JOIN arrivals a ON z.arrival_id = a.id
    ${userRole === 'capitan_puerto' && userPort ? sql`WHERE a.port_of_arrival = ${userPort}` : sql``}
  `

  // Get summary stats
  const totalArrivals = await sql`
    SELECT COUNT(*) as count FROM arrivals
    ${userRole === 'capitan_puerto' && userPort ? sql`WHERE port_of_arrival = ${userPort}` : sql``}
  `

  const pendingApprovals = await sql`
    SELECT COUNT(*) as count FROM arrivals 
    WHERE status IN ('pending', 'approved_by_captain', 'documents_complete')
    ${userRole === 'capitan_puerto' && userPort ? sql`AND port_of_arrival = ${userPort}` : sql``}
  `

  const completedZarpes = await sql`
    SELECT COUNT(*) as count FROM zarpes z
    JOIN arrivals a ON z.arrival_id = a.id
    WHERE z.status = 'approved'
    ${userRole === 'capitan_puerto' && userPort ? sql`AND a.port_of_arrival = ${userPort}` : sql``}
  `

  const totalDocuments = await sql`
    SELECT COUNT(*) as count FROM documents d
    JOIN arrivals a ON d.arrival_id = a.id
    ${userRole === 'capitan_puerto' && userPort ? sql`WHERE a.port_of_arrival = ${userPort}` : sql``}
  `

  const activeUsers = await sql`
    SELECT COUNT(DISTINCT created_by) as count FROM arrivals
    WHERE created_at > NOW() - INTERVAL '30 days'
    ${userRole === 'capitan_puerto' && userPort ? sql`AND port_of_arrival = ${userPort}` : sql``}
  `

  // Calculate document compliance (arrivals with all required docs)
  const docCompliance = await sql`
    SELECT 
      COUNT(DISTINCT a.id) as total_arrivals,
      COUNT(DISTINCT CASE WHEN doc_count >= 2 THEN a.id END) as with_docs
    FROM arrivals a
    LEFT JOIN (
      SELECT arrival_id, COUNT(*) as doc_count 
      FROM documents 
      WHERE document_type IN ('noa', 'fal1')
      GROUP BY arrival_id
    ) d ON a.id = d.arrival_id
    ${userRole === 'capitan_puerto' && userPort ? sql`WHERE a.port_of_arrival = ${userPort}` : sql``}
  `

  return {
    arrivalsByMonth: arrivalsByMonth.reverse(),
    arrivalsByPort,
    mostActivePort: mostActivePort[0] || null,
    mostActiveAgent: mostActiveAgent[0] || null,
    arrivalsByStatus,
    topVesselTypes,
    topFlags,
    zarpeStats: zarpeStats[0] || { total: 0, approved: 0, pending: 0 },
    avgCrewPassengers: avgCrewPassengers[0] || { avg_crew: 0, avg_passengers: 0 },
    stats: {
      totalArrivals: Number(totalArrivals[0]?.count || 0),
      pendingApprovals: Number(pendingApprovals[0]?.count || 0),
      completedZarpes: Number(completedZarpes[0]?.count || 0),
      totalDocuments: Number(totalDocuments[0]?.count || 0),
      activeUsers: Number(activeUsers[0]?.count || 0),
    },
    docCompliance: {
      total: Number(docCompliance[0]?.total_arrivals || 0),
      withDocs: Number(docCompliance[0]?.with_docs || 0),
    }
  }
}

export default async function AnalyticsPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Only admin and capitan_puerto can access analytics
  if (!['admin', 'capitan_puerto'].includes(session.user.role)) {
    redirect('/dashboard')
  }

  const data = await getAnalyticsData(session.user.assigned_port, session.user.role)

  return <AnalyticsClient data={data} userRole={session.user.role} userPort={session.user.assigned_port} />
}

