import type { Theme } from '@/lib/types';
import PaletteIcon from '@/components/common/PaletteIcon';
import ThemeToggleButton from '@/components/common/ThemeToggleButton';

interface MenuHeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  onOpenPalettes: () => void;
  onImportProjects: (file: File) => void;
  onBackupProjects: () => void;
  onShowHelp: () => void;
}

export default function MenuHeader({
  theme,
  onToggleTheme,
  onOpenPalettes,
  onImportProjects,
  onBackupProjects,
  onShowHelp
}: MenuHeaderProps) {
  return (
    <header className="menu-header">
      <div className="brand">
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
          <p className="subtitle">
            Turn Arcade <code>img`...`</code> JS pixel art into 3D-printable multi-layer{' '}
            <code>.3mf</code> stencils
          </p>
        </div>
      </div>

      <div className="header-actions">
        <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenPalettes}
          title="Browse preset color palettes or create your own custom palettes"
          aria-label="Color Palettes"
        >
          <PaletteIcon />
          <span className="btn-label">Color Palettes</span>
        </button>
        <label
          className="btn btn-secondary file-btn"
          title="Import exported projects (.json)"
          aria-label="Import Projects (.json)"
        >
          <input
            type="file"
            accept=".json,application/json"
            hidden
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onImportProjects(file);
              e.target.value = '';
            }}
          />
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="btn-label">Import Projects (.json)</span>
        </label>
        <button
          type="button"
          className="btn btn-secondary"
          title="Backup All Projects (.json)"
          aria-label="Backup All Projects"
          onClick={onBackupProjects}
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="btn-label">Backup All Projects</span>
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          title="How to Use"
          aria-label="How to Use"
          onClick={onShowHelp}
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
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="btn-label">How to Use</span>
        </button>
      </div>
    </header>
  );
}
