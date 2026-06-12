'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { approveAllDocuments } from '@/app/actions/approvals'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'

interface ApproveAllDocumentsButtonProps {
  pendingCount: number
}

export function ApproveAllDocumentsButton({ pendingCount }: ApproveAllDocumentsButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleApproveAll() {
    setLoading(true)
    const result = await approveAllDocuments()
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else if (result?.message) {
      toast({
        title: 'Información',
        description: result.message,
      })
    } else {
      toast({
        title: 'Éxito',
        description: `${result?.approved} documentos aprobados correctamente`,
      })
      router.refresh()
    }
    
    setLoading(false)
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
