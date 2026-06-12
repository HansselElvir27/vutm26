import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ zarpeNumber: string }> }
) {
  const { zarpeNumber } = await params
  const decoded = decodeURIComponent(zarpeNumber).trim()

  try {
    const result = await sql`
      SELECT z.zarpe_number, z.status, z.approved_at, z.created_at,
        z.captain_name, z.departure_date,
        a.ship_name, a.omi_number, a.flag as vessel_flag,
        a.port_of_arrival, a.voyage_number,
        u.name as approved_by_name
      FROM zarpes z
      LEFT JOIN arrivals a ON z.arrival_id = a.id
      LEFT JOIN users u ON z.approved_by = u.id
      WHERE z.zarpe_number = ${decoded}
    `

    if (result.length === 0) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({ found: true, zarpe: result[0] })
  } catch (error) {
    console.log("[v0] Verificar API error:", error)
    return NextResponse.json({ found: false, error: 'Error de servidor' }, { status: 500 })
  }
}
