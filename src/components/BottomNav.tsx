import { NavLink } from 'react-router-dom';
import { Home, Users, Clock, User } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home },
  { to: '/people', icon: Users },
  { to: '/history', icon: Clock },
  { to: '/profile', icon: User },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div
        className="liquid-glass-nav flex items-center gap-1 rounded-full px-2 py-2"
      >
        {tabs.map(({ to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-center w-[44px] h-[44px] rounded-full transition-all ${
                isActive ? 'liquid-glass-active text-primary' : 'text-tertiary'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.8} />
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
