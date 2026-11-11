'use client';

import type { ChangeEvent } from 'react';
import type { PaletteEntry, Theme } from '@/lib/types';
import { PRESET_SPRITES } from '@/lib/constants/sprites';
import { importImageFile } from '@/lib/sprite/imageImport';
import ThemeToggleButton from '@/components/common/ThemeToggleButton';

interface StudioHeaderProps {
  projectName: string;
  palette: PaletteEntry[];
  theme: Theme;
  onBackToMenu: () => void;
  onRenameProject: (name: string) => void;
  onLoadPresetCode: (code: string) => void;
  onImportGrid: (grid: number[][]) => void;
  onDuplicateProject: () => void;
  onToggleTheme: () => void;
  onOpenHelp: () => void;
}

/** Studio top bar: navigation back to menu, project rename, image/preset import, and global actions. */
export default function StudioHeader({
  projectName,
  palette,
  theme,
  onBackToMenu,
  onRenameProject,
  onLoadPresetCode,
  onImportGrid,
  onDuplicateProject,
  onToggleTheme,
  onOpenHelp
}: StudioHeaderProps) {
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const grid = await importImageFile(file, palette);
      if (grid) onImportGrid(grid);
    } catch {
      window.alert('Could not import image file.');
    }
  };

  return (
    <header className="app-header">
      <div className="brand-and-nav">
        <button
          type="button"
          className="btn btn-secondary back-menu-btn"
          title="Return to Main Menu"
          aria-label="Return to Main Menu"
          onClick={onBackToMenu}
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
          <span className="btn-label">Main Menu</span>
        </button>

        <div className="project-title-bar">
          <label htmlFor="activeProjectNameInput" className="sr-only">
            Project Name
          </label>
          <input
            type="text"
            id="activeProjectNameInput"
            className="project-name-input"
            placeholder="Untitled Project"
            maxLength={60}
            value={projectName}
            onChange={e => onRenameProject(e.target.value)}
            title="Click to rename project"
          />
          <span className="save-badge" title="Saved automatically in browser">
            ✓<span className="btn-label"> Saved</span>
          </span>
        </div>
      </div>

      <div className="header-actions">
        <div className="preset-group" title="Load Sprite Preset">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="preset-icon"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          <label htmlFor="presetSelect" className="btn-label">
            Load Sprite Preset:
          </label>
          <select
            id="presetSelect"
            aria-label="Load Sprite Preset"
            value=""
            onChange={e => {
              const tpl = PRESET_SPRITES[e.target.value];
              if (tpl) onLoadPresetCode(tpl.code);
            }}
          >
            <option value="">-- Replace sprite with preset --</option>
            {Object.entries(PRESET_SPRITES).map(([k, tpl]) => (
              <option key={k} value={k}>
                {tpl.title}
              </option>
            ))}
          </select>
        </div>

        <label
          className="btn btn-secondary file-btn"
          title="Import a PNG/JPG image and quantize to palette"
          aria-label="Import Image"
        >
          <input type="file" accept="image/*" hidden onChange={handleImageChange} />
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
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="btn-label">Import Image</span>
        </label>

        <button
          type="button"
          className="btn btn-secondary"
          title="Save a copy of this project"
          aria-label="Duplicate project"
          onClick={onDuplicateProject}
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
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span className="btn-label">Duplicate</span>
        </button>

        <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />

        <button
          type="button"
          className="btn btn-ghost"
          title="How to Use"
          aria-label="How to Use"
          onClick={onOpenHelp}
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
