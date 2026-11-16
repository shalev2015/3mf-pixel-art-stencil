import type { AuthUser } from '@/lib/types';
import { AUTH_ACCOUNTS_STORAGE_KEY, AUTH_SESSION_STORAGE_KEY } from '@/lib/constants/storage';
import { generateId } from '@/lib/utils/id';

interface StoredAccount {
  user: AuthUser;
  passwordHash?: string;
}

const AVATAR_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#ef4444'
];

function pickAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function hashPassword(raw: string): string {
  let h1 = 0xdeadbeef ^ raw.length;
  let h2 = 0x41c6ce57 ^ raw.length;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(AUTH_ACCOUNTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]): void {
  try {
    localStorage.setItem(AUTH_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    /* ignore storage error */
  }
}

export function loadSessionUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    return parsed && parsed.id && parsed.username ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSessionUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  } catch {
    /* ignore storage error */
  }
}

export interface AuthResult {
  ok: boolean;
  user?: AuthUser;
  error?: string;
}

/** Signs in with username & password; if the username does not exist yet, creates the account. */
export function authenticateWithPassword(
  rawUsername: string,
  rawPassword: string,
  mode: 'signin' | 'signup'
): AuthResult {
  const cleanUsername = rawUsername.trim();
  if (!cleanUsername) {
    return { ok: false, error: 'Please enter a username.' };
  }
  if (rawPassword.length < 3) {
    return { ok: false, error: 'Password must be at least 3 characters.' };
  }

  const accounts = loadAccounts();
  const normalized = cleanUsername.toLowerCase();
  const existing = accounts.find(
    a => a.user.provider === 'password' && a.user.username.toLowerCase() === normalized
  );
  const digest = hashPassword(rawPassword);

  if (mode === 'signup') {
    if (existing) {
      return { ok: false, error: `Username "${cleanUsername}" is already taken.` };
    }
    const newUser: AuthUser = {
      id: `usr_${generateId()}`,
      username: cleanUsername,
      displayName: cleanUsername,
      provider: 'password',
      avatarColor: pickAvatarColor(normalized)
    };
    saveAccounts([...accounts, { user: newUser, passwordHash: digest }]);
    saveSessionUser(newUser);
    return { ok: true, user: newUser };
  }

  // In 'signin' mode: if account exists, check password; if not found, auto-create for convenience
  if (existing) {
    if (existing.passwordHash !== digest) {
      return { ok: false, error: 'Incorrect password for this username.' };
    }
    saveSessionUser(existing.user);
    return { ok: true, user: existing.user };
  }

  const createdUser: AuthUser = {
    id: `usr_${generateId()}`,
    username: cleanUsername,
    displayName: cleanUsername,
    provider: 'password',
    avatarColor: pickAvatarColor(normalized)
  };
  saveAccounts([...accounts, { user: createdUser, passwordHash: digest }]);
  saveSessionUser(createdUser);
  return { ok: true, user: createdUser };
}

/** Signs in or registers a Google account locally. */
export function authenticateWithGoogle(rawEmail: string, rawDisplayName?: string): AuthResult {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Please enter a valid Google email address.' };
  }

  const accounts = loadAccounts();
  const existing = accounts.find(
    a => a.user.provider === 'google' && a.user.email?.toLowerCase() === email
  );

  if (existing) {
    saveSessionUser(existing.user);
    return { ok: true, user: existing.user };
  }

  const localPart = email.split('@')[0] || 'Google User';
  const displayName = (rawDisplayName || '').trim() || localPart;
  const googleUser: AuthUser = {
    id: `ggl_${generateId()}`,
    username: localPart,
    displayName,
    email,
    provider: 'google',
    avatarColor: pickAvatarColor(email)
  };

  saveAccounts([...accounts, { user: googleUser }]);
  saveSessionUser(googleUser);
  return { ok: true, user: googleUser };
}

/** Returns previously used Google accounts on this browser for one-click sign-in. */
export function listSavedGoogleAccounts(): AuthUser[] {
  return loadAccounts()
    .filter(a => a.user.provider === 'google')
    .map(a => a.user);
}
