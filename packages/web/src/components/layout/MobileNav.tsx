import { NavLink } from 'react-router-dom'
import { Icon } from '../ui/Icon'

const items = [
  { to: '/', label: 'Home', icon: 'dashboard', end: true },
  { to: '/run/new', label: 'Flows', icon: 'account_tree' },
  { to: '#', label: 'Nodes', icon: 'lan' },
  { to: '#', label: 'Config', icon: 'settings' },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full md:hidden bg-surface-container h-16 flex items-center justify-around z-50 px-4">
      {items.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center ${isActive ? 'text-primary' : 'text-on-surface-variant'}`
          }
        >
          <Icon name={item.icon} />
          <span className="text-[10px] font-bold mt-1">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
