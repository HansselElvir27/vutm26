'use client'

import React from "react"

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileUp, X, FileText, Loader2 } from 'lucide-react'

interface DocumentUploadProps {
  arrivalId: string
}

interface FileWithType {
  file: File
  documentType: string
}

const documentTypes = [
  { value: 'NOA', label: 'NOA - Notificacion de Arribo' },
  { value: 'FAL1', label: 'FAL1 - Declaracion General' },
  { value: 'FAL2', label: 'FAL2 - Declaración de Carga' },
  { value: 'FAL3', label: 'FAL3 - Provisiones del Buque' },
  { value: 'FAL4', label: 'FAL4 - Efectos de la Tripulacion' },
  { value: 'FAL5', label: 'FAL5 - Lista de Tripulacion' },
  { value: 'FAL6', label: 'FAL6 - Lista de Pasajeros' },
  { value: 'FAL7', label: 'FAL7 - Mercancias Peligrosas' },
  { value: 'CARGO_MANIFEST', label: 'Manifiesto de Carga Detallado' },
  { value: 'NIL_LIST', label: 'Lista NIL' },
  { value: 'LAST_DEPARTURE', label: 'Ultimo ZARPE' },
  { value: 'MDH', label: 'MDH - Declaracion Maritima de Sanidad' },
  { value: 'POC', label: 'POC - Ultimos 10 Puertos' },
  { value: 'OTHER', label: 'Otro Documento' },
]

export function DocumentUpload({ arrivalId }: DocumentUploadProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [filesToUpload, setFilesToUpload] = useState<FileWithType[]>([])
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedType) return

    const newFiles: FileWithType[] = Array.from(files).map(file => ({
      file,
      documentType: selectedType
    }))

    setFilesToUpload(prev => [...prev, ...newFiles])
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function removeFile(index: number) {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (filesToUpload.length === 0) return

    setLoading(true)
    setUploadProgress(`Subiendo 0 de ${filesToUpload.length}...`)

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const { file, documentType } = filesToUpload[i]
        setUploadProgress(`Subiendo ${i + 1} de ${filesToUpload.length}...`)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('document_type', documentType)
        formData.append('arrival_id', arrivalId)

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Error al subir ${file.name}`)
        }
      }

      setOpen(false)
      setFilesToUpload([])
      setSelectedType('')
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al subir los documentos')
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  function getTypeLabel(value: string) {
    return documentTypes.find(t => t.value === value)?.label || value
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        setFilesToUpload([])
        setSelectedType('')
      }
    }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Subir Documentos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subir Documentos</DialogTitle>
          <DialogDescription>
            Seleccione el tipo de documento, luego elija los archivos. Puede agregar varios documentos de diferentes tipos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Step 1: Select type and add files */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="document_type" className="text-sm font-medium mb-2 block">
                Tipo de Documento
              </Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                disabled={!selectedType}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="w-4 h-4 mr-2" />
                Agregar Archivos
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
            </div>
          </div>

          {!selectedType && (
            <p className="text-sm text-muted-foreground">
              Primero seleccione el tipo de documento para poder agregar archivos.
            </p>
          )}

          {/* File list */}
          {filesToUpload.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Archivos a subir ({filesToUpload.length})</Label>
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {filesToUpload.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getTypeLabel(item.documentType)} - {(item.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(index)}
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {filesToUpload.length === 0 && selectedType && (
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Haga clic para seleccionar archivos</p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOC, XLS, JPG o PNG. Puede seleccionar varios archivos.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {uploadProgress && (
            <p className="text-sm text-muted-foreground mr-auto flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadProgress}
            </p>
          )}
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={filesToUpload.length === 0 || loading}>
            {loading ? 'Subiendo...' : `Subir ${filesToUpload.length} Documento${filesToUpload.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
