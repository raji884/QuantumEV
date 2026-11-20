import {
  Atom,
  BarChart3,
  Brain,
  CalendarClock,
  Car,
  Gauge,
  LayoutDashboard,
  ListChecks,
  PlugZap,
  Settings,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { Role } from '../../types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  roles: Role[]
  hint: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Dashboards',
    items: [
      {
        to: '/app/admin',
        label: 'Admin Dashboard',
        icon: LayoutDashboard,
        roles: ['admin'],
        hint: 'Whole-platform operational overview',
      },
      {
        to: '/app/owner',
        label: 'EV Owner Dashboard',
        icon: Car,
        roles: ['owner'],
        hint: 'Your vehicles, charging and spend',
      },
    ],
  },
  {
    title: 'Charging operations',
    items: [
      {
        to: '/app/vehicles',
        label: 'Vehicle Management',
        icon: Car,
        roles: ['admin', 'owner'],
        hint: 'Fleet and vehicle registry',
      },
      {
        to: '/app/requests',
        label: 'Charging Requests',
        icon: ListChecks,
        roles: ['admin', 'owner', 'operator'],
        hint: 'Request intake and assignment',
      },
      {
        to: '/app/stations',
        label: 'Charging Stations',
        icon: PlugZap,
        roles: ['admin', 'operator'],
        hint: 'Station status and pricing',
      },
    ],
  },
  {
    title: 'Grid & intelligence',
    items: [
      {
        to: '/app/grid',
        label: 'Smart Grid Monitoring',
        icon: Gauge,
        roles: ['admin', 'operator'],
        hint: 'Live load, solar, battery and zones',
      },
      {
        to: '/app/ai',
        label: 'AI Prediction Dashboard',
        icon: Brain,
        roles: ['admin', 'operator'],
        hint: 'Demand, price and solar forecasts',
      },
      {
        to: '/app/quantum',
        label: 'Quantum Optimization',
        icon: Atom,
        roles: ['admin', 'operator'],
        hint: 'QUBO, QAOA and CP-SAT comparison',
      },
      {
        to: '/app/schedule',
        label: 'Charging Schedule Results',
        icon: CalendarClock,
        roles: ['admin', 'owner', 'operator'],
        hint: 'Per-EV optimised slot assignments',
      },
    ],
  },
  {
    title: 'Insights',
    items: [
      {
        to: '/app/analytics',
        label: 'Analytics and Reports',
        icon: BarChart3,
        roles: ['admin', 'operator', 'owner'],
        hint: 'Energy, cost and CO₂ reporting',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        to: '/app/profile',
        label: 'User Profile',
        icon: User,
        roles: ['admin', 'owner', 'operator'],
        hint: 'Your account details',
      },
      {
        to: '/app/settings',
        label: 'Settings',
        icon: Settings,
        roles: ['admin', 'owner', 'operator'],
        hint: 'Preferences, roles and demo controls',
      },
    ],
  },
]
