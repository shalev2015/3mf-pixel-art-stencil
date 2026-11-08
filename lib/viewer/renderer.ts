import type { Theme } from '@/lib/types';
import { mat4LookAt, mat4Multiply, mat4Perspective } from '@/lib/viewer/mat4';
import type { SceneBounds, SceneItem, ViewerState } from '@/lib/viewer/types';

const VERTEX_SHADER = `
  attribute vec3 aPos;
  attribute vec3 aNormal;
  uniform mat4 uViewProj;
  uniform vec3 uOffset;
  varying vec3 vNormal;
  void main() {
    vec3 world = aPos + uOffset;
    vNormal = aNormal;
    gl_Position = uViewProj * vec4(world, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec3 vNormal;
  uniform vec3 uColor;
  uniform float uIsLine;
  void main() {
    if (uIsLine > 0.5) {
      gl_FragColor = vec4(uColor, 1.0);
      return;
    }
    vec3 n = normalize(vNormal);
    vec3 lightDir1 = normalize(vec3(0.45, -0.6, 0.85));
    vec3 lightDir2 = normalize(vec3(-0.5, 0.4, 0.35));
    float diff1 = max(dot(n, lightDir1), 0.0);
    float diff2 = max(dot(n, lightDir2), 0.0) * 0.35;
    float hemi = 0.38 + 0.15 * n.z;
    vec3 lit = uColor * (hemi + diff1 * 0.52 + diff2);
    gl_FragColor = vec4(clamp(lit, 0.0, 1.0), 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type) as WebGLShader;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

/** Creates the WebGL program and resets GPU resources. Returns false if WebGL is unavailable. */
export function initViewerGl(canvas: HTMLCanvasElement, v: ViewerState): boolean {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
  if (!gl) return false;

  v.gl = gl;
  v.gridBuf = null;
  v.gpuBuffers = [];

  const program = gl.createProgram() as WebGLProgram;
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  v.program = program;

  v.attribs = {
    aPos: gl.getAttribLocation(program, 'aPos'),
    aNormal: gl.getAttribLocation(program, 'aNormal')
  };
  v.uniforms = {
    uViewProj: gl.getUniformLocation(program, 'uViewProj'),
    uOffset: gl.getUniformLocation(program, 'uOffset'),
    uColor: gl.getUniformLocation(program, 'uColor'),
    uIsLine: gl.getUniformLocation(program, 'uIsLine')
  };
  return true;
}

function clearColorFor(theme: Theme): [number, number, number, number] {
  return theme === 'light' ? [0.91, 0.94, 0.98, 1.0] : [0.06, 0.08, 0.11, 1.0];
}

/** Draws the build-plate grid and all uploaded meshes using the current camera. */
export function drawViewerFrame(v: ViewerState): void {
  const gl = v.gl;
  if (!gl || !v.program) return;
  const canvas = gl.canvas as HTMLCanvasElement;
  const parent = canvas.parentElement;
  if (!parent) return;
  const rect = parent.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const isLight = v.theme === 'light';
  gl.viewport(0, 0, width, height);
  gl.clearColor(...clearColorFor(v.theme));
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);

  gl.useProgram(v.program);

  const proj = mat4Perspective(42 * (Math.PI / 180), width / height, 1.0, 3500.0);

  const cosP = Math.cos(v.pitch);
  const sinP = Math.sin(v.pitch);
  const cosY = Math.cos(v.yaw);
  const sinY = Math.sin(v.yaw);

  const eye: [number, number, number] = [
    v.target[0] + v.distance * cosP * sinY,
    v.target[1] - v.distance * cosP * cosY,
    v.target[2] + v.distance * sinP
  ];

  const view = mat4LookAt(eye, v.target, [0, 0, 1]);
  gl.uniformMatrix4fv(v.uniforms.uViewProj, false, mat4Multiply(proj, view));

  if (!v.gridBuf) {
    const lines: number[] = [];
    const step = 10;
    const min = -40;
    const max = 320;
    for (let val = min; val <= max; val += step) {
      lines.push(val, min, -0.05, val, max, -0.05);
      lines.push(min, val, -0.05, max, val, -0.05);
    }
    const arr = new Float32Array(lines);
    v.gridVertCount = arr.length / 3;
    v.gridBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, v.gridBuf);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
  }

  gl.uniform3fv(v.uniforms.uOffset, [0, 0, 0]);
  gl.uniform3fv(v.uniforms.uColor, isLight ? [0.76, 0.82, 0.89] : [0.16, 0.21, 0.28]);
  gl.uniform1f(v.uniforms.uIsLine, 1.0);
  gl.bindBuffer(gl.ARRAY_BUFFER, v.gridBuf);
  gl.enableVertexAttribArray(v.attribs.aPos);
  gl.vertexAttribPointer(v.attribs.aPos, 3, gl.FLOAT, false, 0, 0);
  gl.disableVertexAttribArray(v.attribs.aNormal);
  gl.drawArrays(gl.LINES, 0, v.gridVertCount);

  for (const b of v.gpuBuffers) {
    gl.uniform3fv(v.uniforms.uOffset, b.offset);
    gl.uniform3fv(v.uniforms.uColor, b.color);
    gl.uniform1f(v.uniforms.uIsLine, 0.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, b.posBuf);
    gl.enableVertexAttribArray(v.attribs.aPos);
    gl.vertexAttribPointer(v.attribs.aPos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, b.normBuf);
    gl.enableVertexAttribArray(v.attribs.aNormal);
    gl.vertexAttribPointer(v.attribs.aNormal, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, b.vertexCount);

    if (v.showEdges && b.edgeVertexCount > 0) {
      gl.uniform1f(v.uniforms.uIsLine, 1.0);
      gl.uniform3fv(v.uniforms.uColor, isLight ? [0.15, 0.2, 0.28] : [0.05, 0.07, 0.1]);
      gl.bindBuffer(gl.ARRAY_BUFFER, b.edgeBuf);
      gl.vertexAttribPointer(v.attribs.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.disableVertexAttribArray(v.attribs.aNormal);
      gl.drawArrays(gl.LINES, 0, b.edgeVertexCount);
    }
  }
}

function releaseGpuBuffers(v: ViewerState): void {
  const gl = v.gl;
  if (!gl) return;
  for (const b of v.gpuBuffers) {
    gl.deleteBuffer(b.posBuf);
    gl.deleteBuffer(b.normBuf);
    gl.deleteBuffer(b.edgeBuf);
  }
  v.gpuBuffers = [];
}

/** Replaces the GPU meshes with `items` and re-frames the camera on `bounds`. */
export function uploadScene(v: ViewerState, items: SceneItem[], bounds: SceneBounds): void {
  const gl = v.gl;
  if (!gl) return;
  releaseGpuBuffers(v);

  for (const item of items) {
    const mesh = item.mesh;
    const triCount = mesh.triangles.length;
    const posData = new Float32Array(triCount * 9);
    const normData = new Float32Array(triCount * 9);
    const edgeData: number[] = [];

    for (let i = 0; i < triCount; i++) {
      const [i0, i1, i2] = mesh.triangles[i];
      const v0 = mesh.vertices[i0];
      const v1 = mesh.vertices[i1];
      const v2 = mesh.vertices[i2];

      const ux = v1[0] - v0[0], uy = v1[1] - v0[1], uz = v1[2] - v0[2];
      const vx = v2[0] - v0[0], vy = v2[1] - v0[1], vz = v2[2] - v0[2];
      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;

      const base = i * 9;
      posData.set([...v0, ...v1, ...v2], base);
      for (let k = 0; k < 9; k += 3) {
        normData[base + k] = nx;
        normData[base + k + 1] = ny;
        normData[base + k + 2] = nz;
      }

      if (Math.abs(nz) > 0.9) {
        if (v0[0] === v1[0] || v0[1] === v1[1]) edgeData.push(...v0, ...v1);
        if (v1[0] === v2[0] || v1[1] === v2[1]) edgeData.push(...v1, ...v2);
        if (v2[0] === v0[0] || v2[1] === v0[1]) edgeData.push(...v2, ...v0);
      }
    }

    const posBuf = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, posData, gl.STATIC_DRAW);

    const normBuf = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
    gl.bufferData(gl.ARRAY_BUFFER, normData, gl.STATIC_DRAW);

    const edgeFloat = new Float32Array(edgeData);
    const edgeBuf = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, edgeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, edgeFloat, gl.STATIC_DRAW);

    v.gpuBuffers.push({
      posBuf,
      normBuf,
      edgeBuf,
      vertexCount: triCount * 3,
      edgeVertexCount: edgeFloat.length / 3,
      color: item.color,
      offset: item.offset
    });
  }

  if (isFinite(bounds.minX) && isFinite(bounds.maxX)) {
    v.target = [
      (bounds.minX + bounds.maxX) * 0.5,
      (bounds.minY + bounds.maxY) * 0.5,
      bounds.maxZ * 0.4
    ];
    const span = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, bounds.maxZ * 2);
    v.distance = Math.max(45, span * 1.45);
  }
}

/** Attaches orbit / pan / zoom listeners. Returns a cleanup function. */
export function attachViewerControls(
  canvas: HTMLCanvasElement,
  v: ViewerState,
  redraw: () => void
): () => void {
  const onMouseMove = (e: MouseEvent) => {
    if (!v.isDragging) return;
    const dx = e.clientX - v.lastMouse[0];
    const dy = e.clientY - v.lastMouse[1];
    v.lastMouse = [e.clientX, e.clientY];

    if (v.dragButton === 2 || e.shiftKey) {
      const panScale = v.distance * 0.0016;
      const cosYaw = Math.cos(v.yaw);
      const sinYaw = Math.sin(v.yaw);
      v.target[0] -= (dx * cosYaw - dy * sinYaw * 0.6) * panScale;
      v.target[1] -= (dx * sinYaw + dy * cosYaw * 0.6) * panScale;
    } else {
      v.yaw -= dx * 0.0075;
      v.pitch = Math.max(-1.45, Math.min(1.52, v.pitch + dy * 0.0075));
    }
    redraw();
  };

  const onMouseUp = () => {
    v.isDragging = false;
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    v.distance = Math.max(15, Math.min(1200, v.distance * factor));
    redraw();
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('resize', redraw);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('resize', redraw);
    canvas.removeEventListener('wheel', onWheel);
  };
}
