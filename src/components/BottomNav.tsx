import { NavLink } from 'react-router-dom';
import { CircleDot, Inbox, Orbit, UserRound } from 'lucide-react';

const tabs = [
  { to: '/', icon: CircleDot, label: 'Spin' },
  { to: '/history', icon: Inbox, label: 'Letterbox' },
  { to: '/people', icon: Orbit, label: 'Orbit' },
  { to: '/profile', icon: UserRound, label: 'You' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[390px] -translate-x-1/2">
      <div className="orbit-nav grid grid-cols-4 gap-2 rounded-[26px] px-3 py-3">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-medium transition-all ${
                isActive ? 'orbit-nav-active text-ink' : 'text-dusty'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
