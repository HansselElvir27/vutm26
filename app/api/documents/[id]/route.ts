import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params

  try {
    const result = await sql`
      SELECT 
        d.file_name,
        d.file_data,
        d.mime_type,
        d.arrival_id,
        a.created_by,
        a.port_of_arrival
      FROM documents d
      JOIN arrivals a ON d.arrival_id = a.id
      WHERE d.id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    const doc = result[0]

    // Check authorization - user must be owner, authority for the port, or admin
    const isOwner = doc.created_by === session.user.id
    const isAdmin = session.user.role === 'admin'
    const isAuthorityForPort = session.user.assigned_port === doc.port_of_arrival
    const isNaviera = session.user.role === 'naviera'

    if (!isOwner && !isAdmin && !isAuthorityForPort && !isNaviera) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (!doc.file_data) {
      return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 })
    }

    // Check if download is requested
    const { searchParams } = new URL(request.url)
    const isDownload = searchParams.get('download') === 'true'

    // Decode base64 to buffer
    const fileBuffer = Buffer.from(doc.file_data, 'base64')
    
    // Return file with appropriate headers
    const disposition = isDownload ? 'attachment' : 'inline'
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': doc.mime_type || 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${doc.file_name}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: 'Error al obtener el documento' }, { status: 500 })
  }
}
