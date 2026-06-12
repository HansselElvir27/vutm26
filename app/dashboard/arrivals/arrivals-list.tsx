'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Ship, Plus, Search, Filter, MapPin } from 'lucide-react'
import Link from 'next/link'
import { getPortLabel } from '@/lib/ports'

const statusConfig = {
  pending: { label: 'Borrador', bg: 'bg-slate-100', text: 'text-slate-800' },
  submitted: { label: 'Enviado', bg: 'bg-blue-100', text: 'text-blue-800' },
  approved_by_captain: { label: 'Aprobado por Capitan', bg: 'bg-green-100', text: 'text-green-800' },
  documents_complete: { label: 'Documentos Completos', bg: 'bg-amber-100', text: 'text-amber-800' },
  ready_for_zarpe: { label: 'Listo para Zarpe', bg: 'bg-purple-100', text: 'text-purple-800' },
  zarpe_approved: { label: 'Zarpe Aprobado', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  completed: { label: 'Completado', bg: 'bg-emerald-100', text: 'text-emerald-800' },
}

interface ArrivalData {
  id: number
  omi_number: string
  ship_name: string
  flag: string | null
  port_of_arrival: string
  estimated_arrival_date: string | null
  status: string
  agent_name: string | null
}

interface ArrivalsListProps {
  arrivals: ArrivalData[]
  isNaviera: boolean
  isAuthority: boolean
  assignedPort: string | null
}

export function ArrivalsList({ arrivals, isNaviera, isAuthority, assignedPort }: ArrivalsListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter arrivals based on search query
  const filteredArrivals = useMemo(() => {
    if (!searchQuery.trim()) return arrivals
    
    const query = searchQuery.toLowerCase().trim()
    return arrivals.filter((arrival: ArrivalData) => {
      return (
        arrival.omi_number?.toLowerCase().includes(query) ||
        arrival.ship_name?.toLowerCase().includes(query) ||
        arrival.agent_name?.toLowerCase().includes(query) ||
        arrival.flag?.toLowerCase().includes(query) ||
        getPortLabel(arrival.port_of_arrival)?.toLowerCase().includes(query)
      )
    })
  }, [arrivals, searchQuery])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isNaviera ? 'Mis Arribos' : 'Arribos'}
          </h1>
          <p className="text-muted-foreground">
            {isNaviera
              ? 'Gestione sus notificaciones de arribo'
              : isAuthority && assignedPort
                ? 'Revise y apruebe notificaciones de arribo en su puerto'
                : 'Revise y apruebe notificaciones de arribo'}
          </p>
          {isAuthority && assignedPort && (
            <div className="flex items-center gap-1 mt-1 text-sm text-primary">
              <MapPin className="w-4 h-4" />
              <span>{getPortLabel(assignedPort)}</span>
            </div>
          )}
        </div>
        {isNaviera && (
          <Link href="/dashboard/arrivals/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Arribo
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Lista de Arribos</CardTitle>
              <CardDescription>
                {searchQuery 
                  ? `${filteredArrivals.length} resultados de ${arrivals.length} registros`
                  : `${arrivals.length} registros encontrados`
                }
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por OMI, buque, agente..." 
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
                <span className="sr-only">Filtrar</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {arrivals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ship className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay arribos registrados</p>
              {isNaviera && (
                <Link href="/dashboard/arrivals/new">
                  <Button variant="link" className="mt-2">
                    Crear su primera notificacion de arribo
                  </Button>
                </Link>
              )}
            </div>
          ) : filteredArrivals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron resultados</p>
              <p className="text-sm">Intente con otros terminos de busqueda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">OMI</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Buque</th>
                    {!isNaviera && (
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Agente</th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Puerto</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">ETA</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Estado</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArrivals.map((arrival: ArrivalData) => {
                    const status = statusConfig[arrival.status as keyof typeof statusConfig] || statusConfig.pending
                    return (
                      <tr key={arrival.id} className="border-b border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm">{arrival.omi_number}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{arrival.ship_name}</p>
                            {arrival.flag && (
                              <p className="text-sm text-muted-foreground">Bandera: {arrival.flag}</p>
                            )}
                          </div>
                        </td>
                        {!isNaviera && (
                          <td className="py-3 px-4 text-sm">{arrival.agent_name}</td>
                        )}
                        <td className="py-3 px-4 text-sm">{getPortLabel(arrival.port_of_arrival)}</td>
                        <td className="py-3 px-4 text-sm">
                          {arrival.estimated_arrival_date ? new Date(arrival.estimated_arrival_date).toLocaleDateString('es-HN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }) : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/dashboard/arrivals/view/${arrival.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver detalles
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

