import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ArrivalForm } from '@/components/arrivals/arrival-form'

export default async function NewArrivalPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'naviera' && session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nueva Notificacion de Arribo</h1>
        <p className="text-muted-foreground">
          Complete el formulario para notificar la llegada de un buque
        </p>
      </div>
      <ArrivalForm />
    </div>
  )
}
