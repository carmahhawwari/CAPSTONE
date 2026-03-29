import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useOrbit } from '@/contexts/orbit';

export default function SignIn() {
  const { signIn } = useAuth();
  const { isOnboarded } = useOrbit();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    signIn(email, password);
    navigate(isOnboarded ? '/' : '/onboarding');
  };

  return (
    <div className="flex min-h-dvh flex-col justify-center px-4 py-10">
      <div className="orbit-card ticket-edge mx-auto max-w-[420px] rounded-[32px] px-6 py-8">
        <div className="dot-grid rounded-[24px] px-5 py-8">
          <p className="text-[12px] uppercase tracking-[0.34em] text-dusty">Working title</p>
          <h1 className="mt-3 font-[var(--font-display)] text-[48px] leading-none font-semibold text-ink">
            Orbit
          </h1>
          <p className="mt-4 max-w-[18rem] text-[18px] leading-7 text-muted">
            A tiny ritual for reaching out. The wheel picks the person. You bring the note.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-[18px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.86)] px-4 py-4 outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-[18px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.86)] px-4 py-4 outline-none"
            />

            <button type="submit" className="button-primary mt-3 rounded-[20px] px-5 py-4 text-[16px] font-semibold">
              Enter Orbit
            </button>
          </form>

          <p className="mt-5 text-center text-[14px] text-muted">
            New here?{' '}
            <Link to="/sign-up" className="font-semibold text-[color:var(--color-plum)]">
              Build your orbit
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
