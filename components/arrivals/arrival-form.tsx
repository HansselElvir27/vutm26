'use client'

import React, { useState, useRef } from 'react'
import { createArrival, updateArrival } from '@/app/actions/arrivals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Ship, MapPin, Calendar, Info, Save, FileText, Upload, X, AlertCircle } from 'lucide-react'
import { countries } from '@/lib/countries'
import { HONDURAS_PORTS } from '@/lib/ports'
import { useLanguage } from '@/lib/language-context'

interface Arrival {
  id: number
  ship_name: string
  omi_number: string
  flag?: string
  vessel_type?: string
  call_sign?: string
  gt?: string
  length?: string
  breadth?: string
  voyage_number?: string
  last_port_name?: string
  last_port_country?: string
  port_of_arrival: string
  estimated_arrival_date: string
  estimated_arrival_time?: string
  is_donation?: boolean
  is_fast_arrival?: boolean
  crew_change?: boolean
  needs_help?: boolean
  observation?: string
  container_total?: number
  container_loaded?: number
  container_empty?: number
  passenger_total?: number
  passenger_disembark?: number
  passenger_onboard?: number
  terminal?: string
}

interface ArrivalFormProps {
  arrival?: Arrival
}

const vesselTypes = [
  'Carga General',
  'Contenedor',
  'Contenedor Frigorífico',
  'Tanquero',
  'Granelero',
  'RoRo',
  'Pasajeros',
  'Crucero',
  'Pesquero',
  'Remolcador',
  'Otro',
]

const vesselTypesEn = [
  'General Cargo',
  'Container',
  'Reefer Container',
  'Tanker',
  'Bulk Carrier',
  'RoRo',
  'Passenger',
  'Cruise',
  'Fishing',
  'Tug',
  'Other',
]

const PORT_TERMINALS: Record<string, string[]> = {
  puerto_castilla: ['Castilla'],
  puerto_ceiba: ['La Ceiba'],
  puerto_cortes: ['OPC', 'TEH', 'UNO', 'AVANZA'],
  puerto_omoa: ['Omoa'],
  puerto_roatan: ['Naviera Hybur', 'RECO', 'Mahogany bay', 'French Harbour', 'Coxen Hole'],
  puerto_san_lorenzo: ['San Lorenzo'],
  puerto_tela: ['Tela'],
}

const honduranPorts = HONDURAS_PORTS; // Declare the variable here

export function ArrivalForm({ arrival }: ArrivalFormProps) {
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [port, setPort] = useState(arrival?.port_of_arrival || '')
  const [terminal, setTerminal] = useState(arrival?.terminal || '')
  const [vesselType, setVesselType] = useState(arrival?.vessel_type || '')
  const [flag, setFlag] = useState(arrival?.flag || '')
  const [lastPortCountry, setLastPortCountry] = useState(arrival?.last_port_country || '')
  const [isDonation, setIsDonation] = useState(arrival?.is_donation || false)
  const [isFastArrival, setIsFastArrival] = useState(arrival?.is_fast_arrival || false)
  const [crewChange, setCrewChange] = useState(arrival?.crew_change || false)
  const [needsHelp, setNeedsHelp] = useState(arrival?.needs_help || false)
  
  // Document states
  const [noaFile, setNoaFile] = useState<File | null>(null)
  const [fal1File, setFal1File] = useState<File | null>(null)
  const noaInputRef = useRef<HTMLInputElement>(null)
  const fal1InputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!arrival

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate required documents for new arrivals
    if (!isEditing && (!noaFile || !fal1File)) {
      setError(t('arrivals.requiredDocsError') || 'Debe adjuntar los documentos NOA y FAL1 para crear la notificacion de arribo')
      setLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.set('port_of_arrival', port)
    formData.set('terminal', terminal)
    formData.set('vessel_type', vesselType)
    formData.set('flag', flag)
    formData.set('last_port_country', lastPortCountry)
    formData.set('is_donation', isDonation.toString())
    formData.set('is_fast_arrival', isFastArrival.toString())
    formData.set('crew_change', crewChange.toString())
    formData.set('needs_help', needsHelp.toString())
    
    // Add document files
    if (noaFile) {
      formData.set('noa_document', noaFile)
    }
    if (fal1File) {
      formData.set('fal1_document', fal1File)
    }

    const result = isEditing
      ? await updateArrival(arrival.id.toString(), formData)
      : await createArrival(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  function handleNoaFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError(t('documents.noaPdfError') || 'El documento NOA debe ser un archivo PDF')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t('documents.noaSizeError') || 'El documento NOA no debe exceder 10MB')
        return
      }
      setNoaFile(file)
      setError(null)
    }
  }

  function handleFal1FileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError(t('documents.fal1PdfError') || 'El documento FAL1 debe ser un archivo PDF')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t('documents.fal1SizeError') || 'El documento FAL1 no debe exceder 10MB')
        return
      }
      setFal1File(file)
      setError(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="w-5 h-5" />
            {t('app.vesselInfo')}
          </CardTitle>
          <CardDescription>
            {t('app.vesselData')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ship_name">{t('vessel.shipName')} *</Label>
            <Input
              id="ship_name"
              name="ship_name"
              placeholder="MV Ocean Star"
              defaultValue={arrival?.ship_name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="omi_number">{t('vessel.omiNumber')} *</Label>
            <Input
              id="omi_number"
              name="omi_number"
              placeholder="1234567"
              defaultValue={arrival?.omi_number}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flag">{t('vessel.flag')} *</Label>
            <Select value={flag} onValueChange={setFlag} required>
              <SelectTrigger>
                <SelectValue placeholder={t('vessel.flagCountry')} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vessel_type">{t('vessel.type')}</Label>
            <Select value={vesselType} onValueChange={setVesselType}>
              <SelectTrigger>
                <SelectValue placeholder={t('vessel.typeSelect')} />
              </SelectTrigger>
              <SelectContent>
                {vesselTypes.map((type, index) => (
                  <SelectItem key={type} value={type}>
                    {language === 'en' ? vesselTypesEn[index] : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="call_sign">{t('vessel.callSign')}</Label>
            <Input
              id="call_sign"
              name="call_sign"
              placeholder="ABCD1"
              defaultValue={arrival?.call_sign || ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gt">{t('vessel.gt')}</Label>
            <Input
              id="gt"
              name="gt"
              placeholder="50000"
              defaultValue={arrival?.gt || ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="length">{t('vessel.length')}</Label>
            <Input
              id="length"
              name="length"
              placeholder="200"
              defaultValue={arrival?.length || ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="breadth">{t('vessel.breadth')}</Label>
            <Input
              id="breadth"
              name="breadth"
              placeholder="32"
              defaultValue={arrival?.breadth || ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voyage_number">{t('vessel.voyageNumber')}</Label>
            <Input
              id="voyage_number"
              name="voyage_number"
              placeholder="VOY-2024-001"
              defaultValue={arrival?.voyage_number || ''}
            />
          </div>

          {(vesselType === 'Contenedor' || vesselType === 'Carga General' || vesselType === 'Contenedor Frigorífico') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="container_total">Total de Contenedores</Label>
                <Input
                  id="container_total"
                  name="container_total"
                  type="number"
                  placeholder="0"
                  defaultValue={arrival?.container_total ?? ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="container_loaded">Contenedores Cargados</Label>
                <Input
                  id="container_loaded"
                  name="container_loaded"
                  type="number"
                  placeholder="0"
                  defaultValue={arrival?.container_loaded ?? ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="container_empty">Contenedores sin Carga</Label>
                <Input
                  id="container_empty"
                  name="container_empty"
                  type="number"
                  placeholder="0"
                  defaultValue={arrival?.container_empty ?? ''}
                />
              </div>
            </>
          )}

          {vesselType === 'Crucero' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="passenger_total">Total de Pasajeros</Label>
                <Input
                  id="passenger_total"
                  name="passenger_total"
                  type="number"
                  placeholder="0"
                  defaultValue={arrival?.passenger_total ?? ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passenger_disembark">Pasajeros Desembarcaron</Label>
                <Input
                  id="passenger_disembark"
                  name="passenger_disembark"
                  type="number"
                  placeholder="0"
                  defaultValue={arrival?.passenger_disembark ?? ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passenger_onboard">Pasajeros no Desembarcaron</Label>
                <Input
                  id="passenger_onboard"
                  name="passenger_onboard"
                  type="number"
                  placeholder="0"
                  defaultValue={arrival?.passenger_onboard ?? ''}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t('app.routePorts')}
          </CardTitle>
          <CardDescription>
            {t('app.routeInfo')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="last_port_name">{t('route.lastPort')}</Label>
            <Input
              id="last_port_name"
              name="last_port_name"
              placeholder="Houston"
              defaultValue={arrival?.last_port_name || ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_port_country">{t('route.lastPortCountry')} *</Label>
            <Select value={lastPortCountry} onValueChange={setLastPortCountry} required>
              <SelectTrigger>
                <SelectValue placeholder={t('vessel.flagCountry')} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="port_of_arrival">{t('route.arrivalPort')} *</Label>
            <Select 
              value={port} 
              onValueChange={(val) => {
                setPort(val)
                setTerminal('')
              }} 
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t('route.selectPort')} />
              </SelectTrigger>
              <SelectContent>
                {HONDURAS_PORTS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {port && PORT_TERMINALS[port] && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="terminal">Terminal de Arribo *</Label>
              <Select value={terminal} onValueChange={setTerminal} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione la terminal" />
                </SelectTrigger>
                <SelectContent>
                  {PORT_TERMINALS[port].map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('app.arrivalDateTime')}
          </CardTitle>
          <CardDescription>
            {t('app.arrivalEstimate')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="estimated_arrival_date">{t('arrival.date')} *</Label>
            <Input
              id="estimated_arrival_date"
              name="estimated_arrival_date"
              type="date"
              defaultValue={arrival?.estimated_arrival_date ? arrival.estimated_arrival_date.split('T')[0] : ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_arrival_time">{t('arrival.time')}</Label>
            <Input
              id="estimated_arrival_time"
              name="estimated_arrival_time"
              type="time"
              defaultValue={arrival?.estimated_arrival_time || ''}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('app.requiredDocs')}
          </CardTitle>
          <CardDescription>
            {t('app.requiredDocsInfo')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Label className="flex items-center gap-1">
              {t('documents.noa')} *
              {!isEditing && <span className="text-destructive text-xs">({t('common.required')})</span>}
            </Label>
            <div className="border-2 border-dashed border rounded-lg p-4 transition-colors hover:border-primary/50">
              {noaFile ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{noaFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(noaFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setNoaFile(null)
                      if (noaInputRef.current) noaInputRef.current.value = ''
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4"
                  onClick={() => noaInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    {t('documents.selectPdf')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('documents.maxSize')}</p>
                </div>
              )}
              <input
                ref={noaInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleNoaFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-1">
              {t('documents.fal1')} *
              {!isEditing && <span className="text-destructive text-xs">({t('common.required')})</span>}
            </Label>
            <div className="border-2 border-dashed border rounded-lg p-4 transition-colors hover:border-primary/50">
              {fal1File ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{fal1File.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(fal1File.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFal1File(null)
                      if (fal1InputRef.current) fal1InputRef.current.value = ''
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4"
                  onClick={() => fal1InputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    {t('documents.selectPdf')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('documents.maxSize')}</p>
                </div>
              )}
              <input
                ref={fal1InputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFal1FileChange}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            {t('options.title')}
          </CardTitle>
          <CardDescription>
            {t('options.observations')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_donation" 
                checked={isDonation}
                onCheckedChange={(checked) => setIsDonation(checked === true)}
              />
              <Label htmlFor="is_donation" className="font-normal">{t('options.isDonation')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_fast_arrival" 
                checked={isFastArrival}
                onCheckedChange={(checked) => setIsFastArrival(checked === true)}
              />
              <Label htmlFor="is_fast_arrival" className="font-normal">{t('options.fastArrival')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="crew_change" 
                checked={crewChange}
                onCheckedChange={(checked) => setCrewChange(checked === true)}
              />
              <Label htmlFor="crew_change" className="font-normal">{t('options.crewChange')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="needs_help" 
                checked={needsHelp}
                onCheckedChange={(checked) => setNeedsHelp(checked === true)}
              />
              <Label htmlFor="needs_help" className="font-normal">{t('options.needsAssistance')}</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">{t('options.observations')}</Label>
            <Textarea
              id="observation"
              name="observation"
              placeholder={t('options.observationsPlaceholder')}
              rows={4}
              defaultValue={arrival?.observation || ''}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? t('status.saving') : isEditing ? t('arrivals.updateArrival') : t('arrivals.createNotification')}
        </Button>
      </div>
    </form>
  )
}
