import {
  Building2,
  FileArchive,
  Home,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react'

export const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/customers', label: 'Clientes', icon: Building2 },
  { href: '/renewals', label: 'Renovaciones', icon: ShieldCheck },
  { href: '/documents', label: 'Documentos', icon: FileArchive },
  { href: '/settings', label: 'Administracion', icon: Settings },
]

export const appBrand = {
  name: 'Renovaciones CRM',
  description: 'Cartera, contratos y avisos',
  icon: Zap,
}
