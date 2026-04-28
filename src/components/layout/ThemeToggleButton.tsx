import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from '../../hooks/use-theme'
import { Button } from '../ui/button'

export function ThemeToggleButton() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      onClick={toggleTheme}
      className="shrink-0"
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </Button>
  )
}