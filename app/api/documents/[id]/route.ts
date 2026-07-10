import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'
import fs from 'fs/promises'

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
        d.file_url,
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

    // Check if download is requested
    const { searchParams } = new URL(request.url)
    const isDownload = searchParams.get('download') === 'true'

    // Load file buffer from disk if path exists, otherwise fall back to DB base64 data
    let fileBuffer: Buffer

    if (doc.file_url) {
      try {
        fileBuffer = await fs.readFile(doc.file_url)
      } catch (err) {
        console.warn(`File not found at file_url: ${doc.file_url}, checking file_data fallback...`, err)
        if (doc.file_data) {
          fileBuffer = Buffer.from(doc.file_data, 'base64')
        } else {
          return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 })
        }
      }
    } else if (doc.file_data) {
      fileBuffer = Buffer.from(doc.file_data, 'base64')
    } else {
      return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 })
    }
    
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
