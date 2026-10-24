import { BarChart3, ClipboardList, LayoutDashboard, Sparkles } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, title: 'Command Center' },
  { to: '/records', label: 'Records', icon: ClipboardList, title: 'Waste Records' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, title: 'Recycling Analytics' },
  { to: '/forecast', label: 'AI Forecast', icon: Sparkles, title: 'AI Forecast' },
]

export const titleForPath = (pathname) =>
  NAV_ITEMS.find((item) => item.to === pathname)?.title ?? 'Page not found'
