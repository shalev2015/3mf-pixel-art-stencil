'use client';

import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/lib/types';

interface UserAuthButtonProps {
  user: AuthUser | null;
  onLogout: () => void;
}

/** Header control that shows a Sign In button for guests or the active account badge + Sign Out. */
export default function UserAuthButton({ user, onLogout }: UserAuthButtonProps) {
  const router = useRouter();

  if (!user) {
    return (
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => router.push('/login/')}
        title="Sign In or Create Account"
        aria-label="Sign In"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span className="btn-label">Sign In</span>
      </button>
    );
  }

  return (
    <div className="user-header-chip">
      <button
        type="button"
        className="user-chip-profile"
        onClick={() => router.push('/login/')}
        title={`Signed in as ${user.displayName} — Click to switch account`}
      >
        <span className="user-avatar-dot" style={{ backgroundColor: user.avatarColor }}>
          {user.displayName.slice(0, 1).toUpperCase()}
        </span>
        <span className="btn-label user-chip-name">{user.displayName}</span>
      </button>
      <button
        type="button"
        className="user-chip-logout"
        onClick={onLogout}
        title="Sign Out"
        aria-label="Sign Out"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  );
}
