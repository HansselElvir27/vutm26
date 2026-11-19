'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
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
import { Upload, FileUp, X, FileText, Loader2, CheckCircle2, Clock } from 'lucide-react'

interface DocumentUploadProps {
  arrivalId: string
  existingDocumentTypes?: string[]
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

export function DocumentUpload({ arrivalId, existingDocumentTypes = [] }: DocumentUploadProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [filesToUpload, setFilesToUpload] = useState<FileWithType[]>([])
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [uploadedTypes, setUploadedTypes] = useState<string[]>(
    existingDocumentTypes?.map((t) => t.toUpperCase()) || []
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (existingDocumentTypes) {
      setUploadedTypes(existingDocumentTypes.map((t) => t.toUpperCase()))
    }
  }, [existingDocumentTypes])

  // Document types currently queued in the modal
  const queuedTypes = useMemo(
    () => filesToUpload.map((f) => f.documentType.toUpperCase()),
    [filesToUpload]
  )

  // Combined set of already uploaded and currently queued types
  const allBlockedTypes = useMemo(() => {
    return new Set([
      ...uploadedTypes.map((t) => t.toUpperCase()),
      ...queuedTypes,
    ])
  }, [uploadedTypes, queuedTypes])

  // Filter available types: already uploaded and queued ones are removed from the list
  const availableTypes = useMemo(() => {
    return documentTypes.filter((type) => !allBlockedTypes.has(type.value.toUpperCase()))
  }, [allBlockedTypes])

  function handleTypeSelect(val: string) {
    setSelectedType(val)
    // Open file chooser automatically when type is selected
    setTimeout(() => {
      fileInputRef.current?.click()
    }, 50)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedType) return

    const file = files[0]
    if (file.size > 15 * 1024 * 1024) {
      alert('El archivo no debe exceder los 15MB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setFilesToUpload((prev) => [
      ...prev.filter((item) => item.documentType.toUpperCase() !== selectedType.toUpperCase()),
      { file, documentType: selectedType },
    ])

    // Reset selectedType so dropdown is ready for next selection
    setSelectedType('')

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function removeFile(index: number) {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (filesToUpload.length === 0) return

    setLoading(true)
    setUploadProgress(`Subiendo 0 de ${filesToUpload.length}...`)

    try {
      const uploadedNow: string[] = []

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
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || `Error al subir ${file.name}`)
        }

        uploadedNow.push(documentType.toUpperCase())
      }

      setUploadedTypes((prev) => [...prev, ...uploadedNow])
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
    return documentTypes.find((t) => t.value.toUpperCase() === value.toUpperCase())?.label || value
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          setFilesToUpload([])
          setSelectedType('')
        }
      }}
    >
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
            Seleccione el tipo de documento para adjuntar los archivos requeridos para esta notificación de arribo.
          </DialogDescription>
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {uploadedTypes.length} ya subido{uploadedTypes.length !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
              <Clock className="w-3.5 h-3.5" />
              {availableTypes.length} pendiente{availableTypes.length !== 1 ? 's' : ''} de subir
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {availableTypes.length === 0 && filesToUpload.length === 0 ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium">Todos los documentos han sido subidos</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No quedan documentos pendientes por subir para este arribo.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Type selector */}
              <div className="space-y-2">
                <Label htmlFor="document_type" className="text-sm font-medium">
                  Tipo de Documento Pendiente
                </Label>
                <Select value={selectedType} onValueChange={handleTypeSelect}>
                  <SelectTrigger id="document_type">
                    <SelectValue placeholder="Seleccione el tipo de documento a subir..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />

              {/* Dropzone / selection trigger area */}
              {selectedType ? (
                <div
                  className="border-2 border-dashed border-primary/50 bg-primary/5 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/10 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    Haga clic aquí para seleccionar el archivo de{' '}
                    <span className="text-primary font-semibold">{getTypeLabel(selectedType)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, DOCX, XLS, XLSX, JPG o PNG (Máx. 15MB)
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-muted/40 rounded-lg border text-center text-sm text-muted-foreground">
                  Elija un tipo de documento del listado superior para seleccionar el archivo correspondiente.
                </div>
              )}
            </>
          )}

          {/* Files queued to upload */}
          {filesToUpload.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Archivos listos para subir ({filesToUpload.length})
              </Label>
              <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                {filesToUpload.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {getTypeLabel(item.documentType)}
                        </span>{' '}
                        • {(item.file.size / 1024).toFixed(1)} KB
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

          {/* Already uploaded list reference */}
          {uploadedTypes.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Documentos ya registrados para este arribo:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {uploadedTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {getTypeLabel(type)}
                  </span>
                ))}
              </div>
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
            {loading
              ? 'Subiendo...'
              : `Subir ${filesToUpload.length} Documento${filesToUpload.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
