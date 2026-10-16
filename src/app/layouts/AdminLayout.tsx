import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Toaster } from '@/shared/ui/Toaster'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/**
 * The desktop frame: a fixed sidebar on the left and the page beside it under a top bar.
 * Below 1024px the sidebar becomes a drawer opened from the menu button.
 */
export function AdminLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-full bg-canvas">
      <aside className="hidden w-64 shrink-0 border-r border-line lg:block">
        <Sidebar />
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
        <main className="min-h-0 flex-1 overflow-y-auto bg-surface/50">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
