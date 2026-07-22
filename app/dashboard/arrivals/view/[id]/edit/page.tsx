import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { ArrivalForm } from '@/components/arrivals/arrival-form'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getArrival(id: string) {
  const result = await sql`
    SELECT * FROM arrivals WHERE id = ${id}
  `
  return result[0] || null
}

export default async function EditArrivalPage({ params }: PageProps) {
  const { id } = await params

  const numericId = parseInt(id, 10)
  if (isNaN(numericId) || numericId <= 0) {
    notFound()
  }

  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const arrival = await getArrival(id)
  if (!arrival) {
    notFound()
  }

  // Solo el dueño (naviera) o admin pueden editar, y solo en estado 'pending'
  const isOwner = arrival.created_by === session.user.id
  const isAdmin = session.user.role === 'admin'

  if (!isOwner && !isAdmin) {
    redirect(`/dashboard/arrivals/view/${id}`)
  }

  if (arrival.status !== 'pending' && !isAdmin) {
    redirect(`/dashboard/arrivals/view/${id}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar Notificacion de Arribo</h1>
        <p className="text-muted-foreground">
          Modifique los datos de la notificacion de arribo para <span className="font-medium">{arrival.ship_name}</span>
        </p>
      </div>
      <ArrivalForm arrival={arrival} />
    </div>
  )
}
