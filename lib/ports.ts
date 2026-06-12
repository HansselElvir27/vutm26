export const HONDURAS_PORTS = [
  { value: 'puerto_cortes', label: 'Puerto Cortés' },
  { value: 'puerto_roatan', label: 'Puerto de Roatán' },
  { value: 'puerto_san_lorenzo', label: 'Puerto San Lorenzo' },
  { value: 'puerto_castilla', label: 'Puerto Castilla' },
  { value: 'puerto_tela', label: 'Puerto Tela' },
  { value: 'puerto_ceiba', label: 'Puerto Ceiba' },
  { value: 'puerto_omoa', label: 'Puerto Omoa' },
] as const

export type HondurasPort = typeof HONDURAS_PORTS[number]['value']

export const AUTHORITY_ROLES = [
  'capitan_puerto',
  'aduanas',
  'migracion',
  'salud',
  'senassa',
  'oficial_cim',
] as const

export function isAuthorityRole(role: string): boolean {
  return AUTHORITY_ROLES.includes(role as any)
}

export function getPortLabel(portValue: string | null): string {
  if (!portValue) return 'No asignado'
  const port = HONDURAS_PORTS.find(p => p.value === portValue)
  return port?.label || portValue
}
