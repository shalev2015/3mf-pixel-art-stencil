import { PRESET_PALETTES } from '@/lib/constants/palettes';

interface PaletteSwatchStripProps {
  hexes?: string[];
  className?: string;
}

/** A compact horizontal strip showing palette colors 1..15. */
export default function PaletteSwatchStrip({ hexes, className = '' }: PaletteSwatchStripProps) {
  const colors = (hexes || PRESET_PALETTES[0].hexes).slice(1, 16);
  return (
    <span className={`palette-swatch-strip ${className}`} aria-hidden="true">
      {colors.map((hex, i) => (
        <span key={i} className="palette-strip-cell" style={{ backgroundColor: hex }} />
      ))}
    </span>
  );
}
