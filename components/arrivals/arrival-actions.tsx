'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitArrival, deleteArrival } from '@/app/actions/arrivals'
import { approveArrival, rejectArrival } from '@/app/actions/approvals'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Edit, Trash2, Send, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import type { UserRole } from '@/lib/db'

interface ArrivalActionsProps {
  arrivalId: string
  canEdit: boolean
  canSubmit: boolean
  canDelete: boolean
  canApprove: boolean
  userRole: UserRole
}

export function ArrivalActions({
  arrivalId,
  canEdit,
  canSubmit,
  canDelete,
  canApprove,
  userRole,
}: ArrivalActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectComments, setRejectComments] = useState('')

  async function handleSubmit() {
    setLoading(true)
    const result = await submitArrival(arrivalId)
    if (result?.error) {
      alert(result.error)
    }
    setLoading(false)
    router.refresh()
  }

  async function handleApprove() {
    setLoading(true)
    const result = await approveArrival(arrivalId)
    if (result?.error) {
      alert(result.error)
    }
    setLoading(false)
    router.refresh()
  }

  async function handleReject() {
    setLoading(true)
    const result = await rejectArrival(arrivalId, rejectComments)
    if (result?.error) {
      alert(result.error)
    }
    setLoading(false)
    setRejectDialogOpen(false)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canEdit && (
        <Link href={`/dashboard/arrivals/view/${arrivalId}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </Link>
      )}

      {canSubmit && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" disabled={loading}>
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enviar Notificacion de Arribo</AlertDialogTitle>
              <AlertDialogDescription>
                Una vez enviada, la notificacion sera revisada por las autoridades correspondientes.
                No podra editarla mientras este en revision.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit} disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {canApprove && (
        <>
          <Button size="sm" onClick={handleApprove} disabled={loading} className="bg-success hover:bg-success/90 text-success-foreground">
            <CheckCircle className="w-4 h-4 mr-2" />
            Aprobar
          </Button>

          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive" disabled={loading}>
                <XCircle className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rechazar Notificacion</DialogTitle>
                <DialogDescription>
                  Proporcione el motivo del rechazo. El agente naviero podra corregir y reenviar.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="comments">Motivo del Rechazo</Label>
                <Textarea
                  id="comments"
                  value={rejectComments}
                  onChange={(e) => setRejectComments(e.target.value)}
                  placeholder="Documentacion incompleta, datos incorrectos..."
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={loading}>
                  {loading ? 'Rechazando...' : 'Confirmar Rechazo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={loading}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Notificacion</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion no se puede deshacer. Se eliminaran todos los documentos y datos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteArrival(arrivalId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
