'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'
import { getPortLabel, HONDURAS_PORTS, isAuthorityRole } from '@/lib/ports'
import { createUser, updateUser, deleteUser } from '@/app/actions/users'
import { useToast } from '@/components/ui/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  MapPin,
  Building2,
  Lock,
  UserCheck,
} from 'lucide-react'

// Defined roles
const ROLES = [
  'admin',
  'naviera',
  'capitan_puerto',
  'aduanas',
  'migracion',
  'salud',
  'senassa',
  'oficial_cim'
] as const

interface UserData {
  id: number
  email: string
  name: string
  role: string
  company_name: string | null
  assigned_port: string | null
  created_at: string
  updated_at: string
}

interface UsersClientProps {
  initialUsers: UserData[]
  currentUser: {
    id: number
    role: string
  }
}

export function UsersClient({ initialUsers, currentUser }: UsersClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [portFilter, setPortFilter] = useState<string>('all')

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Selected user for Edit/Delete
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)

  // Form Field States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'naviera' as string,
    password: '',
    companyName: '',
    assignedPort: '',
  })

  // Set form when editing
  useEffect(() => {
    if (selectedUser) {
      setFormData({
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        password: '', // blank by default for edit
        companyName: selectedUser.company_name || '',
        assignedPort: selectedUser.assigned_port || '',
      })
    }
  }, [selectedUser])

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return initialUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesPort =
        portFilter === 'all' || user.assigned_port === portFilter

      return matchesSearch && matchesRole && matchesPort
    })
  }, [initialUsers, searchQuery, roleFilter, portFilter])

  // Reset form helper
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'naviera',
      password: '',
      companyName: '',
      assignedPort: '',
    })
    setSelectedUser(null)
  }

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await createUser({
      email: formData.email,
      name: formData.name,
      role: formData.role,
      password: formData.password,
      companyName: formData.role === 'naviera' ? formData.companyName : null,
      assignedPort: isAuthorityRole(formData.role) ? formData.assignedPort : null,
    })

    setLoading(false)

    if (res.error) {
      toast({
        title: t('common.error'),
        description: res.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: t('common.success'),
        description: t('users.successCreate'),
      })
      setIsCreateOpen(false)
      resetForm()
      router.refresh()
    }
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setLoading(true)

    const res = await updateUser(selectedUser.id, {
      email: formData.email,
      name: formData.name,
      role: formData.role,
      password: formData.password || undefined,
      companyName: formData.role === 'naviera' ? formData.companyName : null,
      assignedPort: isAuthorityRole(formData.role) ? formData.assignedPort : null,
    })

    setLoading(false)

    if (res.error) {
      toast({
        title: t('common.error'),
        description: res.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: t('common.success'),
        description: t('users.successUpdate'),
      })
      setIsEditOpen(false)
      resetForm()
      router.refresh()
    }
  }

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return
    setLoading(true)

    const res = await deleteUser(selectedUser.id)
    setLoading(false)

    if (res.error) {
      toast({
        title: t('common.error'),
        description: res.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: t('common.success'),
        description: t('users.successDelete'),
      })
      setIsDeleteOpen(false)
      resetForm()
      router.refresh()
    }
  }

  // Helper styling for Roles Badges
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300'
      case 'naviera':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
      case 'oficial_cim':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300'
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('users.title')}</h1>
          <p className="text-muted-foreground">{t('users.description')}</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <UserPlus className="w-4 h-4 mr-2" />
          {t('users.newUser')}
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('users.searchPlaceholder')}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.allRoles')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('users.allRoles')}</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`role.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Port Filter */}
            <Select value={portFilter} onValueChange={setPortFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.allPorts')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('users.allPorts')}</SelectItem>
                {HONDURAS_PORTS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('sidebar.users')}</CardTitle>
          <CardDescription>
            {searchQuery || roleFilter !== 'all' || portFilter !== 'all'
              ? `${filteredUsers.length} resultados encontrados`
              : `${initialUsers.length} usuarios registrados en total`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.name')}</TableHead>
                  <TableHead>{t('users.email')}</TableHead>
                  <TableHead>{t('users.role')}</TableHead>
                  <TableHead>{t('users.company')} / {t('users.port')}</TableHead>
                  <TableHead className="text-right">{t('users.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('users.noUsers')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={`border font-semibold ${getRoleBadgeStyle(user.role)}`} variant="outline">
                          {t(`role.${user.role}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === 'naviera' && user.company_name && (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Building2 className="w-3.5 h-3.5" />
                            {user.company_name}
                          </span>
                        )}
                        {isAuthorityRole(user.role) && user.assigned_port && (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {getPortLabel(user.assigned_port)}
                          </span>
                        )}
                        {!user.company_name && !user.assigned_port && (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={user.id === currentUser.id}
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              {t('users.newUser')}
            </DialogTitle>
            <DialogDescription>
              {t('users.description')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="create-name">{t('users.name')}</Label>
              <Input
                id="create-name"
                required
                placeholder="Nombre Completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="create-email">{t('users.email')}</Label>
              <Input
                id="create-email"
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="create-password">{t('users.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="create-password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="•••••••• (Min. 8 caracteres)"
                  className="pl-9"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {/* Role Select */}
            <div className="space-y-1.5">
              <Label htmlFor="create-role">{t('users.role')}</Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val, companyName: '', assignedPort: '' })}
              >
                <SelectTrigger id="create-role">
                  <SelectValue placeholder={t('users.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`role.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Input: Naviera Company Name */}
            {formData.role === 'naviera' && (
              <div className="space-y-1.5">
                <Label htmlFor="create-company">{t('users.company')}</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="create-company"
                    required
                    placeholder={t('users.companyPlaceholder')}
                    className="pl-9"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Conditional Input: Authority Assigned Port */}
            {isAuthorityRole(formData.role) && (
              <div className="space-y-1.5">
                <Label htmlFor="create-port">{t('users.port')}</Label>
                <Select
                  value={formData.assignedPort}
                  onValueChange={(val) => setFormData({ ...formData, assignedPort: val })}
                  required
                >
                  <SelectTrigger id="create-port">
                    <SelectValue placeholder={t('users.selectPort')} />
                  </SelectTrigger>
                  <SelectContent>
                    {HONDURAS_PORTS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('common.loading') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {t('users.editUser')}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">{t('users.name')}</Label>
              <Input
                id="edit-name"
                required
                placeholder="Nombre Completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">{t('users.email')}</Label>
              <Input
                id="edit-email"
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Password (Optional in Edit) */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-password">{t('users.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="•••••••• (Dejar en blanco para mantener)"
                  minLength={8}
                  className="pl-9"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{t('users.passwordHelp')}</p>
            </div>

            {/* Role Select */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-role">{t('users.role')}</Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val, companyName: '', assignedPort: '' })}
                disabled={selectedUser?.id === currentUser.id} // Disable changing own role
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder={t('users.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`role.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Input: Naviera Company Name */}
            {formData.role === 'naviera' && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-company">{t('users.company')}</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-company"
                    required
                    placeholder={t('users.companyPlaceholder')}
                    className="pl-9"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Conditional Input: Authority Assigned Port */}
            {isAuthorityRole(formData.role) && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-port">{t('users.port')}</Label>
                <Select
                  value={formData.assignedPort}
                  onValueChange={(val) => setFormData({ ...formData, assignedPort: val })}
                  required
                >
                  <SelectTrigger id="edit-port">
                    <SelectValue placeholder={t('users.selectPort')} />
                  </SelectTrigger>
                  <SelectContent>
                    {HONDURAS_PORTS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('common.loading') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM ALERT DIALOG */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              {t('users.deleteUser')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t('users.deleteConfirm')}{' '}
                <strong className="text-foreground">{selectedUser?.name} ({selectedUser?.email})</strong>?
              </p>
              <p className="text-sm text-destructive bg-destructive/5 p-3 rounded-md border border-destructive/10">
                {t('users.deleteWarning')}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={loading}
              onClick={handleDeleteConfirm}
            >
              {loading ? t('common.loading') : t('arrivals.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
