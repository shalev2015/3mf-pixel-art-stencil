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
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Main Menu</span>
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
          <span className="save-badge">✓ Saved</span>
        </div>
      </div>

      <div className="header-actions">
        <div className="preset-group">
          <label htmlFor="presetSelect">Load Sprite Preset:</label>
          <select
            id="presetSelect"
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
        >
          <input type="file" accept="image/*" hidden onChange={handleImageChange} />
          <span>Import Image</span>
        </label>

        <button
          type="button"
          className="btn btn-secondary"
          title="Save a copy of this project"
          onClick={onDuplicateProject}
        >
          Duplicate
        </button>

        <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />

        <button type="button" className="btn btn-ghost" onClick={onOpenHelp}>
          How to Use
        </button>
      </div>
    </header>
  );
}
