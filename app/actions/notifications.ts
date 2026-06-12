'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type NotificationType = 
  | 'arrival_approved'
  | 'arrival_rejected'
  | 'document_rejected'
  | 'zarpe_issued'
  | 'new_arrival'
  | 'ready_for_zarpe'
  | 'cim_pre_approved'

export interface Notification {
  id: number
  user_id: number
  type: NotificationType
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export async function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    await sql`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (${userId}, ${type}, ${title}, ${message}, ${link || null})
    `
    return { success: true }
  } catch (error) {
    console.error('[Notifications] Error creating notification:', error)
    return { error: 'Failed to create notification' }
  }
}

export async function getNotifications(userId: number, limit: number = 10): Promise<Notification[]> {
  try {
    const result = await sql`
      SELECT id, user_id, type, title, message, link, is_read, created_at
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result as Notification[]
  } catch (error) {
    console.error('[Notifications] Error fetching notifications:', error)
    return []
  }
}

export async function getUnreadCount(userId: number): Promise<number> {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ${userId} AND is_read = FALSE
    `
    return Number(result[0]?.count || 0)
  } catch (error) {
    console.error('[Notifications] Error counting unread:', error)
    return 0
  }
}

export async function markAsRead(notificationId: number, userId: number) {
  try {
    await sql`
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = ${notificationId} AND user_id = ${userId}
    `
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('[Notifications] Error marking as read:', error)
    return { error: 'Failed to mark notification as read' }
  }
}

export async function markAllAsRead(userId: number) {
  try {
    await sql`
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = ${userId} AND is_read = FALSE
    `
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('[Notifications] Error marking all as read:', error)
    return { error: 'Failed to mark all as read' }
  }
}

// Helper functions to create specific notification types
export async function notifyArrivalApproved(arrivalId: number, arrivalNumber: string, shipName: string, agentId: number) {
  return createNotification(
    agentId,
    'arrival_approved',
    'Arribo Aprobado',
    `Su arrival ${arrivalNumber} - ${shipName} ha sido aprobado por la autoridad.`,
    `/dashboard/arrivals/view/${arrivalId}`
  )
}

export async function notifyArrivalRejected(arrivalId: number, arrivalNumber: string, shipName: string, agentId: number, reason?: string) {
  return createNotification(
    agentId,
    'arrival_rejected',
    'Arribo Rechazado',
    `Su arrival ${arrivalNumber} - ${shipName} ha sido rechazado.${reason ? ` Razón: ${reason}` : ''}`,
    `/dashboard/arrivals/view/${arrivalId}`
  )
}

export async function notifyDocumentRejected(arrivalId: number, documentName: string, shipName: string, agentId: number, reason?: string) {
  return createNotification(
    agentId,
    'document_rejected',
    'Documento Rechazado',
    `El documento "${documentName}" del buque ${shipName} ha sido rechazado.${reason ? ` Razón: ${reason}` : ''}`,
    `/dashboard/arrivals/view/${arrivalId}`
  )
}

export async function notifyZarpeIssued(arrivalId: number, zarpeNumber: string, shipName: string, agentId: number) {
  return createNotification(
    agentId,
    'zarpe_issued',
    'ZARPE Emitido',
    `Se ha emitido el ZARPE No. ${zarpeNumber} para el buque ${shipName}.`,
    `/dashboard/arrivals/view/${arrivalId}`
  )
}

export async function notifyNewArrivalForAuthority(
  arrivalId: number,
  arrivalNumber: string,
  shipName: string,
  port: string,
  authorityUserId: number
) {
  return createNotification(
    authorityUserId,
    'new_arrival',
    'Nuevo Arribo para Revisión',
    `Se ha recibido un nuevo arrival ${arrivalNumber} - ${shipName} en el puerto ${port} para su revisión.`,
    `/dashboard/arrivals/view/${arrivalId}`
  )
}

// Notify when arrival is ready for ZARPE - sends to both Naviera and CIM
export async function notifyReadyForZarpe(
  arrivalId: number,
  arrivalNumber: string,
  shipName: string,
  navieraId: number,
  cimUserId: number
) {
  const results = []

  // Notify Naviera (shipping agent)
  results.push(
    createNotification(
      navieraId,
      'ready_for_zarpe',
      'Listo para ZARPE',
      `Su arrival ${arrivalNumber} - ${shipName} está listo para solicitar ZARPE.`,
      `/dashboard/arrivals/view/${arrivalId}`
    )
  )

  // Notify CIM official
  results.push(
    createNotification(
      cimUserId,
      'ready_for_zarpe',
      'Arribo Listo para ZARPE',
      `El arrival ${arrivalNumber} - ${shipName} ha sido aprobado por todas las autoridades y está listo para ZARPE.`,
      `/dashboard/arrivals/view/${arrivalId}`
    )
  )

  return results
}

// Notify Captain when CIM has pre-approved the arrival
export async function notifyCIMPreApproved(
  arrivalId: number,
  arrivalNumber: string,
  shipName: string,
  captainUserId: number,
  cimUserId: number,
  cimUserName: string
) {
  return createNotification(
    captainUserId,
    'cim_pre_approved',
    'Pre-aprobación CIM',
    `El oficial CIM ${cimUserName} ha pre-aprobado el arrival ${arrivalNumber} - ${shipName}. Puede proceder con la aprobación final del ZARPE.`,
    `/dashboard/arrivals/view/${arrivalId}`
  )
}

