import { createContext, useContext } from 'react';
import type { AuthContextType } from '@virtua-lms/types';

export type ConsoleAuth = AuthContextType & { error: string | null; refreshUser: () => Promise<void> };
export const AuthContext = createContext<ConsoleAuth>({ initialized: false, authenticated: false, user: null, token: undefined, error: null, login: () => {}, logout: () => {}, refreshUser: async () => {}, apiFetch: async () => { throw new Error('Authentication unavailable'); } });
export const useAuth = () => useContext(AuthContext);
