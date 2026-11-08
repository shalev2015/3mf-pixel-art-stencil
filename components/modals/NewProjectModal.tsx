'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { ColorPalette } from '@/lib/types';
import { PRESET_PALETTES } from '@/lib/constants/palettes';
import { PRESET_SPRITES } from '@/lib/constants/sprites';
import PaletteSwatchStrip from '@/components/common/PaletteSwatchStrip';

interface NewProjectModalProps {
  isOpen: boolean;
  initialTemplate: string;
  initialName: string;
  defaultPaletteId: string;
  allPalettes: ColorPalette[];
  customPalettes: ColorPalette[];
  onClose: () => void;
  onCreate: (name: string, templateKey: string, palette: ColorPalette) => void;
}

/** Modal dialog for creating a new named stencil project with a chosen starter template and palette. */
export default function NewProjectModal({
  isOpen,
  initialTemplate,
  initialName,
  defaultPaletteId,
  allPalettes,
  customPalettes,
  onClose,
  onCreate
}: NewProjectModalProps) {
  const [name, setName] = useState(initialName);
  const [templateKey, setTemplateKey] = useState(initialTemplate);
  const [paletteId, setPaletteId] = useState(defaultPaletteId);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setTemplateKey(initialTemplate);
      setPaletteId(defaultPaletteId || 'arcade');
    }
  }, [isOpen, initialName, initialTemplate, defaultPaletteId]);

  if (!isOpen) return null;

  const chosenPalette = allPalettes.find(p => p.id === paletteId) || PRESET_PALETTES[0];

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onCreate(name, templateKey, chosenPalette);
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card modal-sm">
        <div className="modal-header">
          <h2>Create New Stencil Project</h2>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body form-stack">
          <div className="form-field">
            <label htmlFor="newProjectNameInput">Project Name</label>
            <input
              type="text"
              id="newProjectNameInput"
              placeholder="e.g. Space Invader Cabinet Art"
              required
              maxLength={60}
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="newProjectTemplateSelect">Starting Sprite / Template</label>
            <select
              id="newProjectTemplateSelect"
              value={templateKey}
              onChange={e => {
                const val = e.target.value;
                setTemplateKey(val);
                if (PRESET_SPRITES[val]) {
                  setName(PRESET_SPRITES[val].title);
                } else if (val === 'blank16') {
                  setName('Blank 16x16');
                } else if (val === 'blank32') {
                  setName('Blank 32x32');
                }
              }}
            >
              {Object.entries(PRESET_SPRITES).map(([k, tpl]) => (
                <option key={k} value={k}>
                  {tpl.title}
                </option>
              ))}
              <option value="blank16">Blank Canvas (16×16)</option>
              <option value="blank32">Blank Canvas (32×32)</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="newProjectPaletteSelect">Color Palette</label>
            <select
              id="newProjectPaletteSelect"
              value={paletteId}
              onChange={e => setPaletteId(e.target.value)}
            >
              <optgroup label="Preset Palettes">
                {PRESET_PALETTES.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              {customPalettes.length > 0 && (
                <optgroup label="My Custom Palettes">
                  {customPalettes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <div style={{ marginTop: '6px' }}>
              <PaletteSwatchStrip hexes={chosenPalette.hexes} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create &amp; Open Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
