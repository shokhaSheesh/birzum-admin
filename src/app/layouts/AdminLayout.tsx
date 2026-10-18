import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Toaster } from '@/shared/ui/Toaster'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const COLLAPSED_KEY = 'birzum-admin.sidebar-collapsed'

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * The desktop frame: a fixed sidebar on the left and the page beside it under a top bar.
 * The sidebar collapses to icons, remembered per browser. Below 1024px it becomes a drawer
 * opened from the menu button.
 */
export function AdminLayout() {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const toggle = () => {
    setCollapsed(!collapsed)
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? '0' : '1')
    } catch {
      // Private window: the choice lasts until reload
    }
  }

  return (
    <div className="flex h-full bg-canvas">
      <aside
        className={cn(
          'hidden shrink-0 border-r border-line transition-[width] duration-200 lg:block',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </aside>

      <div
        className={cn('fixed inset-0 z-40 lg:hidden', !open && 'pointer-events-none')}
        aria-hidden={!open}
      >
        <div
          className={cn(
            'absolute inset-0 bg-navy-950/45 transition-opacity',
            open ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-72 bg-canvas shadow-xl transition-transform',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Sidebar onNavigate={() => setOpen(false)} />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto bg-page">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
