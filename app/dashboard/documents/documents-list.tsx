'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Search, Filter } from 'lucide-react'
import Link from 'next/link'

const documentTypeLabels: Record<string, string> = {
  NOA: 'NOA - Notificacion de Arribo',
  FAL1: 'FAL1 - Declaracion General',
  FAL2: 'FAL2 - Declaracion de Carga',
  FAL3: 'FAL3 - Provisiones del Buque',
  FAL4: 'FAL4 - Efectos de la Tripulacion',
  FAL5: 'FAL5 - Lista de Tripulacion',
  FAL6: 'FAL6 - Lista de Pasajeros',
  FAL7: 'FAL7 - Mercancias Peligrosas',
  CARGO_MANIFEST: 'Manifiesto de Carga Detallado',
  NIL_LIST: 'Lista NIL',
  LAST_DEPARTURE: 'Ultimo ZARPE',
  MDH: 'MDH - Declaracion Maritima de Sanidad',
  POC: 'POC - Ultimos 10 puertos',
  OTHER: 'Otro Documento',
}

interface DocumentData {
  id: number
  document_type: string
  file_name: string
  uploaded_at: string | null
  ship_name: string
  omi_number: string
  arrival_id: number
  uploaded_by_name: string | null
}

interface DocumentsListProps {
  documents: DocumentData[]
  isNaviera: boolean
}

export function DocumentsList({ documents, isNaviera }: DocumentsListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents
    
    const query = searchQuery.toLowerCase().trim()
    return documents.filter((doc: DocumentData) => {
      return (
        doc.file_name?.toLowerCase().includes(query) ||
        doc.document_type?.toLowerCase().includes(query) ||
        documentTypeLabels[doc.document_type]?.toLowerCase().includes(query) ||
        doc.ship_name?.toLowerCase().includes(query) ||
        doc.omi_number?.toLowerCase().includes(query) ||
        doc.uploaded_by_name?.toLowerCase().includes(query)
      )
    })
  }, [documents, searchQuery])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isNaviera ? 'Mis Documentos' : 'Documentos para Revision'}
        </h1>
        <p className="text-muted-foreground">
          {isNaviera
            ? 'Documentos adjuntos a sus notificaciones de arribo'
            : 'Documentos del sistema para revision y aprobacion'}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Lista de Documentos</CardTitle>
              <CardDescription>
                {searchQuery 
                  ? `${filteredDocuments.length} resultados de ${documents.length} documentos`
                  : `${documents.length} documentos encontrados`
                }
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar documento, tipo, buque..." 
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
          {documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay documentos</p>
              <p className="text-sm">Los documentos aparecen aqui cuando se adjuntan a un arribo</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
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
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Documento</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Arribo</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc: DocumentData) => (
                    <tr key={doc.id} className="border-b border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium truncate max-w-[200px]">{doc.file_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {documentTypeLabels[doc.document_type] || doc.document_type}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium">{doc.ship_name}</p>
                          <p className="text-xs text-muted-foreground">{doc.omi_number}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('es-HN') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/dashboard/arrivals/view/${doc.arrival_id}`}>
                          <Button variant="outline" size="sm">
                            Ver arribo
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

