'use server'

import { revalidatePath } from 'next/cache'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notifyZarpeIssued, notifyCIMPreApproved } from './notifications'

function generateZarpeNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `ZRP-${year}-${random}`
}

export async function createZarpeRequest(arrivalId: string, formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  // Only naviera or admin can create zarpe request
  if (!['naviera', 'admin'].includes(session.user.role)) {
    return { error: 'Solo la naviera puede solicitar zarpe' }
  }

  const arrival = await sql`
    SELECT * FROM arrivals WHERE id = ${arrivalId}
  `

  if (arrival.length === 0) {
    return { error: 'Arribo no encontrado' }
  }

  // Check if zarpe already exists
  const existingZarpe = await sql`
    SELECT id FROM zarpes WHERE arrival_id = ${arrivalId}
  `
  if (existingZarpe.length > 0) {
    return { error: 'Ya existe una solicitud de zarpe para este arribo' }
  }

  const captainName = formData.get('captain_name') as string
  const captainPassport = formData.get('captain_passport') as string
  const captainNationality = formData.get('captain_nationality') as string
  const crewCount = parseInt(formData.get('crew_count') as string) || 0
  const passengerCount = parseInt(formData.get('passenger_count') as string) || 0
  const departureDate = formData.get('departure_date') as string
  const departureTime = formData.get('departure_time') as string
  const destinationCountry = formData.get('destination_country') as string
  const destinationPort = formData.get('destination_port') as string
  const cargoOnBoard = formData.get('cargo_on_board') as string
  const exportManifest = formData.get('export_manifest') as string
  const observations = formData.get('observations') as string

  if (!captainName || !captainPassport || !captainNationality || !departureDate || !departureTime || !destinationCountry || !destinationPort) {
    return { error: 'Todos los campos obligatorios son requeridos' }
  }

  const zarpeNumber = generateZarpeNumber()

  await sql`
    INSERT INTO zarpes (
      arrival_id, zarpe_number, captain_name, captain_passport, captain_nationality,
      crew_count, passenger_count, departure_date, departure_time,
      destination_country, destination_port, cargo_on_board, export_manifest, observations
    )
    VALUES (
      ${arrivalId}, ${zarpeNumber}, ${captainName}, ${captainPassport}, ${captainNationality},
      ${crewCount}, ${passengerCount}, ${departureDate}, ${departureTime},
      ${destinationCountry}, ${destinationPort}, ${cargoOnBoard || null}, ${exportManifest || null}, ${observations || null}
    )
  `

  // El estado ya es 'ready_for_zarpe', no se necesita actualizar
  // El estado cambiará a 'zarpe_approved' cuando el capitán lo apruebe

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/arrivals')
  revalidatePath(`/dashboard/arrivals/view/${arrivalId}`)

  return { success: true, zarpeNumber }
}

export async function approveCIMZarpe(zarpeId: number, comments?: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  if (!['oficial_cim', 'admin'].includes(session.user.role)) {
    return { error: 'Solo Oficial CIM puede aprobar zarpes' }
  }

  const zarpe = await sql`
    SELECT * FROM zarpes WHERE id = ${zarpeId}
  `

  if (zarpe.length === 0) {
    return { error: 'Zarpe no encontrado' }
  }

  if (zarpe[0].cim_approved) {
    return { error: 'Este zarpe ya ha sido aprobado por CIM' }
  }

  await sql`
    UPDATE zarpes 
    SET cim_approved = true, cim_approved_by = ${session.user.id}, cim_approved_at = NOW(), cim_comments = ${comments || null}
    WHERE id = ${zarpeId}
  `

  // Notify Captain when CIM has pre-approved the zarpe
  const zarpeData = zarpe[0]
  const arrivalInfo = await sql`
    SELECT id, ship_name, port_of_arrival FROM arrivals WHERE id = ${zarpeData.arrival_id}
  `
  
  if (arrivalInfo.length > 0) {
    // Get captain user for the port
    const captainUser = await sql`
      SELECT id FROM users 
      WHERE role = 'capitan_puerto'
      AND (assigned_port = ${arrivalInfo[0].port_of_arrival} OR assigned_port IS NULL)
      LIMIT 1
    `
    
    if (captainUser.length > 0) {
      await notifyCIMPreApproved(
        Number(arrivalInfo[0].id),
        `#${arrivalInfo[0].id}`,
        arrivalInfo[0].ship_name || 'Unknown',
        captainUser[0].id,
        session.user.id,
        session.user.name
      )
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/arrivals')

  return { success: true }
}

export async function approveCaptainZarpe(zarpeId: number) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  if (!['capitan_puerto', 'admin'].includes(session.user.role)) {
    return { error: 'Solo Capitania de Puerto puede aprobar zarpes' }
  }

  const zarpe = await sql`
    SELECT z.*, a.id as arrival_id FROM zarpes z
    JOIN arrivals a ON z.arrival_id = a.id
    WHERE z.id = ${zarpeId}
  `

  if (zarpe.length === 0) {
    return { error: 'Zarpe no encontrado' }
  }

  if (!zarpe[0].cim_approved) {
    return { error: 'El Zarpe debe ser aprobado por CIM antes que el Capitán' }
  }

  if (zarpe[0].approved) {
    return { error: 'Este zarpe ya ha sido aprobado' }
  }

  const digitalSignature = `FIRMADO_DIGITALMENTE_${session.user.name}_${new Date().toISOString()}`

  await sql`
    UPDATE zarpes 
    SET status = 'approved', approved_by = ${session.user.id}, approved_at = NOW(), digital_signature = ${digitalSignature}
    WHERE id = ${zarpeId}
  `

  await sql`
    UPDATE arrivals SET status = 'zarpe_approved', updated_at = NOW()
    WHERE id = ${zarpe[0].arrival_id}
  `

  // Notify agent that ZARPE was issued
  const zarpeData = zarpe[0]
  const arrivalInfo = await sql`
    SELECT ship_name, created_by FROM arrivals WHERE id = ${zarpeData.arrival_id}
  `
  
  if (arrivalInfo.length > 0) {
    await notifyZarpeIssued(
      Number(zarpeData.arrival_id),
      zarpeData.zarpe_number || `ZRP-${zarpeId}`,
      arrivalInfo[0].ship_name || 'Unknown',
      Number(arrivalInfo[0].created_by)
    )
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/arrivals')
  revalidatePath(`/dashboard/arrivals/view/${zarpe[0].arrival_id}`)

  return { success: true }
}

export async function rejectCIMZarpe(zarpeId: number, reason: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  if (!['oficial_cim', 'admin'].includes(session.user.role)) {
    return { error: 'Solo Oficial CIM puede rechazar zarpes' }
  }

  const zarpe = await sql`
    SELECT z.*, a.id as arrival_id FROM zarpes z
    JOIN arrivals a ON z.arrival_id = a.id
    WHERE z.id = ${zarpeId}
  `

  if (zarpe.length === 0) {
    return { error: 'Zarpe no encontrado' }
  }

  await sql`
    UPDATE zarpes 
    SET status = 'rejected', cim_comments = ${reason}, cim_approved_by = ${session.user.id}, cim_approved_at = NOW()
    WHERE id = ${zarpeId}
  `

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/arrivals')
  revalidatePath(`/dashboard/arrivals/view/${zarpe[0].arrival_id}`)

  return { success: true }
}

export async function approveZarpe(zarpeId: number) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  // Only capitan_puerto or admin can approve zarpe
  if (!['capitan_puerto', 'admin'].includes(session.user.role)) {
    return { error: 'Solo Capitania de Puerto puede aprobar zarpes' }
  }

  const zarpe = await sql`
    SELECT z.*, a.id as arrival_id FROM zarpes z
    JOIN arrivals a ON z.arrival_id = a.id
    WHERE z.id = ${zarpeId}
  `

  if (zarpe.length === 0) {
    return { error: 'Zarpe no encontrado' }
  }

  const digitalSignature = `FIRMADO_DIGITALMENTE_${session.user.name}_${new Date().toISOString()}`

  await sql`
    UPDATE zarpes 
    SET status = 'approved', approved_by = ${session.user.id}, approved_at = NOW(), digital_signature = ${digitalSignature}
    WHERE id = ${zarpeId}
  `

  await sql`
    UPDATE arrivals SET status = 'zarpe_approved', updated_at = NOW()
    WHERE id = ${zarpe[0].arrival_id}
  `

  // Notify agent that ZARPE was issued
  const zarpeData = zarpe[0]
  const arrivalInfo = await sql`
    SELECT ship_name, created_by FROM arrivals WHERE id = ${zarpeData.arrival_id}
  `
  
  if (arrivalInfo.length > 0) {
    await notifyZarpeIssued(
      Number(zarpeData.arrival_id),
      zarpeData.zarpe_number || `ZRP-${zarpeId}`,
      arrivalInfo[0].ship_name || 'Unknown',
      Number(arrivalInfo[0].created_by)
    )
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/arrivals')
  revalidatePath(`/dashboard/arrivals/view/${zarpe[0].arrival_id}`)

  return { success: true }
}

export async function rejectZarpe(zarpeId: number, reason: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'No autorizado' }
  }

  if (!['capitan_puerto', 'admin'].includes(session.user.role)) {
    return { error: 'Solo Capitania de Puerto puede rechazar zarpes' }
  }

  const zarpe = await sql`
    SELECT z.*, a.id as arrival_id FROM zarpes z
    JOIN arrivals a ON z.arrival_id = a.id
    WHERE z.id = ${zarpeId}
  `

  if (zarpe.length === 0) {
    return { error: 'Zarpe no encontrado' }
  }

  await sql`
    UPDATE zarpes 
    SET status = 'rejected', observations = ${reason}
    WHERE id = ${zarpeId}
  `

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/arrivals')
  revalidatePath(`/dashboard/arrivals/view/${zarpe[0].arrival_id}`)

  return { success: true }
}

export async function getZarpe(arrivalId: string) {
  const result = await sql`
    SELECT z.*, 
      u.name as approved_by_name,
      a.flag as vessel_flag,
      a.length as vessel_length,
      a.gt as vessel_gt,
      a.voyage_number,
      a.last_port_name,
      a.last_port_country,
      a.port_of_arrival,
      naviera.name as naviera_name,
      cim_user.name as cim_operator_name
    FROM zarpes z
    LEFT JOIN users u ON z.approved_by = u.id
    LEFT JOIN arrivals a ON z.arrival_id = a.id
    LEFT JOIN users naviera ON a.created_by = naviera.id
    LEFT JOIN users cim_user ON z.cim_approved_by = cim_user.id
    WHERE z.arrival_id = ${arrivalId}
  `
  return result[0] || null
}
