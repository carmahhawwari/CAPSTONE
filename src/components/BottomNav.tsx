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
      <div className="flex items-center gap-1 bg-[#F1F1F1] backdrop-blur-xl rounded-full px-2 py-2 shadow-sm">
        {tabs.map(({ to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                isActive ? 'bg-white text-primary' : 'text-tertiary'
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
