import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '@/types';
import { createUser, getUserById, validateUser } from '@/lib/social-store';

const SESSION_KEY = 'orbit.prototype.session.user-id';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => string | null;
  signUp: (name: string, email: string, password: string) => string | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  signIn: () => null,
  signUp: () => null,
  signOut: () => {},
});

function getInitialUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const savedUserId = window.localStorage.getItem(SESSION_KEY);
  if (!savedUserId) {
    return null;
  }

  return getUserById(savedUserId);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);

  const signIn = (email: string, password: string) => {
    const validatedUser = validateUser(email, password);
    if (!validatedUser) {
      return 'Incorrect email or password.';
    }

    window.localStorage.setItem(SESSION_KEY, validatedUser.id);
    setUser(validatedUser);
    return null;
  };

  const signUp = (name: string, email: string, password: string) => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      return 'Name, email, and password are required.';
    }

    const { error, user: createdUser } = createUser({ name, email, password });
    if (error || !createdUser) {
      return error ?? 'Could not create account.';
    }

    window.localStorage.setItem(SESSION_KEY, createdUser.id);
    setUser(createdUser);
    return null;
  };

  const signOut = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
