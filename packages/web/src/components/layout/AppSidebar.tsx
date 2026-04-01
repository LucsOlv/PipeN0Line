import { NavLink } from 'react-router-dom'
import { Icon } from '../ui/Icon'

const navItems = [
  { to: '/', label: 'Overview', icon: 'dashboard', end: true },
  { to: '/run/new', label: 'Runs', icon: 'play_circle' },
  { to: '/tasks', label: 'Tasks', icon: 'task_alt' },
  { to: '/logs', label: 'Logs', icon: 'receipt_long' },
  { to: '/nodes', label: 'Nodes', icon: 'lan' },
  { to: '/workflows', label: 'Workflows', icon: 'account_tree' },
  { to: '#', label: 'Vault', icon: 'lock' },
  { to: '#', label: 'Analytics', icon: 'analytics' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

export function AppSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full flex-col pt-20 pb-8 z-40 bg-[#1a1a1a] w-64 shadow-[4px_0_24px_rgba(0,0,0,0.5)] hidden md:flex">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 p-3 bg-surface-container-highest rounded-xl">
          <div className="w-10 h-10 bg-primary-dim rounded-lg flex items-center justify-center">
            <Icon name="terminal" className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#9ba8ff] font-space-grotesk">Kinetic Terminal</h2>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">v2.4.0-stable</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive
                ? 'bg-[#262626] text-[#9ba8ff] border-r-4 border-[#3D5AFE] flex items-center px-4 py-3 ml-2 rounded-l-lg group'
                : 'text-[#adaaaa] flex items-center px-4 py-3 hover:bg-[#262626]/50 transition-transform duration-200 hover:translate-x-1'
            }
          >
            <Icon name={item.icon} className="mr-3" />
            <span className="font-label text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 mt-auto space-y-1 pt-4 border-t border-white/5">
        <a className="text-[#adaaaa] flex items-center px-4 py-2 hover:text-white transition-colors" href="#">
          <Icon name="help" className="mr-3 text-lg" />
          <span className="font-label text-xs">Help</span>
        </a>
        <a className="text-[#adaaaa] flex items-center px-4 py-2 hover:text-white transition-colors" href="#">
          <Icon name="description" className="mr-3 text-lg" />
          <span className="font-label text-xs">Docs</span>
        </a>
      </div>
    </aside>
  )
}
