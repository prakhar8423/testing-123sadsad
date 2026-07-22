import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

const THEME_KEY = 'fieldpost-theme'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }
  }, [])

  function handleToggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleToggle} aria-label="Toggle color theme">
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
