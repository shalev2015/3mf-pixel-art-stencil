/** A 2D pixel grid: `grid[row][col]` is a palette index (0 = transparent). */
export type Grid = number[][];

export type Vec3 = [number, number, number];
export type Triangle = [number, number, number];

export interface PaletteEntry {
  index: number;
  char: string;
  hex: string;
  name: string;
  transparent?: boolean;
}

/** A named set of 16 hex colors (index 0 is the transparent slot). */
export interface ColorPalette {
  id: string;
  name: string;
  isPreset: boolean;
  hexes: string[];
}

export type CutoutMode = 'grid' | 'merged-bridged' | 'merged-raw';
export type RegistrationHoleMode = 'asymmetric3' | 'corners4' | 'none';

export interface StencilSettings {
  pixelSize: number;
  thickness: number;
  margin: number;
  cutoutMode: CutoutMode;
  bridgeWidth: number;
  regHoles: RegistrationHoleMode;
  regHoleSize: number;
  embossId: boolean;
  includeSilhouette: boolean;
}

export interface SpritePreset {
  title: string;
  subtitle: string;
  code: string;
}

export interface SpriteOccurrence {
  label: string;
  grid: Grid;
}

export interface ParsedSprites {
  occurrences: SpriteOccurrence[];
}

export type CellMode = 'hole' | 'solid' | 'bridgeV' | 'bridgeH';

export interface IslandAnalysis {
  cellMode: CellMode[][];
  initialIslandCount: number;
  remainingIslandCount: number;
  addedBridgeCells: number;
}

export interface IslandInfo {
  initialIslandCount: number;
  remainingIslandCount: number;
  addedBridgeCells: number;
}

export interface Mesh {
  vertices: Vec3[];
  triangles: Triangle[];
  isManifold: boolean;
  openEdges: number;
  volumeMm3: number;
}

export interface PlateMesh extends Mesh {
  plateW: number;
  plateH: number;
}

export interface StencilMesh extends PlateMesh {
  thickness: number;
  islandInfo: IslandInfo;
}

export interface PlaqueMeshEntry {
  key: string;
  name: string;
  colorHex: string;
  colorIndex: number;
  pixelCount?: number;
  mesh: PlateMesh;
}

export interface StencilLayer {
  key: string;
  title: string;
  shortName: string;
  colorIndex: number;
  colorChar: string;
  colorHex: string;
  pixelCount: number;
  mesh: StencilMesh;
}

export interface BuildPlateEntry<L extends { mesh: PlateMesh } = StencilLayer> {
  layer: L;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
}

export interface ExportItem {
  name: string;
  colorHex: string;
  mesh: Mesh;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
}

export interface Project {
  id: string;
  name: string;
  updatedAt: number;
  code: string;
  paletteId?: string;
  paletteHexes: string[];
  settings: StencilSettings;
}

export type Theme = 'dark' | 'light';
export type Screen = 'menu' | 'editor';
export type ViewMode = 'single' | 'bed' | 'stack' | 'plaque';
