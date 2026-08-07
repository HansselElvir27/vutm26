import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'

interface LoginPageProps {
  searchParams: Promise<{ reason?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession()
  if (session) {
    redirect('/dashboard')
  }

  const { reason } = await searchParams
  const isInactivity = reason === 'inactivity'

  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center mb-4">
            <Image
              src="/logo-vutm.png"
              alt="Marina Mercante de Honduras"
              width={120}
              height={120}
              className="mb-4"
              priority
            />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">VUTMHN</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ventanilla Unica de Transporte Maritimo</p>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Direccion General de la Marina Mercante de Honduras
          </p>
        </div>

        {/* Aviso de cierre por inactividad */}
        {isInactivity && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Sesión cerrada por inactividad</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Su sesión fue cerrada automáticamente por 10 minutos de inactividad. Inicie sesión nuevamente para continuar.
              </p>
            </div>
          </div>
        )}

        <LoginForm />
      </div>
    </main>
  )
}
