import type { Grid } from '@/lib/types';
import { colorIndexToChar } from '@/lib/sprite/grid';

export function gridToSpriteString(grid: Grid): string {
  const lines = grid.map(row => '    ' + row.map(c => colorIndexToChar(c)).join(' '));
  return `img\`\n${lines.join('\n')}\n\``;
}
