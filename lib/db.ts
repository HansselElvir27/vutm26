import { neon } from '@neondatabase/serverless'

function createSql() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set. Please add it in the Vars section of the sidebar.')
  }
  return neon(url)
}

export const sql = createSql()

export type UserRole = 'admin' | 'naviera' | 'capitan_puerto' | 'aduanas' | 'migracion' | 'salud' | 'senassa' | 'oficial_cim'

export interface User {
  id: number
  email: string
  name: string
  role: UserRole
  company_name: string | null
  assigned_port: string | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: number
  expires_at: string
  created_at: string
}

export interface Arrival {
  id: string
  arrival_number: string
  agent_id: string
  vessel_name: string
  vessel_imo: string | null
  vessel_flag: string | null
  vessel_type: string | null
  voyage_number: string | null
  port_of_origin: string | null
  port_of_destination: string
  eta: string
  ata: string | null
  etd: string | null
  atd: string | null
  cargo_description: string | null
  crew_count: number | null
  passenger_count: number | null
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'zarpe_issued'
  created_at: string
  updated_at: string
  container_total?: number | null
  container_loaded?: number | null
  container_empty?: number | null
  passenger_total?: number | null
  passenger_disembark?: number | null
  passenger_onboard?: number | null
  terminal?: string | null
}

export interface Document {
  id: string
  arrival_id: string
  document_type: string
  file_name: string
  file_url: string
  uploaded_by: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface DocumentApproval {
  id: string
  document_id: string
  approved_by: string
  status: 'approved' | 'rejected'
  comments: string | null
  created_at: string
}

export interface ArrivalApproval {
  id: string
  arrival_id: string
  authority_type: UserRole
  approved_by: string
  status: 'approved' | 'rejected'
  comments: string | null
  created_at: string
}

export interface Zarpe {
  id: string
  arrival_id: string
  zarpe_number: string
  issued_by: string
  issued_at: string
  valid_until: string
  destination_port: string
  remarks: string | null
}
