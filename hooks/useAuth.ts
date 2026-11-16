'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AuthUser } from '@/lib/types';
import {
  authenticateWithEmail,
  authenticateWithPassword,
  listSavedEmailAccounts,
  loadSessionUser,
  saveSessionUser,
  type AuthResult
} from '@/lib/auth/storage';

/** Manages the current signed-in user session and login/logout actions. */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [savedEmailAccounts, setSavedEmailAccounts] = useState<AuthUser[]>([]);

  useEffect(() => {
    setUser(loadSessionUser());
    setSavedEmailAccounts(listSavedEmailAccounts());
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

  const loginWithEmail = useCallback((email: string, displayName?: string): AuthResult => {
    const res = authenticateWithEmail(email, displayName);
    if (res.ok && res.user) {
      setUser(res.user);
      setSavedEmailAccounts(listSavedEmailAccounts());
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    saveSessionUser(null);
    setUser(null);
  }, []);

  return {
    user,
    savedEmailAccounts,
    loginWithPassword,
    loginWithEmail,
    logout
  };
}
