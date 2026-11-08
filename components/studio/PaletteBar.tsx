import type { ColorPalette, PaletteEntry } from '@/lib/types';
import { PRESET_PALETTES } from '@/lib/constants/palettes';
import { hexToRgbNormalized } from '@/lib/utils/color';

interface PaletteBarProps {
  palette: PaletteEntry[];
  paletteId: string;
  paletteName: string;
  customPalettes: ColorPalette[];
  selectedColor: number;
  onSelectColor: (index: number) => void;
  onSelectPalette: (id: string) => void;
  onEditPalette: () => void;
}

/** The 16 swatches of the active palette plus a palette picker. */
export default function PaletteBar({
  palette,
  paletteId,
  paletteName,
  customPalettes,
  selectedColor,
  onSelectColor,
  onSelectPalette,
  onEditPalette
}: PaletteBarProps) {
  return (
    <div className="palette-section">
      <div className="palette-header">
        <span className="section-label">Color Palette: {paletteName}</span>
        <div className="palette-header-controls">
          <select
            aria-label="Select Color Palette"
            className="palette-quick-select"
            value={paletteId}
            onChange={e => onSelectPalette(e.target.value)}
          >
            <optgroup label="Preset Palettes">
              {PRESET_PALETTES.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
            {customPalettes.length > 0 && (
              <optgroup label="My Custom Palettes">
                {customPalettes.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            )}
          </select>
          <button
            type="button"
            className="btn-xs btn-primary"
            onClick={onEditPalette}
            title="Open Color Palette Editor to customize colors or create new reusable palettes"
          >
            Edit Palette
          </button>
        </div>
      </div>

      <div className="palette-bar" role="radiogroup" aria-label="Palette Colors">
        {palette.map(entry => {
          const [r, g, b] = hexToRgbNormalized(entry.hex);
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          const textColor = luminance > 0.6 ? '#0d1117' : '#ffffff';
          const classes = [
            'palette-swatch',
            entry.transparent ? 'transparent-swatch' : '',
            selectedColor === entry.index ? 'active' : ''
          ].filter(Boolean).join(' ');

          return (
            <div
              key={entry.index}
              className={classes}
              style={!entry.transparent ? { backgroundColor: entry.hex, color: textColor } : undefined}
              title={`${entry.char.toUpperCase()} — ${entry.name} (${entry.transparent ? 'Transparent' : entry.hex})`}
              onClick={() => onSelectColor(entry.index)}
              onDoubleClick={() => {
                if (!entry.transparent) onEditPalette();
              }}
            >
              {entry.char.toUpperCase()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
