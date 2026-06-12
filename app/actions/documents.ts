'use server'

import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { canRoleApproveDocument } from '@/lib/document-permissions'

const authorityRoles = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa', 'admin']

export async function approveDocument(documentId: number, arrivalId: number, comments?: string) {
  const session = await getSession()
  
  if (!session) {
    return { error: 'No autorizado' }
  }

  if (!authorityRoles.includes(session.user.role)) {
    return { error: 'No tiene permisos para aprobar documentos' }
  }

  // Get the document to check its type
  const document = await sql`
    SELECT * FROM documents WHERE id = ${documentId}
  `

  if (document.length === 0) {
    return { error: 'Documento no encontrado' }
  }

  // Check if this role can approve this document type
  if (!canRoleApproveDocument(session.user.role, document[0].document_type)) {
    return { error: 'No tiene permisos para aprobar este tipo de documento' }
  }

  // Check if already approved by this role
  const existingApproval = await sql`
    SELECT * FROM document_approvals 
    WHERE document_id = ${documentId} 
    AND approver_role = ${session.user.role}
  `

  if (existingApproval.length > 0) {
    return { error: 'Ya aprobo este documento anteriormente' }
  }

  try {
    await sql`
      INSERT INTO document_approvals (document_id, approved_by, approver_role, approved, comments)
      VALUES (${documentId}, ${session.user.id}, ${session.user.role}, true, ${comments || null})
    `

    revalidatePath(`/dashboard/arrivals/view/${arrivalId}`)
    return { success: true }
  } catch (error) {
    console.error('Error approving document:', error)
    return { error: 'Error al aprobar el documento' }
  }
}

export async function rejectDocument(documentId: number, arrivalId: number, comments: string) {
  const session = await getSession()
  
  if (!session) {
    return { error: 'No autorizado' }
  }

  if (!authorityRoles.includes(session.user.role)) {
    return { error: 'No tiene permisos para rechazar documentos' }
  }

  if (!comments || comments.trim() === '') {
    return { error: 'Debe proporcionar un motivo para el rechazo' }
  }

  // Get the document to check its type
  const document = await sql`
    SELECT * FROM documents WHERE id = ${documentId}
  `

  if (document.length === 0) {
    return { error: 'Documento no encontrado' }
  }

  // Check if this role can reject this document type
  if (!canRoleApproveDocument(session.user.role, document[0].document_type)) {
    return { error: 'No tiene permisos para rechazar este tipo de documento' }
  }

  // Check if already reviewed by this role
  const existingApproval = await sql`
    SELECT * FROM document_approvals 
    WHERE document_id = ${documentId} 
    AND approver_role = ${session.user.role}
  `

  if (existingApproval.length > 0) {
    return { error: 'Ya reviso este documento anteriormente' }
  }

  try {
    await sql`
      INSERT INTO document_approvals (document_id, approved_by, approver_role, approved, comments)
      VALUES (${documentId}, ${session.user.id}, ${session.user.role}, false, ${comments})
    `

    revalidatePath(`/dashboard/arrivals/view/${arrivalId}`)
    return { success: true }
  } catch (error) {
    console.error('Error rejecting document:', error)
    return { error: 'Error al rechazar el documento' }
  }
}

export async function getDocumentApprovals(documentId: number) {
  const approvals = await sql`
    SELECT da.*, u.name as approver_name
    FROM document_approvals da
    LEFT JOIN users u ON da.approved_by = u.id
    WHERE da.document_id = ${documentId}
    ORDER BY da.approved_at DESC
  `
  return approvals
}
