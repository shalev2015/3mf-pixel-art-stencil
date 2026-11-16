'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import ThemeToggleButton from '@/components/common/ThemeToggleButton';

/** Full-screen login & sign-up view with Username/Password and Sign in with Google. */
export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, savedGoogleAccounts, loginWithPassword, loginWithGoogle, logout } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const res = loginWithPassword(username, password, mode);
    if (!res.ok) {
      setError(res.error || 'Could not sign in.');
      return;
    }
    router.push('/');
  };

  const handleGoogleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const res = loginWithGoogle(googleEmail, googleName);
    if (!res.ok) {
      setError(res.error || 'Could not sign in with Google.');
      return;
    }
    router.push('/');
  };

  const handleQuickGoogleAccount = (email?: string, displayName?: string) => {
    if (!email) return;
    const res = loginWithGoogle(email, displayName);
    if (res.ok) {
      router.push('/');
    }
  };

  return (
    <div className="login-page-view">
      <header className="login-topbar">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push('/')}
          title="Return to Main Menu"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Main Menu</span>
        </button>

        <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
      </header>

      <main className="login-main">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-icon" aria-hidden="true">
              <span className="px c2" />
              <span className="px c4" />
              <span className="px c5" />
              <span className="px c7" />
              <span className="px c9" />
              <span className="px ca" />
              <span className="px c3" />
              <span className="px c1" />
            </div>
            <div>
              <h1>
                Arcade <span>.3MF</span> Stenciler
              </h1>
              <p className="login-subtitle">
                Sign in to keep your stencil projects under your own account
              </p>
            </div>
          </div>

          {user && (
            <div className="login-active-session">
              <div className="login-session-user">
                <span
                  className="user-avatar-dot"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.displayName.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <strong>Signed in as {user.displayName}</strong>
                  {user.email && <small>{user.email}</small>}
                </div>
              </div>
              <div className="login-session-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-xs"
                  onClick={() => router.push('/')}
                >
                  Go to Projects
                </button>
                <button type="button" className="btn-xs btn-danger" onClick={logout}>
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <div className="login-mode-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`login-tab-btn${mode === 'signin' ? ' active' : ''}`}
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`login-tab-btn${mode === 'signup' ? ' active' : ''}`}
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="login-error-banner" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="loginUsernameInput">Username:</label>
              <input
                id="loginUsernameInput"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                required
                maxLength={40}
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div className="login-field">
              <label htmlFor="loginPasswordInput">Password:</label>
              <div className="password-input-wrap">
                <input
                  id="loginPasswordInput"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() => setShowPassword(prev => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary login-submit-btn">
              {mode === 'signin' ? 'Sign In' : 'Create Account & Sign In'}
            </button>
          </form>

          <div className="login-or-divider">
            <span>OR</span>
          </div>

          {!showGooglePrompt ? (
            <button
              type="button"
              className="google-signin-btn"
              onClick={() => {
                setError(null);
                setShowGooglePrompt(true);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          ) : (
            <div className="google-chooser-box">
              <div className="google-chooser-header">
                <div className="google-chooser-title">
                  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <strong>Choose a Google Account</strong>
                </div>
                <button
                  type="button"
                  className="btn-xs"
                  onClick={() => setShowGooglePrompt(false)}
                >
                  Cancel
                </button>
              </div>

              {savedGoogleAccounts.length > 0 && (
                <div className="saved-google-list">
                  {savedGoogleAccounts.map(acc => (
                    <button
                      key={acc.id}
                      type="button"
                      className="saved-google-item"
                      onClick={() => handleQuickGoogleAccount(acc.email, acc.displayName)}
                    >
                      <span
                        className="user-avatar-dot"
                        style={{ backgroundColor: acc.avatarColor }}
                      >
                        {acc.displayName.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="saved-google-meta">
                        <strong>{acc.displayName}</strong>
                        <span>{acc.email}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleGoogleSubmit} className="google-prompt-form">
                <input
                  type="email"
                  placeholder="your.name@gmail.com"
                  required
                  value={googleEmail}
                  onChange={e => setGoogleEmail(e.target.value)}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Display Name (optional)"
                  maxLength={40}
                  value={googleName}
                  onChange={e => setGoogleName(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Continue with Google
                </button>
              </form>
            </div>
          )}

          <div className="login-guest-footer">
            <button type="button" className="btn-link" onClick={() => router.push('/')}>
              Continue as Guest without signing in &rarr;
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
