'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notifyNewArrivalForAuthority } from './notifications'

export async function createArrival(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  if (session.user.role !== 'naviera' && session.user.role !== 'admin') {
    return { error: 'Solo los agentes navieros pueden crear arribos' }
  }

  const shipName = formData.get('ship_name') as string
  const omiNumber = formData.get('omi_number') as string
  const flag = formData.get('flag') as string
  const vesselType = formData.get('vessel_type') as string
  const callSign = formData.get('call_sign') as string
  const gt = formData.get('gt') as string
  const length = formData.get('length') as string
  const breadth = formData.get('breadth') as string
  const voyageNumber = formData.get('voyage_number') as string
  const lastPortName = formData.get('last_port_name') as string
  const lastPortCountry = formData.get('last_port_country') as string
  const portOfArrival = formData.get('port_of_arrival') as string
  const estimatedArrivalDate = formData.get('estimated_arrival_date') as string
  const estimatedArrivalTime = formData.get('estimated_arrival_time') as string
  const isDonation = formData.get('is_donation') === 'true'
  const isFastArrival = formData.get('is_fast_arrival') === 'true'
  const crewChange = formData.get('crew_change') === 'true'
  const needsHelp = formData.get('needs_help') === 'true'
  const observation = formData.get('observation') as string
  
  // Get document files
  const noaDocument = formData.get('noa_document') as File | null
  const fal1Document = formData.get('fal1_document') as File | null

  if (!shipName || !omiNumber || !portOfArrival || !estimatedArrivalDate) {
    return { error: 'Campos requeridos faltantes: nombre del buque, numero OMI, puerto de arribo y fecha estimada' }
  }

  // Validate required documents
  if (!noaDocument || noaDocument.size === 0) {
    return { error: 'Debe adjuntar el documento NOA (Notificacion de Arribo)' }
  }
  
  if (!fal1Document || fal1Document.size === 0) {
    return { error: 'Debe adjuntar el documento FAL1 (Declaracion General)' }
  }

  let arrivalId: number

  try {
    const result = await sql`
      INSERT INTO arrivals (
        ship_name, omi_number, flag, vessel_type, call_sign, gt, length, breadth,
        voyage_number, last_port_name, last_port_country, port_of_arrival,
        estimated_arrival_date, estimated_arrival_time, is_donation, is_fast_arrival,
        crew_change, needs_help, observation, created_by, status
      ) VALUES (
        ${shipName}, ${omiNumber}, ${flag || null}, ${vesselType || null},
        ${callSign || null}, ${gt || null}, ${length || null}, ${breadth || null},
        ${voyageNumber || null}, ${lastPortName || null}, ${lastPortCountry || null},
        ${portOfArrival}, ${estimatedArrivalDate}, ${estimatedArrivalTime || null},
        ${isDonation}, ${isFastArrival}, ${crewChange}, ${needsHelp},
        ${observation || null}, ${session.user.id}, 'pending'
      )
      RETURNING id
    `

    arrivalId = result[0].id
    
    // Save NOA document
    const noaBuffer = Buffer.from(await noaDocument.arrayBuffer())
    const noaBase64 = noaBuffer.toString('base64')
    
    await sql`
      INSERT INTO documents (arrival_id, document_type, file_name, file_data, file_size, mime_type, uploaded_by)
      VALUES (
        ${arrivalId}, 
        'NOA', 
        ${noaDocument.name}, 
        ${noaBase64}, 
        ${noaDocument.size}, 
        ${noaDocument.type || 'application/pdf'},
        ${session.user.id}
      )
    `
    
    // Save FAL1 document
    const fal1Buffer = Buffer.from(await fal1Document.arrayBuffer())
    const fal1Base64 = fal1Buffer.toString('base64')
    
    await sql`
      INSERT INTO documents (arrival_id, document_type, file_name, file_data, file_size, mime_type, uploaded_by)
      VALUES (
        ${arrivalId}, 
        'FAL1', 
        ${fal1Document.name}, 
        ${fal1Base64}, 
        ${fal1Document.size}, 
        ${fal1Document.type || 'application/pdf'},
        ${session.user.id}
      )
    `
  } catch (error) {
    console.error('Error creating arrival:', error)
    return { error: 'Error al crear el arribo' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/arrivals')
  redirect(`/dashboard/arrivals/view/${arrivalId}`)
}

export async function updateArrival(arrivalId: string, formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  const arrival = await sql`
    SELECT * FROM arrivals WHERE id = ${arrivalId}
  `

  if (arrival.length === 0) {
    return { error: 'Arribo no encontrado' }
  }

  if (session.user.role === 'naviera' && arrival[0].created_by !== session.user.id) {
    return { error: 'No tiene permiso para editar este arribo' }
  }

  if (arrival[0].status !== 'pending' && session.user.role !== 'admin') {
    return { error: 'Este arribo ya no puede ser editado' }
  }

  const shipName = formData.get('ship_name') as string
  const omiNumber = formData.get('omi_number') as string
  const flag = formData.get('flag') as string
  const vesselType = formData.get('vessel_type') as string
  const callSign = formData.get('call_sign') as string
  const gt = formData.get('gt') as string
  const length = formData.get('length') as string
  const breadth = formData.get('breadth') as string
  const voyageNumber = formData.get('voyage_number') as string
  const lastPortName = formData.get('last_port_name') as string
  const lastPortCountry = formData.get('last_port_country') as string
  const portOfArrival = formData.get('port_of_arrival') as string
  const estimatedArrivalDate = formData.get('estimated_arrival_date') as string
  const estimatedArrivalTime = formData.get('estimated_arrival_time') as string
  const isDonation = formData.get('is_donation') === 'true'
  const isFastArrival = formData.get('is_fast_arrival') === 'true'
  const crewChange = formData.get('crew_change') === 'true'
  const needsHelp = formData.get('needs_help') === 'true'
  const observation = formData.get('observation') as string

  await sql`
    UPDATE arrivals SET
      ship_name = ${shipName},
      omi_number = ${omiNumber},
      flag = ${flag || null},
      vessel_type = ${vesselType || null},
      call_sign = ${callSign || null},
      gt = ${gt || null},
      length = ${length || null},
      breadth = ${breadth || null},
      voyage_number = ${voyageNumber || null},
      last_port_name = ${lastPortName || null},
      last_port_country = ${lastPortCountry || null},
      port_of_arrival = ${portOfArrival},
      estimated_arrival_date = ${estimatedArrivalDate},
      estimated_arrival_time = ${estimatedArrivalTime || null},
      is_donation = ${isDonation},
      is_fast_arrival = ${isFastArrival},
      crew_change = ${crewChange},
      needs_help = ${needsHelp},
      observation = ${observation || null},
      updated_at = NOW()
    WHERE id = ${arrivalId}
  `

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/arrivals')
  revalidatePath(`/dashboard/arrivals/view/${arrivalId}`)
  
  return { success: true }
}

export async function submitArrival(arrivalId: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  const arrival = await sql`
    SELECT * FROM arrivals WHERE id = ${arrivalId}
  `

  if (arrival.length === 0) {
    return { error: 'Arribo no encontrado' }
  }

  if (session.user.role === 'naviera' && arrival[0].created_by !== session.user.id) {
    return { error: 'No tiene permiso para enviar este arribo' }
  }

  if (arrival[0].status !== 'pending') {
    return { error: 'Este arribo ya fue procesado' }
  }

  await sql`
    UPDATE arrivals SET status = 'submitted', updated_at = NOW()
    WHERE id = ${arrivalId}
  `

  // Notify authorities about new arrival
  const arrivalData = arrival[0]
  
  // Get all authority users for the port
  const authorities = await sql`
    SELECT id FROM users 
    WHERE role IN ('capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa', 'admin')
    AND (assigned_port = ${arrivalData.port_of_arrival} OR assigned_port IS NULL)
  `

  // Send notifications to all authorities
  for (const authority of authorities) {
    await notifyNewArrivalForAuthority(
      Number(arrivalId),
      arrivalData.arrival_number || `#${arrivalId}`,
      arrivalData.ship_name || 'Unknown',
      arrivalData.port_of_arrival || 'Unknown',
      authority.id
    )
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/arrivals')
  revalidatePath(`/dashboard/arrivals/view/${arrivalId}`)

  return { success: true }
}

export async function deleteArrival(arrivalId: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  const arrival = await sql`
    SELECT * FROM arrivals WHERE id = ${arrivalId}
  `

  if (arrival.length === 0) {
    return { error: 'Arribo no encontrado' }
  }

  if (session.user.role === 'naviera' && arrival[0].created_by !== session.user.id) {
    return { error: 'No tiene permiso para eliminar este arribo' }
  }

  if (arrival[0].status !== 'pending' && session.user.role !== 'admin') {
    return { error: 'Solo se pueden eliminar arribos pendientes' }
  }

  await sql`DELETE FROM documents WHERE arrival_id = ${arrivalId}`
  await sql`DELETE FROM arrival_approvals WHERE arrival_id = ${arrivalId}`
  await sql`DELETE FROM arrivals WHERE id = ${arrivalId}`

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/arrivals')
  redirect('/dashboard/arrivals')
}
