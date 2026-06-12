// Document visibility permissions by role
// Each role can only see documents they are responsible for approving

export const documentPermissions: Record<string, string[]> = {
  // Capitanía de Puerto - ve casi todos los documentos
  capitan_puerto: [
    'NOA',
    'FAL1',
    'FAL2',
    'FAL3',
    'FAL4',
    'FAL5',
    'FAL6',
    'FAL7',
    'CARGO_MANIFEST',
    'LAST_DEPARTURE',
    'NIL_LIST',
    'POC',
  ],
  
  // Aduanas - documentos relacionados con carga y mercancías
  aduanas: [
    'NOA',
    'FAL1',
    'FAL2',
    'FAL3',
    'FAL4',
    'FAL7',
    'CARGO_MANIFEST',
  ],
  
  // Salud - documentos sanitarios y listas de personas
  salud: [
    'NOA',
    'FAL3',
    'FAL5',
    'FAL6',
    'MDH',
    'NIL_LIST',
    'POC',
  ],
  
  // Migración - listas de tripulación y pasajeros
  migracion: [
    'NOA',
    'FAL5',
    'FAL6',
    'NIL_LIST',
    'POC',
  ],
  
  // SENASA - documentos de carga y provisiones
  senassa: [
    'NOA',
    'FAL1',
    'FAL2',
    'FAL3',
    'FAL7',
    'CARGO_MANIFEST',
    'NIL_LIST',
  ],
  
  // Naviera - ve todos los documentos (es quien los sube)
  naviera: [
    'NOA',
    'FAL1',
    'FAL2',
    'FAL3',
    'FAL4',
    'FAL5',
    'FAL6',
    'FAL7',
    'CARGO_MANIFEST',
    'NIL_LIST',
    'LAST_DEPARTURE',
    'MDH',
    'POC',
    'OTHER',
  ],
  
  // Admin - ve todos los documentos
  admin: [
    'NOA',
    'FAL1',
    'FAL2',
    'FAL3',
    'FAL4',
    'FAL5',
    'FAL6',
    'FAL7',
    'CARGO_MANIFEST',
    'NIL_LIST',
    'LAST_DEPARTURE',
    'MDH',
    'POC',
    'OTHER',
  ],
}

export function canViewDocument(userRole: string, documentType: string): boolean {
  const allowedTypes = documentPermissions[userRole]
  if (!allowedTypes) return false
  return allowedTypes.includes(documentType)
}

export function filterDocumentsByRole(documents: any[], userRole: string): any[] {
  const allowedTypes = documentPermissions[userRole]
  if (!allowedTypes) return []
  return documents.filter(doc => allowedTypes.includes(doc.document_type))
}

export function canRoleApproveDocument(userRole: string, documentType: string): boolean {
  // Only authority roles can approve documents
  const authorityRoles = ['capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa', 'admin']
  if (!authorityRoles.includes(userRole)) return false
  
  const allowedTypes = documentPermissions[userRole]
  if (!allowedTypes) return false
  return allowedTypes.includes(documentType)
}
