import { NavLink } from 'react-router-dom'
import { Icon } from '../ui/Icon'

export function AppHeader() {
  return (
    <header className="bg-[#0e0e0e] flex justify-between items-center w-full px-8 py-4 h-16 border-b border-white/10 fixed top-0 z-50">
      <div className="flex items-center gap-8">
        <span className="text-2xl font-bold tracking-tighter text-[#9ba8ff] font-space-grotesk">
          Task Runner
        </span>
        <nav className="hidden md:flex items-center space-x-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? 'text-[#9ba8ff] border-b-2 border-[#9ba8ff] pb-1 font-bold font-label text-sm'
                : 'text-[#adaaaa] hover:text-[#9ba8ff] transition-colors font-label text-sm'
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/run/new"
            className={({ isActive }) =>
              isActive
                ? 'text-[#9ba8ff] border-b-2 border-[#9ba8ff] pb-1 font-bold font-label text-sm'
                : 'text-[#adaaaa] hover:text-[#9ba8ff] transition-colors font-label text-sm'
            }
          >
            Pipelines
          </NavLink>
          <a className="text-[#adaaaa] hover:text-[#9ba8ff] transition-colors font-label text-sm" href="#">
            Logs
          </a>
          <a className="text-[#adaaaa] hover:text-[#9ba8ff] transition-colors font-label text-sm" href="#">
            Schedule
          </a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden lg:block">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" />
          <input
            className="bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest transition-all"
            placeholder="Search pipelines..."
            type="text"
          />
        </div>
        <button className="text-on-surface-variant hover:bg-[#262626] p-2 rounded-full transition-all">
          <Icon name="notifications" />
        </button>
        <button className="text-on-surface-variant hover:bg-[#262626] p-2 rounded-full transition-all">
          <Icon name="settings" />
        </button>
        <NavLink
          to="/run/new"
          className="bg-primary text-on-primary font-bold px-4 py-2 rounded-lg text-sm hover:-translate-y-px active:scale-95 transition-all shadow-lg shadow-primary/10"
        >
          Adicionar
        </NavLink>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-highest flex items-center justify-center">
          <Icon name="person" className="text-on-surface-variant text-lg" />
        </div>
      </div>
    </header>
  )
}
