'use client';

import { PRESET_SPRITES } from '@/lib/constants/sprites';
import { DEFAULT_PALETTE } from '@/lib/constants/palettes';
import { createBlankGrid } from '@/lib/sprite/grid';
import { parseSpriteInput } from '@/lib/sprite/parser';
import PixelThumbnailCanvas from '@/components/common/PixelThumbnailCanvas';

const DEFAULT_HEXES = DEFAULT_PALETTE.map(c => c.hex);

interface TemplatesSectionProps {
  onSelectTemplate: (templateKey: string, name: string) => void;
}

export default function TemplatesSection({ onSelectTemplate }: TemplatesSectionProps) {
  return (
    <section className="menu-section">
      <div className="menu-section-header">
        <div>
          <h2>Templates</h2>
          <p className="menu-section-sub">Click any template to create a new named project</p>
        </div>
      </div>

      <div className="templates-grid">
        {Object.entries(PRESET_SPRITES).map(([key, template]) => {
          const grid = parseSpriteInput(template.code).occurrences[0]?.grid || createBlankGrid(16, 16);
          return (
            <div
              key={key}
              className="template-card"
              title={`Create a new project from ${template.title}`}
              onClick={() => onSelectTemplate(key, template.title)}
            >
              <PixelThumbnailCanvas
                grid={grid}
                paletteHexes={DEFAULT_HEXES}
                width={64}
                height={64}
                className="template-thumb"
              />
              <div className="template-info">
                <strong>{template.title}</strong>
                <span>{template.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
