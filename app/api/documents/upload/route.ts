import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('document_type') as string
    const arrivalId = formData.get('arrival_id') as string

    if (!file || !documentType || !arrivalId) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    // Verify arrival exists and user has access
    const arrival = await sql`
      SELECT * FROM arrivals WHERE id = ${arrivalId}
    `

    if (arrival.length === 0) {
      return NextResponse.json({ error: 'Arribo no encontrado' }, { status: 404 })
    }

    const isOwner = arrival[0].created_by === session.user.id
    const isAuthority = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa', 'admin'].includes(session.user.role)

    if (!isOwner && !isAuthority) {
      return NextResponse.json({ error: 'No tiene permiso para subir documentos a este arribo' }, { status: 403 })
    }

    // Convert file to base64 for storage
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileBase64 = fileBuffer.toString('base64')

    // Insert document with file data
    const result = await sql`
      INSERT INTO documents (arrival_id, document_type, file_name, file_data, file_size, mime_type, uploaded_by)
      VALUES (${arrivalId}, ${documentType}, ${file.name}, ${fileBase64}, ${file.size}, ${file.type || 'application/pdf'}, ${session.user.id})
      RETURNING id
    `

    return NextResponse.json({ 
      success: true, 
      document: {
        id: result[0].id,
        file_name: file.name,
        document_type: documentType,
      }
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: 'Error al subir documento' }, { status: 500 })
  }
}
