'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import type { User } from '@/lib/db'
import {
  LayoutDashboard,
  Ship,
  FileText,
  CheckCircle,
  Users,
  ClipboardList,
  Anchor,
  BarChart3,
} from 'lucide-react'

interface SidebarProps {
  user: User
}

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useLanguage()

  const navigation = getNavigationItems(user.role, t)

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo-vutm.jpg"
            alt="Marina Mercante"
            width={40}
            height={40}
            className="rounded"
          />
          <div>
            <h1 className="font-bold text-sm">VUTMHN</h1>
            <p className="text-xs text-sidebar-foreground/70">Marina Mercante</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-medium text-sidebar-accent-foreground">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {t(`role.${user.role}`)}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function getNavigationItems(role: User['role'], t: (key: string) => string) {
  const common = [
    { href: '/dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
  ]

  const agentItems = [
    { href: '/dashboard/arrivals', label: t('sidebar.myArrivals'), icon: Ship },
    { href: '/dashboard/arrivals/new', label: t('sidebar.newArrival'), icon: ClipboardList },
    { href: '/dashboard/documents', label: t('sidebar.documents'), icon: FileText },
  ]

  const authorityItems = [
    { href: '/dashboard/arrivals', label: t('sidebar.arrivals'), icon: Ship },
    { href: '/dashboard/approvals', label: t('sidebar.approvals'), icon: CheckCircle },
    { href: '/dashboard/documents', label: t('sidebar.documents'), icon: FileText },
    { href: '/dashboard/analytics', label: t('sidebar.statistics'), icon: BarChart3 },
  ]

  const adminItems = [
    { href: '/dashboard/arrivals', label: t('sidebar.allArrivals'), icon: Ship },
    { href: '/dashboard/approvals', label: t('sidebar.approvals'), icon: CheckCircle },
    { href: '/dashboard/documents', label: t('sidebar.documents'), icon: FileText },
    { href: '/dashboard/analytics', label: t('sidebar.statistics'), icon: BarChart3 },
    { href: '/dashboard/users', label: t('sidebar.users'), icon: Users },
  ]

  switch (role) {
    case 'admin':
      return [...common, ...adminItems]
    case 'naviera':
      return [...common, ...agentItems]
    default:
      return [...common, ...authorityItems]
  }
}
