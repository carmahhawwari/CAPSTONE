import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const [sendButtonMissing, setSendButtonMissing] = useState(false);
  const plusActive =
    location.pathname === '/prompts' ||
    location.pathname === '/write' ||
    location.pathname === '/daily-spin';

  return (
    <nav className="bottom-pill-nav">
      <div className="bottom-pill-track">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `bottom-pill-link bottom-pill-link-left ${isActive ? 'bottom-pill-link-active' : ''}`}
        >
          home
        </NavLink>
        <NavLink
          to="/people"
          className={({ isActive }) => `bottom-pill-link bottom-pill-link-right ${isActive ? 'bottom-pill-link-active' : ''}`}
        >
          people
        </NavLink>
        <Link to="/prompts" className={`bottom-pill-plus ${plusActive ? 'bottom-pill-plus-active' : ''}`} aria-label="Start a new message">
          {sendButtonMissing ? (
            <span className="bottom-pill-plus-glyph">+</span>
          ) : (
            <img
              src="/images/send_button.png"
              alt=""
              className="bottom-pill-plus-image"
              onError={() => setSendButtonMissing(true)}
            />
          )}
        </Link>
      </div>
    </nav>
  );
}
