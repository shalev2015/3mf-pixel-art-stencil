'use client';

import { useMemo } from 'react';
import type { Project } from '@/lib/types';
import { createBlankGrid } from '@/lib/sprite/grid';
import { parseSpriteInput } from '@/lib/sprite/parser';
import { formatRelativeTime } from '@/lib/utils/time';
import PixelThumbnailCanvas from '@/components/common/PixelThumbnailCanvas';
import type { Grid } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
  onRename: (project: Project) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (project: Project, grid: Grid) => void;
}

export default function ProjectCard({
  project,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onDownload
}: ProjectCardProps) {
  const { spriteGrid, usedColorCount } = useMemo(() => {
    const grid = parseSpriteInput(project.code).occurrences[0]?.grid || createBlankGrid(16, 16);
    const used = new Set<number>();
    for (const row of grid) {
      for (const idx of row) if (idx > 0) used.add(idx);
    }
    return { spriteGrid: grid, usedColorCount: used.size };
  }, [project.code]);

  const H = spriteGrid.length;
  const W = H > 0 ? spriteGrid[0].length : 0;
  const pixelSize = project.settings?.pixelSize || 4;
  const margin = project.settings?.margin || 8;

  return (
    <div className="project-card">
      <div
        className="project-thumb-wrap"
        title={`Click to open ${project.name}`}
        onClick={() => onOpen(project)}
      >
        <PixelThumbnailCanvas
          grid={spriteGrid}
          paletteHexes={project.paletteHexes}
          width={128}
          height={128}
          className="project-thumb-canvas"
        />
        <div className="project-thumb-badges">
          <span className="badge">{W}×{H} px</span>
          <span className="badge badge-accent">
            {usedColorCount} color{usedColorCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="project-body">
        <div className="project-title-row">
          <span className="project-card-name" title={project.name} onClick={() => onOpen(project)}>
            {project.name}
          </span>
          <button type="button" className="btn-xs" title="Rename project" onClick={() => onRename(project)}>
            Rename
          </button>
        </div>

        <div className="project-meta-row">
          <span>
            {(pixelSize * W + 2 * margin).toFixed(0)}×{(pixelSize * H + 2 * margin).toFixed(0)} mm
          </span>
          <span>Edited {formatRelativeTime(project.updatedAt)}</span>
        </div>

        <div className="project-actions-row">
          <button type="button" className="btn btn-primary btn-xs btn-open" onClick={() => onOpen(project)}>
            Open Studio
          </button>
          <button
            type="button"
            className="btn-xs"
            title="Download all .3mf stencils for this project"
            onClick={() => onDownload(project, spriteGrid)}
          >
            .3MF
          </button>
          <button type="button" className="btn-xs" title="Duplicate project" onClick={() => onDuplicate(project.id)}>
            Copy
          </button>
          <button type="button" className="btn-xs btn-danger" title="Delete project" onClick={() => onDelete(project.id)}>
            Del
          </button>
        </div>
      </div>
    </div>
  );
}
