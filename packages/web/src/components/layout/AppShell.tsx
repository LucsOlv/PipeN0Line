import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'
import { MobileNav } from './MobileNav'

export function AppShell() {
  return (
    <div className="bg-background text-on-surface min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      <AppHeader />
      <AppSidebar />
      <main className="md:ml-64 pt-20 px-8 pb-20 md:pb-12">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
