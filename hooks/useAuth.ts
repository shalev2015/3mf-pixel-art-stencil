'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AuthUser } from '@/lib/types';
import {
  authenticateWithPassword,
  loadSessionUser,
  saveSessionUser,
  type AuthResult
} from '@/lib/auth/storage';

/** Manages the current signed-in user session and login/logout actions. */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    setUser(loadSessionUser());
    setIsAuthLoaded(true);
  }, []);

  const loginWithPassword = useCallback(
    (username: string, password: string, mode: 'signin' | 'signup' = 'signin'): AuthResult => {
      const res = authenticateWithPassword(username, password, mode);
      if (res.ok && res.user) {
        setUser(res.user);
      }
      return res;
    },
    []
  );

  const logout = useCallback(() => {
    saveSessionUser(null);
    setUser(null);
  }, []);

  return {
    user,
    isAuthLoaded,
    loginWithPassword,
    logout
  };
}
