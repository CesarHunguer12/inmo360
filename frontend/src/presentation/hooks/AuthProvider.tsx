import axios from 'axios';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../../domain/entities/user';
import { ApiAuthRepository } from '../../infrastructure/repositories/api-auth.repository';
import { getErrorMessage, TOKEN_KEY } from '../../infrastructure/api/http-client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  sessionError: string;
  signIn(email: string, password: string): Promise<User>;
  signUp(input: { email: string; fullName: string; password: string; phone?: string }): Promise<void>;
  signOut(): Promise<void>;
}

const authRepository = new ApiAuthRepository();
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    authRepository.currentUser()
      .then((currentUser) => {
        setUser(currentUser);
        setSessionError('');
      })
      .catch((reason: unknown) => {
        setUser(null);
        setSessionError(
          axios.isAxiosError(reason) && reason.response?.status === 401
            ? 'Tu sesión ya no es válida. Inicia sesión nuevamente.'
            : getErrorMessage(reason),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const expire = () => {
      setUser(null);
      setSessionError('Tu sesión expiró o ya no está autorizada. Inicia sesión nuevamente.');
    };
    window.addEventListener('inmo360:session-expired', expire);
    return () => window.removeEventListener('inmo360:session-expired', expire);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setSessionError('');
    const session = await authRepository.login(email, password);
    setUser(session.user);
    return session.user;
  }, []);

  const signUp = useCallback(async (input: { email: string; fullName: string; password: string; phone?: string }) => {
    await authRepository.register(input);
  }, []);

  const signOut = useCallback(async () => {
    await authRepository.logout();
    setUser(null);
    setSessionError('');
  }, []);

  const value = useMemo(() => ({ user, loading, sessionError, signIn, signUp, signOut }), [user, loading, sessionError, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return context;
}
