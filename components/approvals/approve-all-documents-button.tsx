'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { approveAllDocuments } from '@/app/actions/approvals'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'

interface ApproveAllDocumentsButtonProps {
  pendingCount: number
  arrivalId?: string | number
}

export function ApproveAllDocumentsButton({ pendingCount, arrivalId }: ApproveAllDocumentsButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleApproveAll() {
    if (pendingCount === 0) {
      toast({
        title: 'Información',
        description: 'No hay documentos pendientes para aprobar.',
      })
      return
    }

    setLoading(true)
    try {
      const result = await approveAllDocuments(arrivalId)
      
      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else if (result?.message && (!result.approved || result.approved === 0)) {
        toast({
          title: 'Información',
          description: result.message,
        })
      } else {
        toast({
          title: 'Éxito',
          description: `${result?.approved} documento(s) aprobado(s) correctamente`,
        })
        router.refresh()
      }
    } catch (err: any) {
      console.error('Error in handleApproveAll:', err)
      toast({
        title: 'Error',
        description: err?.message || 'Error al aprobar los documentos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleApproveAll}
      disabled={loading || pendingCount === 0}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Aprobando...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Aprobar Todos ({pendingCount})
        </>
      )}
    </Button>
  )
}
