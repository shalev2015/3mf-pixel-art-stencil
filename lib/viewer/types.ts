import type { Mesh, Theme, Vec3 } from '@/lib/types';

export interface GpuMesh {
  posBuf: WebGLBuffer;
  normBuf: WebGLBuffer;
  edgeBuf: WebGLBuffer;
  vertexCount: number;
  edgeVertexCount: number;
  color: Vec3;
  offset: Vec3;
}

export interface ViewerAttribs {
  aPos: number;
  aNormal: number;
}

export interface ViewerUniforms {
  uViewProj: WebGLUniformLocation | null;
  uOffset: WebGLUniformLocation | null;
  uColor: WebGLUniformLocation | null;
  uIsLine: WebGLUniformLocation | null;
}

/** Mutable orbit-camera + GPU resource state for the 3D viewport. */
export interface ViewerState {
  gl: WebGLRenderingContext | null;
  program: WebGLProgram | null;
  attribs: ViewerAttribs;
  uniforms: ViewerUniforms;
  yaw: number;
  pitch: number;
  distance: number;
  target: Vec3;
  isDragging: boolean;
  dragButton: number;
  lastMouse: [number, number];
  gpuBuffers: GpuMesh[];
  gridBuf: WebGLBuffer | null;
  gridVertCount: number;
  theme: Theme;
  showEdges: boolean;
}

/** A mesh placed in the scene with a flat color and a world-space offset. */
export interface SceneItem {
  mesh: Mesh;
  color: Vec3;
  offset: Vec3;
}

export interface SceneBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  maxZ: number;
}

export function createViewerState(): ViewerState {
  return {
    gl: null,
    program: null,
    attribs: { aPos: 0, aNormal: 1 },
    uniforms: { uViewProj: null, uOffset: null, uColor: null, uIsLine: null },
    yaw: -0.55,
    pitch: 0.72,
    distance: 165,
    target: [40, 40, 0],
    isDragging: false,
    dragButton: 0,
    lastMouse: [0, 0],
    gpuBuffers: [],
    gridBuf: null,
    gridVertCount: 0,
    theme: 'dark',
    showEdges: true
  };
}
