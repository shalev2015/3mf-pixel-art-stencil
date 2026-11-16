'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import ThemeToggleButton from '@/components/common/ThemeToggleButton';

/** Full-screen login & sign-up view with Username/Password and Sign in with Email. */
export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, savedEmailAccounts, loginWithPassword, loginWithEmail, logout } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailDisplayName, setEmailDisplayName] = useState('');

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

  const handleEmailSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const res = loginWithEmail(emailAddress, emailDisplayName);
    if (!res.ok) {
      setError(res.error || 'Could not sign in with Email.');
      return;
    }
    router.push('/');
  };

  const handleQuickEmailAccount = (email?: string, displayName?: string) => {
    if (!email) return;
    const res = loginWithEmail(email, displayName);
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

          {!showEmailPrompt ? (
            <button
              type="button"
              className="google-signin-btn"
              onClick={() => {
                setError(null);
                setShowEmailPrompt(true);
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span>Sign in with Email</span>
            </button>
          ) : (
            <div className="google-chooser-box">
              <div className="google-chooser-header">
                <div className="google-chooser-title">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <strong>Sign in with Email</strong>
                </div>
                <button
                  type="button"
                  className="btn-xs"
                  onClick={() => setShowEmailPrompt(false)}
                >
                  Cancel
                </button>
              </div>

              {savedEmailAccounts.length > 0 && (
                <div className="saved-google-list">
                  {savedEmailAccounts.map(acc => (
                    <button
                      key={acc.id}
                      type="button"
                      className="saved-google-item"
                      onClick={() => handleQuickEmailAccount(acc.email, acc.displayName)}
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

              <form onSubmit={handleEmailSubmit} className="google-prompt-form">
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={emailAddress}
                  onChange={e => setEmailAddress(e.target.value)}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Display Name (optional)"
                  maxLength={40}
                  value={emailDisplayName}
                  onChange={e => setEmailDisplayName(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Continue with Email
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
