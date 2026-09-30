import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, AuthMeResponse } from '@virtua-lms/types';
import { keycloak } from './keycloak';
import { apiClient } from '../services/apiClient';
import { AuthContext } from './context';
let initialization: Promise<boolean> | undefined;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshUser = useCallback(async () => {
    setError(null);
    try {
      const response = await apiClient.get<AuthMeResponse>('/auth/me');
      setUser(response.user);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : 'Unable to load your account.');
    }
  }, []);
  useEffect(() => {
    let active = true;
    initialization ??= keycloak.init({ onLoad: 'check-sso', checkLoginIframe: false, pkceMethod: 'S256' });
    initialization.then(async auth => {
      if (!active) return;
      setAuthenticated(auth);
      if (auth) await refreshUser();
      if (active) setInitialized(true);
    }).catch(() => {
      if (active) { setError('Unable to connect to sign-in. Check your connection and try again.'); setInitialized(true); }
    });
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).then(() => refreshUser()).catch(() => {
        setAuthenticated(false); setUser(null); setError('Your session has expired. Please sign in again.');
      });
    };
    return () => { active = false; };
  }, [refreshUser]);
  return <AuthContext.Provider value={{ initialized, authenticated, user, error, refreshUser, token: keycloak.token,
    login: () => { void keycloak.login({ redirectUri: window.location.origin + window.location.pathname }); },
    logout: () => { void keycloak.logout({ redirectUri: window.location.origin }); },
    apiFetch: async (input, init) => { await keycloak.updateToken(30); const headers = new Headers(init?.headers); if (keycloak.token) headers.set('Authorization', `Bearer ${keycloak.token}`); return fetch(input, { ...init, headers }); },
  }}>{children}</AuthContext.Provider>;
}
