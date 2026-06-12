'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createZarpeRequest } from '@/app/actions/zarpe'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Anchor } from 'lucide-react'
import { countries } from '@/lib/countries'

interface ZarpeIssueProps {
  arrivalId: string
  vesselName: string
}

export function ZarpeIssue({ arrivalId, vesselName }: ZarpeIssueProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [destinationCountry, setDestinationCountry] = useState('')
  const [captainNationality, setCaptainNationality] = useState('')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    
    formData.set('destination_country', destinationCountry)
    formData.set('captain_nationality', captainNationality)
    
    const result = await createZarpeRequest(arrivalId, formData)
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (result?.zarpeNumber) {
      toast({
        title: 'Solicitud de Zarpe Creada',
        description: `Número de zarpe: ${result.zarpeNumber}. Pendiente de aprobación por Capitanía de Puerto.`,
      })
    }
    
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Anchor className="w-4 h-4 mr-2" />
          Solicitar Zarpe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Zarpe de Puerto</DialogTitle>
          <DialogDescription>
            Complete la información para solicitar el zarpe del buque {vesselName}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-6">
          {/* Captain Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Información del Capitán
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="captain_name">Nombre del Capitán *</Label>
                <Input
                  id="captain_name"
                  name="captain_name"
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="captain_passport">Pasaporte *</Label>
                <Input
                  id="captain_passport"
                  name="captain_passport"
                  placeholder="Número de pasaporte"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="captain_nationality">Nacionalidad *</Label>
                <Select value={captainNationality} onValueChange={setCaptainNationality} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione nacionalidad" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Crew and Passengers */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Tripulación y Pasajeros
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="crew_count">Número de Tripulantes *</Label>
                <Input
                  id="crew_count"
                  name="crew_count"
                  type="number"
                  min="1"
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passenger_count">Número de Pasajeros</Label>
                <Input
                  id="passenger_count"
                  name="passenger_count"
                  type="number"
                  min="0"
                  defaultValue="0"
                />
              </div>
            </div>
          </div>

          {/* Departure Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Información de Salida
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="departure_date">Fecha de Salida *</Label>
                <Input
                  id="departure_date"
                  name="departure_date"
                  type="date"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departure_time">Hora de Salida *</Label>
                <Input
                  id="departure_time"
                  name="departure_time"
                  type="time"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination_country">País de Destino *</Label>
                <Select value={destinationCountry} onValueChange={setDestinationCountry} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione país" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination_port">Puerto de Destino *</Label>
                <Input
                  id="destination_port"
                  name="destination_port"
                  placeholder="Nombre del puerto"
                  required
                />
              </div>
            </div>
          </div>

          {/* Cargo Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Información de Carga
            </h4>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="cargo_on_board">Carga a Bordo</Label>
                <Textarea
                  id="cargo_on_board"
                  name="cargo_on_board"
                  placeholder="Descripcion de la carga..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="export_manifest">Manifiesto de Exportación</Label>
                <Input
                  id="export_manifest"
                  name="export_manifest"
                  placeholder="Número de manifiesto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea
                  id="observations"
                  name="observations"
                  placeholder="Observaciones adicionales..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !destinationCountry || !captainNationality}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {loading ? 'Enviando...' : 'Solicitar Zarpe'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
