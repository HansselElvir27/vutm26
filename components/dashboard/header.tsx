'use client'

import { useState } from 'react'
import { logout } from '@/app/actions/auth'
import { updateProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { User } from '@/lib/db'
import { useLanguage } from '@/lib/language-context'
import { LogOut, User as UserIcon, ChevronDown, Lock, BadgeCheck } from 'lucide-react'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  user: User
}

export function DashboardHeader({ user }: HeaderProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()

  const [profileOpen, setProfileOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast({ title: t('common.error'), description: 'Las contraseñas nuevas no coinciden', variant: 'destructive' })
      return
    }

    setLoading(true)
    const res = await updateProfile({
      name: formData.name,
      currentPassword: formData.currentPassword || undefined,
      newPassword: formData.newPassword || undefined,
    })
    setLoading(false)

    if (res.error) {
      toast({ title: t('common.error'), description: res.error, variant: 'destructive' })
    } else {
      toast({ title: t('common.success'), description: 'Perfil actualizado correctamente' })
      setProfileOpen(false)
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' })
      router.refresh()
    }
  }

  return (
    <>
      <header className="h-16 border-b border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {t('app.title')}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden md:inline text-sm font-medium">{user.name}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-primary font-medium">{t(`role.${user.role}`)}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <UserIcon className="w-4 h-4 mr-2" />
                {t('header.myProfile')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => logout()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('header.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Profile Modal */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" />
              Mi Perfil
            </DialogTitle>
            <DialogDescription>
              Actualice su nombre o cambie su contraseña de acceso al sistema
            </DialogDescription>
          </DialogHeader>

          {/* Read-only info */}
          <div className="rounded-md bg-muted/50 border p-3 space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Rol:</span>
              <span className="font-medium">{t(`role.${user.role}`)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="w-4 h-4 shrink-0 text-center text-xs">@</span>
              <span>{user.email}</span>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nombre Completo</Label>
              <Input
                id="profile-name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Cambio de contraseña (opcional — deje en blanco si no desea cambiarla)
              </p>

              {/* Current Password */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-current-pw">Contraseña Actual</Label>
                <Input
                  id="profile-current-pw"
                  type="password"
                  placeholder="••••••••"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-new-pw">Nueva Contraseña</Label>
                <Input
                  id="profile-new-pw"
                  type="password"
                  placeholder="•••••••• (Min. 8 caracteres)"
                  minLength={8}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-confirm-pw">Confirmar Nueva Contraseña</Label>
                <Input
                  id="profile-confirm-pw"
                  type="password"
                  placeholder="••••••••"
                  minLength={8}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setProfileOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('common.loading') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
