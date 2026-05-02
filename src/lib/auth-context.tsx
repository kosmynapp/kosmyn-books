'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_KOSMYN_API_URL ?? 'https://api.kosmyn.com/api/v1';
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? 'default';

interface User {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (googleIdToken: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ verificationRequired: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('kosmyn_token');
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': DEFAULT_TENANT_ID,
          },
        });

        if (!res.ok) {
          const refreshToken = localStorage.getItem('kosmyn_refresh');
          if (refreshToken) {
            const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              localStorage.setItem('kosmyn_token', refreshData.accessToken);
              document.cookie = `kosmyn_token=${refreshData.accessToken}; path=/; SameSite=Lax; max-age=${7 * 24 * 60 * 60}`;

              const retryRes = await fetch(`${API_BASE}/users/me`, {
                headers: {
                  Authorization: `Bearer ${refreshData.accessToken}`,
                  'X-Tenant-Id': DEFAULT_TENANT_ID,
                },
              });

              if (retryRes.ok) {
                const userData = await retryRes.json();
                const u = buildUser(userData, refreshData.accessToken);
                if (u) {
                  setUser(u);
                  setLoading(false);
                  return;
                }
              }
            }
          }
          clearTokens();
        } else {
          const userData = await res.json();
          const u = buildUser(userData, token);
          if (u) setUser(u);
        }
      } catch {
        clearTokens();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function buildUser(
    userData: Record<string, unknown>,
    token: string,
  ): User | null {
    const payload = decodeJwtPayload(token);
    return {
      uid: (payload.sub as string) || '',
      email: (userData.email as string) || '',
      displayName:
        (userData.displayName as string) || (userData.email as string) || '',
    };
  }

  function clearTokens() {
    localStorage.removeItem('kosmyn_token');
    localStorage.removeItem('kosmyn_refresh');
    document.cookie = 'kosmyn_token=; path=/; max-age=0';
    document.cookie = 'kosmyn_refresh=; path=/; max-age=0';
    setUser(null);
  }

  async function signIn(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Credenciais inválidas');
      }

      const data = await res.json();
      localStorage.setItem('kosmyn_token', data.accessToken);
      localStorage.setItem('kosmyn_refresh', data.refreshToken);
      document.cookie = `kosmyn_token=${data.accessToken}; path=/; SameSite=Lax; max-age=${7 * 24 * 60 * 60}`;
      document.cookie = `kosmyn_refresh=${data.refreshToken}; path=/; SameSite=Lax; max-age=${30 * 24 * 60 * 60}`;

      const u = buildUser(data.user, data.accessToken);
      if (u) setUser(u);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao entrar';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle(googleIdToken: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleIdToken }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === 'INVITE_REQUIRED') {
          throw new Error(
            'Conta Google ainda não cadastrada. Baixe o app Kosmyn para criar sua conta.',
          );
        }
        throw new Error(body.error || 'Falha ao entrar com Google');
      }

      const data = await res.json();
      localStorage.setItem('kosmyn_token', data.accessToken);
      localStorage.setItem('kosmyn_refresh', data.refreshToken);
      document.cookie = `kosmyn_token=${data.accessToken}; path=/; SameSite=Lax; max-age=${7 * 24 * 60 * 60}`;
      document.cookie = `kosmyn_refresh=${data.refreshToken}; path=/; SameSite=Lax; max-age=${30 * 24 * 60 * 60}`;

      const u = buildUser(data.user, data.accessToken);
      if (u) setUser(u);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao entrar com Google';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string, displayName: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, source: 'books-web' }),
      });

      const data = await res.json().catch(() => ({} as Record<string, unknown>));

      if (!res.ok) {
        const errCode = (data as { error?: string }).error || 'Falha ao criar conta';
        const friendly: Record<string, string> = {
          INVITE_REQUIRED: 'Cadastros públicos estão desativados no momento.',
          'Email already registered': 'Este e-mail já está cadastrado. Faça login.',
        };
        throw new Error(friendly[errCode] || errCode);
      }

      // /auth/register returns { message: 'VERIFICATION_REQUIRED', email } and does
      // NOT issue tokens — user must verify before they can rate/suggest. Books site
      // routes them to /verify-email next.
      return { verificationRequired: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao criar conta';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    clearTokens();
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signIn, signInWithGoogle, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
