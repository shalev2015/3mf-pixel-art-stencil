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
          <span className="px c2" /><span className="px c4" /><span className="px c5" /><span className="px c7" />
          <span className="px c9" /><span className="px ca" /><span className="px c3" /><span className="px c1" />
        </div>
        <div>
          <h1>Arcade <span>.3MF</span> Stenciler</h1>
          <p className="subtitle">
            Turn Arcade <code>img`...`</code> JS pixel art into 3D-printable multi-layer <code>.3mf</code> stencils
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
        >
          <PaletteIcon />
          <span>Color Palettes</span>
        </button>
        <label className="btn btn-secondary file-btn" title="Import exported projects (.json)">
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
          <span>Import Projects (.json)</span>
        </label>
        <button type="button" className="btn btn-secondary" onClick={onBackupProjects}>
          Backup All Projects
        </button>
        <button type="button" className="btn btn-ghost" onClick={onShowHelp}>
          How to Use
        </button>
      </div>
    </header>
  );
}
