import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { AuthUser, AuthContextType } from '@virtua-lms/types';
import { keycloak } from './keycloak';

export type { AuthUser, AuthContextType };

const AuthContext = createContext<AuthContextType>({
  initialized: false,
  authenticated: false,
  user: null,
  token: undefined,
  login: () => {},
  logout: () => {},
  apiFetch: () => Promise.reject(new Error('Auth not initialized')),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | undefined>(undefined);
  const isInitializing = useRef(false);

  const extractUser = (): AuthUser | null => {
    if (!keycloak.authenticated || !keycloak.tokenParsed) return null;
    const p = keycloak.tokenParsed;
    const realmRoles = p.realm_access?.roles || [];
    const clientRoles = p.resource_access?.['virtua-lms']?.roles || [];
    const allRoles = Array.from(new Set([...realmRoles, ...clientRoles]));

    return {
      id: p.sub || '',
      username: p.preferred_username || p.sub || '',
      email: p.email || '',
      name: p.name || `${p.given_name || ''} ${p.family_name || ''}`.trim() || p.preferred_username || '',
      roles: allRoles,
    };
  };

  useEffect(() => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    keycloak
      .init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
        pkceMethod: 'S256',
      })
      .then((auth) => {
        setAuthenticated(auth);
        setToken(keycloak.token);
        if (auth) {
          setUser(extractUser());
        }
        setInitialized(true);
      })
      .catch((err) => {
        console.error('Keycloak initialization error:', err);
        setInitialized(true);
      });

    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed) {
            setToken(keycloak.token);
            setUser(extractUser());
          }
        })
        .catch(() => {
          setAuthenticated(false);
          setUser(null);
        });
    };
  }, []);

  const login = () => {
    keycloak.login({
      redirectUri: window.location.href,
    });
  };

  const logout = () => {
    keycloak.logout({
      redirectUri: window.location.origin,
    });
  };

  const apiFetch = async (input: string, init?: RequestInit): Promise<Response> => {
    if (keycloak.authenticated) {
      try {
        await keycloak.updateToken(30);
      } catch (e) {
        console.warn('Failed to update token before request', e);
      }
    }
    const headers = new Headers(init?.headers || {});
    if (keycloak.token) {
      headers.set('Authorization', `Bearer ${keycloak.token}`);
    }
    return fetch(input, {
      ...init,
      headers,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        initialized,
        authenticated,
        user,
        token,
        login,
        logout,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
