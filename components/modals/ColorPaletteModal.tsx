'use client';

import type { ColorPalette } from '@/lib/types';
import type { PaletteEditor } from '@/hooks/usePaletteEditor';
import { PRESET_PALETTES } from '@/lib/constants/palettes';
import { isValidHex } from '@/lib/palette/utils';
import PaletteIcon from '@/components/common/PaletteIcon';
import PaletteSwatchStrip from '@/components/common/PaletteSwatchStrip';

interface ColorPaletteModalProps {
  editor: PaletteEditor;
  allPalettes: ColorPalette[];
}

/** Color Palette modal for browsing presets, editing 15 colors, and managing reusable custom palettes. */
export default function ColorPaletteModal({ editor, allPalettes }: ColorPaletteModalProps) {
  if (!editor.isOpen) return null;

  const { selectedPalette, hexes, dropdownOpen, isRenaming, renameText } = editor;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Color Palette"
      onClick={e => {
        if (e.target === e.currentTarget) editor.close();
      }}
    >
      <div
        className="modal-card palette-modal-card"
        onClick={() => {
          if (dropdownOpen) editor.closeDropdown();
        }}
      >
        <div className="modal-header palette-modal-header">
          <div className="palette-modal-title">
            <PaletteIcon size={20} />
            <h2>Color Palette</h2>
          </div>
          <button
            type="button"
            className="palette-modal-close-btn"
            aria-label="Close"
            onClick={editor.close}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="palette-modal-toolbar">
          <div className="palette-dropdown-container" onClick={e => e.stopPropagation()}>
            {isRenaming ? (
              <div className="palette-rename-inline">
                <input
                  type="text"
                  className="palette-rename-input"
                  value={renameText}
                  onChange={e => editor.setRenameText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      editor.commitRename();
                    } else if (e.key === 'Escape') {
                      editor.cancelRename();
                    }
                  }}
                  maxLength={40}
                  placeholder="Palette name..."
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-xs btn-primary"
                  onClick={editor.commitRename}
                >
                  Save Name
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="palette-dropdown-trigger"
                onClick={editor.toggleDropdown}
                aria-expanded={dropdownOpen}
              >
                <span>{selectedPalette.name}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {dropdownOpen ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="6 9 12 15 18 9" />
                  )}
                </svg>
              </button>
            )}

            {dropdownOpen && (
              <div className="palette-dropdown-menu" role="listbox">
                {allPalettes.map(pal => (
                  <button
                    key={pal.id}
                    type="button"
                    role="option"
                    aria-selected={pal.id === selectedPalette.id}
                    className={`palette-dropdown-item${
                      pal.id === selectedPalette.id ? ' active' : ''
                    }`}
                    onClick={() => editor.selectPalette(pal)}
                  >
                    <span className="palette-dropdown-name">{pal.name}</span>
                    <PaletteSwatchStrip hexes={pal.hexes} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="palette-toolbar-actions">
            <button
              type="button"
              className="palette-icon-btn"
              title="New Custom Palette (reusable in all projects)"
              onClick={editor.createCustomPalette}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              type="button"
              className="palette-icon-btn"
              title={
                selectedPalette.isPreset
                  ? 'Save as named custom palette'
                  : 'Rename custom palette'
              }
              onClick={editor.startRename}
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
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
            <button
              type="button"
              className="palette-icon-btn"
              title={
                selectedPalette.isPreset
                  ? 'Built-in preset palettes cannot be deleted'
                  : 'Delete custom palette'
              }
              disabled={selectedPalette.isPreset}
              onClick={editor.deleteSelected}
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
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        <div className="palette-modal-rows">
          {Array.from({ length: 15 }, (_, idx) => {
            const colorIdx = idx + 1;
            const rawHex = hexes[colorIdx] || '#000000';
            const validPickerHex = isValidHex(rawHex)
              ? rawHex
              : PRESET_PALETTES[0].hexes[colorIdx];

            return (
              <div key={colorIdx} className="palette-modal-row">
                <span className="palette-row-index">{colorIdx}</span>

                <label className="palette-row-swatch-box" title={`Pick color ${colorIdx}`}>
                  <span
                    className="palette-row-swatch-fill"
                    style={{ backgroundColor: validPickerHex }}
                  />
                  <input
                    type="color"
                    value={validPickerHex}
                    onChange={e => editor.setColor(colorIdx, e.target.value.toUpperCase())}
                  />
                </label>

                <input
                  type="text"
                  className="palette-row-hex-input"
                  value={rawHex}
                  maxLength={7}
                  spellCheck={false}
                  onChange={e => {
                    let v = e.target.value;
                    if (v && !v.startsWith('#')) v = `#${v}`;
                    editor.setColor(colorIdx, v.toUpperCase());
                  }}
                />

                <button
                  type="button"
                  className="palette-row-move-btn"
                  title="Move color up"
                  disabled={colorIdx === 1}
                  onClick={() => editor.swapColors(colorIdx, colorIdx - 1)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="palette-row-move-btn"
                  title="Move color down"
                  disabled={colorIdx === 15}
                  onClick={() => editor.swapColors(colorIdx, colorIdx + 1)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        <div className="palette-modal-footer">
          <button type="button" className="palette-reset-btn" onClick={editor.reset}>
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
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <span>Reset</span>
          </button>

          <button type="button" className="palette-apply-btn" onClick={editor.apply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
