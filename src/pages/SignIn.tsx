import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(email, password);
    navigate('/');
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col justify-center px-5">
      <div className="w-full max-w-[400px] mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-[40px] font-bold text-primary tracking-[-0.02em] leading-none">
            Affirm
          </h1>
          <p className="text-[17px] text-secondary mt-3 leading-relaxed">
            Send meaningful words to<br />the people who matter.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="bg-surface rounded-2xl overflow-hidden">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-[14px] text-[16px] text-primary outline-none placeholder:text-meta bg-transparent border-b border-dividers"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-[14px] text-[16px] text-primary outline-none placeholder:text-meta bg-transparent"
            />
          </div>

          <button
            type="submit"
            className="bg-primary text-white rounded-2xl py-[16px] text-[16px] font-semibold mt-4 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            Sign In
          </button>

          <p className="text-center text-secondary text-[15px] mt-6">
            Don't have an account?{' '}
            <Link to="/sign-up" className="text-indigo font-semibold">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
