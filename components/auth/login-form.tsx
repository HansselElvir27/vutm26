'use client'

import { useState } from 'react'
import { login, register } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HONDURAS_PORTS, isAuthorityRole } from '@/lib/ports'

export function LoginForm() {
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<string>('')
  const [assignedPort, setAssignedPort] = useState<string>('')

  const showPortSelector = isAuthorityRole(role)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    if (isRegister) {
      formData.set('role', role)
      if (showPortSelector && assignedPort) {
        formData.set('assigned_port', assignedPort)
      }
    }

    const result = isRegister ? await register(formData) : await login(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  function handleRoleChange(newRole: string) {
    setRole(newRole)
    // Reset port if switching to a non-authority role
    if (!isAuthorityRole(newRole)) {
      setAssignedPort('')
    }
  }

  return (
    <Card className="border shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">{isRegister ? 'Crear Cuenta' : 'Iniciar Sesion'}</CardTitle>
        <CardDescription>
          {isRegister
            ? 'Complete el formulario para registrarse'
            : 'Ingrese sus credenciales para acceder al sistema'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Juan Perez"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electronico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contrasena</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={isRegister ? 8 : undefined}
            />
          </div>

          {isRegister && (
            <>
              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Usuario</Label>
                <Select value={role} onValueChange={handleRoleChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione su rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="naviera">Agente Naviero</SelectItem>
                    <SelectItem value="capitan_puerto">Capitania de Puerto</SelectItem>
                    <SelectItem value="aduanas">Aduanas</SelectItem>
                    <SelectItem value="migracion">Migracion</SelectItem>
                    <SelectItem value="salud">Sanidad</SelectItem>
                    <SelectItem value="senassa">SENASA</SelectItem>
                    <SelectItem value="oficial_cim">Oficial CIM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showPortSelector && (
                <div className="space-y-2">
                  <Label htmlFor="assigned_port">Puerto Asignado</Label>
                  <Select value={assignedPort} onValueChange={setAssignedPort} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el puerto" />
                    </SelectTrigger>
                    <SelectContent>
                      {HONDURAS_PORTS.map((port) => (
                        <SelectItem key={port.value} value={port.value}>
                          {port.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Solo podra ver los arribos destinados a este puerto
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="company_name">Empresa (Opcional)</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  type="text"
                  placeholder="Nombre de la empresa"
                />
              </div>
            </>
          )}

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Procesando...' : isRegister ? 'Crear Cuenta' : 'Iniciar Sesion'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              setError(null)
              setRole('')
              setAssignedPort('')
            }}
            className="text-primary hover:underline"
          >
            {isRegister
              ? 'Ya tiene cuenta? Inicie sesion'
              : 'No tiene cuenta? Registrese'}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
