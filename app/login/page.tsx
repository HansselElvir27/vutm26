import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'

export default async function LoginPage() {
  const session = await getSession()
  if (session) {
    redirect('/dashboard')
  }

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
        <LoginForm />
      </div>
    </main>
  )
}
