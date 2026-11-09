import { ChartColumn, Cuboid, LayoutDashboard, SlidersHorizontal, Users, Workflow, type LucideIcon } from 'lucide-react'
import type { Role } from '@/domain/types'

export interface NavItem {
  to: string
  label: string
  shortLabel: string
  icon: LucideIcon
  roles: Role[]
  group: 'production' | 'presentation' | 'admin'
  /** Не показывать в нижней панели телефона (доступно из меню пользователя). */
  desktopOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Обзор производства', shortLabel: 'Обзор', icon: LayoutDashboard, roles: ['manager'], group: 'production' },
  { to: '/twin', label: 'Цифровой двойник', shortLabel: 'Двойник', icon: Workflow, roles: ['manager'], group: 'production' },
  { to: '/scenarios', label: 'Сценарии', shortLabel: 'Сценарии', icon: SlidersHorizontal, roles: ['manager'], group: 'production' },
  { to: '/analytics', label: 'Аналитика', shortLabel: 'Аналитика', icon: ChartColumn, roles: ['manager'], group: 'production' },
  { to: '/tour', label: '3D-тур', shortLabel: '3D-тур', icon: Cuboid, roles: ['manager', 'guest'], group: 'presentation' },
  { to: '/users', label: 'Пользователи', shortLabel: 'Доступ', icon: Users, roles: ['manager'], group: 'admin', desktopOnly: true },
]
