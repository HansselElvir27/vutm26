'use server'

import { revalidatePath } from 'next/cache'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { 
  notifyArrivalApproved, 
  notifyArrivalRejected, 
  notifyDocumentRejected,
  notifyNewArrivalForAuthority,
  notifyReadyForZarpe 
} from './notifications'

export async function approveArrival(arrivalId: string, comments?: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  const allowedRoles = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa', 'oficial_cim', 'admin']
  if (!allowedRoles.includes(session.user.role)) {
    return { error: 'No tiene permiso para aprobar arribos' }
  }

  const arrival = await sql`
    SELECT * FROM arrivals WHERE id = ${arrivalId}
  `

  if (arrival.length === 0) {
    return { error: 'Arribo no encontrado' }
  }

  if (!['submitted', 'approved_by_captain', 'documents_complete'].includes(arrival[0].status)) {
    return { error: 'Este arribo no puede ser aprobado en su estado actual' }
  }

  // Check if this authority already approved
  const existingApproval = await sql`
    SELECT * FROM arrival_approvals 
    WHERE arrival_id = ${arrivalId} 
    AND approver_role = ${session.user.role}
  `

  if (existingApproval.length > 0) {
    return { error: 'Ya aprobo este arribo anteriormente' }
  }

  // Create approval record
  await sql`
    INSERT INTO arrival_approvals (arrival_id, approver_role, approved_by, approved, comments)
    VALUES (${arrivalId}, ${session.user.role}, ${session.user.id}, true, ${comments || null})
  `

  // Update arrival status to approved_by_captain if captain approves
  if (arrival[0].status === 'submitted' && session.user.role === 'capitan_puerto') {
    await sql`
      UPDATE arrivals SET status = 'approved_by_captain', updated_at = NOW()
      WHERE id = ${arrivalId}
    `
  }

  // Check if all required approvals are complete
  const requiredAuthorities = ['capitan_puerto', 'aduanas', 'migracion', 'salud']
  const approvals = await sql`
    SELECT approver_role FROM arrival_approvals 
    WHERE arrival_id = ${arrivalId} AND approved = true
  `

  const approvedAuthorities = approvals.map((a: any) => a.approver_role)
  const allApproved = requiredAuthorities.every(auth => approvedAuthorities.includes(auth))

  if (allApproved) {
    await sql`
      UPDATE arrivals SET status = 'ready_for_zarpe', updated_at = NOW()
      WHERE id = ${arrivalId}
    `
    
    // Notify Naviera and CIM that arrival is ready for ZARPE
    // Get CIM user for the port
    const cimUser = await sql`
      SELECT id FROM users 
      WHERE role = 'oficial_cim'
      AND (assigned_port = ${arrival[0].port_of_arrival} OR assigned_port IS NULL)
      LIMIT 1
    `
    
    if (cimUser.length > 0) {
      await notifyReadyForZarpe(
        Number(arrivalId),
        `#${arrivalId}`,
        arrival[0].ship_name || 'Unknown',
        Number(arrival[0].created_by),
        cimUser[0].id
      )
    } else {
      // If no CIM user found for port, just notify naviera
      await notifyReadyForZarpe(
        Number(arrivalId),
        `#${arrivalId}`,
        arrival[0].ship_name || 'Unknown',
        Number(arrival[0].created_by),
        0 // No CIM user
      )
    }
  }

  // Notify agent that arrival was approved
  const arrivalData = arrival[0]
  await notifyArrivalApproved(
    Number(arrivalId),
    `#${arrivalId}`,
    arrivalData.ship_name || 'Unknown',
    Number(arrivalData.created_by)
  )

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/arrivals')
  revalidatePath('/dashboard/approvals')
  revalidatePath(`/dashboard/arrivals/view/${arrivalId}`)

  return { success: true }
}

export async function rejectArrival(arrivalId: string, comments: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  const allowedRoles = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa', 'oficial_cim', 'admin']
  if (!allowedRoles.includes(session.user.role)) {
    return { error: 'No tiene permiso para rechazar arribos' }
  }

  const arrival = await sql`
    SELECT * FROM arrivals WHERE id = ${arrivalId}
  `

  if (arrival.length === 0) {
    return { error: 'Arribo no encontrado' }
  }

  // Create rejection record
  await sql`
    INSERT INTO arrival_approvals (arrival_id, approver_role, approved_by, approved, comments)
    VALUES (${arrivalId}, ${session.user.role}, ${session.user.id}, false, ${comments || null})
  `

  // Rejected arrivals go back to pending for correction
  await sql`
    UPDATE arrivals SET status = 'pending', updated_at = NOW()
    WHERE id = ${arrivalId}
  `

  // Notify agent that arrival was rejected
  const arrivalData = arrival[0]
  await notifyArrivalRejected(
    Number(arrivalId),
    arrivalData.arrival_number || `#${arrivalId}`,
    arrivalData.ship_name || 'Unknown',
    Number(arrivalData.created_by),
    comments
  )

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/arrivals')
  revalidatePath('/dashboard/approvals')
  revalidatePath(`/dashboard/arrivals/view/${arrivalId}`)

  return { success: true }
}

export async function approveDocument(documentId: string, comments?: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  const allowedRoles = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa', 'oficial_cim', 'admin']
  if (!allowedRoles.includes(session.user.role)) {
    return { error: 'No tiene permiso para aprobar documentos' }
  }

  // Check if already approved by this user
  const existing = await sql`
    SELECT * FROM document_approvals WHERE document_id = ${documentId} AND approved_by = ${session.user.id}
  `
  if (existing.length > 0) {
    return { error: 'Ya aprobo este documento' }
  }

  await sql`
    INSERT INTO document_approvals (document_id, approved_by, approved, approver_role, comments)
    VALUES (${documentId}, ${session.user.id}, true, ${session.user.role}, ${comments || null})
  `

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/documents')
  revalidatePath('/dashboard/approvals')

  return { success: true }
}

export async function approveAllDocuments(comments?: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  const allowedRoles = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa', 'oficial_cim', 'admin']
  if (!allowedRoles.includes(session.user.role)) {
    return { error: 'No tiene permiso para aprobar documentos' }
  }

  // Get all documents not yet approved by this user
  const pendingDocs = await sql`
    SELECT d.id FROM documents d
    WHERE d.id NOT IN (
      SELECT document_id FROM document_approvals WHERE approved_by = ${session.user.id}
    )
  `

  if (pendingDocs.length === 0) {
    return { message: 'No hay documentos pendientes para aprobar', success: true }
  }

  for (const doc of pendingDocs) {
    await sql`
      INSERT INTO document_approvals (document_id, approved_by, approved, approver_role, comments)
      VALUES (${doc.id}, ${session.user.id}, true, ${session.user.role}, ${comments || null})
    `
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/documents')
  revalidatePath('/dashboard/approvals')

  return { success: true, approved: pendingDocs.length }
}

export async function rejectDocument(documentId: string, comments: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  const allowedRoles = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa', 'oficial_cim', 'admin']
  if (!allowedRoles.includes(session.user.role)) {
    return { error: 'No tiene permiso para rechazar documentos' }
  }

  // Get document info for notification
  const document = await sql`
    SELECT d.*, a.ship_name, a.created_by as agent_id, a.id as arrival_id
    FROM documents d
    JOIN arrivals a ON d.arrival_id = a.id
    WHERE d.id = ${documentId}
  `

  await sql`
    INSERT INTO document_approvals (document_id, approved_by, approved, approver_role, comments)
    VALUES (${documentId}, ${session.user.id}, false, ${session.user.role}, ${comments || null})
  `

  // Notify agent that document was rejected
  if (document.length > 0) {
    const doc = document[0]
    await notifyDocumentRejected(
      Number(doc.arrival_id),
      doc.file_name || 'Documento',
      doc.ship_name || 'Unknown',
      Number(doc.agent_id),
      comments
    )
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/documents')
  revalidatePath('/dashboard/approvals')

  return { success: true }
}
