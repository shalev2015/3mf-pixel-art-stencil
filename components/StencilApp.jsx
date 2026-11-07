'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  STORAGE_KEY,
  DEFAULT_MAKECODE_PALETTE,
  PRESET_SPRITES,
  getDefaultSettings,
  generateId,
  sanitizeFilename,
  createBlankGrid,
  gridToMakeCodeString,
  parseMakeCodeInput,
  buildStencilMesh,
  buildMultiColorPlaqueMeshes,
  computeBuildPlateLayout,
  generate3mfArchive,
  generateBinaryStl,
  triggerFileDownload,
  hexToRgbNormalized,
  formatRelativeTime,
  mat4Perspective,
  mat4LookAt,
  mat4Multiply
} from '@/lib/stencilEngine';

const THEME_STORAGE_KEY = 'makecode_arcade_3mf_stenciler_theme';

/**
 * Helper component to render a 2D pixel grid thumbnail on a <canvas>
 */
function PixelThumbnailCanvas({ grid, paletteHexes, width = 128, height = 128, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext('2d');
    const H = grid.length;
    const W = H > 0 ? grid[0].length : 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!W || !H) return;

    const scale = Math.min(canvas.width / W, canvas.height / H);
    const offsetX = (canvas.width - W * scale) * 0.5;
    const offsetY = (canvas.height - H * scale) * 0.5;

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const idx = grid[r][c];
        if (idx > 0 && idx <= 15) {
          ctx.fillStyle = (paletteHexes && paletteHexes[idx]) || DEFAULT_MAKECODE_PALETTE[idx].hex;
          ctx.fillRect(
            Math.floor(offsetX + c * scale),
            Math.floor(offsetY + r * scale),
            Math.ceil(scale),
            Math.ceil(scale)
          );
        }
      }
    }
  }, [grid, paletteHexes, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className={className} />;
}

export default function StencilApp() {
  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState('dark');

  // Navigation & Projects State
  const [screen, setScreen] = useState('menu'); // 'menu' | 'editor'
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeProjectName, setActiveProjectName] = useState('Untitled Project');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjName, setNewProjName] = useState('MakeCode Duck Stencil');
  const [newProjTemplate, setNewProjTemplate] = useState('duck');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy JS');

  // Active Project Editor State
  const [codeText, setCodeText] = useState(PRESET_SPRITES.duck.code);
  const [spriteOccurrences, setSpriteOccurrences] = useState([]);
  const [selectedOccurrenceIdx, setSelectedOccurrenceIdx] = useState(0);
  const [grid, setGrid] = useState(() => parseMakeCodeInput(PRESET_SPRITES.duck.code).occurrences[0].grid);
  const [palette, setPalette] = useState(() => DEFAULT_MAKECODE_PALETTE.map(c => ({ ...c })));
  const [selectedBrushColor, setSelectedBrushColor] = useState(2);
  const [hoverInfo, setHoverInfo] = useState('Click or drag on grid to paint pixels');

  // Stencil Geometry Settings
  const [settings, setSettings] = useState(getDefaultSettings);

  // 3D Viewport State
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'bed' | 'stack' | 'plaque'
  const [activeLayerKey, setActiveLayerKey] = useState(null);
  const [explodeSpacing, setExplodeSpacing] = useState(8.0);
  const [showEdges, setShowEdges] = useState(true);

  // Refs for 2D & 3D Canvases
  const sprite2dCanvasRef = useRef(null);
  const isPaintingRef = useRef(false);
  const viewport3dCanvasRef = useRef(null);
  const viewerRef = useRef({
    gl: null,
    program: null,
    attribs: {},
    uniforms: {},
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
    theme: 'dark'
  });

  // Load saved theme & projects from localStorage on client mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    } catch (e) {}

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjects(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load projects from localStorage:', e);
    }

    const now = Date.now();
    const initial = [
      {
        id: generateId(),
        name: 'MakeCode Duck Stencil',
        updatedAt: now - 120000,
        code: PRESET_SPRITES.duck.code,
        paletteHexes: DEFAULT_MAKECODE_PALETTE.map(c => c.hex),
        settings: getDefaultSettings()
      },
      {
        id: generateId(),
        name: 'Space Alien Cabinet Art',
        updatedAt: now - 60000,
        code: PRESET_SPRITES.invader.code,
        paletteHexes: DEFAULT_MAKECODE_PALETTE.map(c => c.hex),
        settings: { ...getDefaultSettings(), pixelSize: 5.0 }
      },
      {
        id: generateId(),
        name: 'Arcade Burger Coaster',
        updatedAt: now - 10000,
        code: PRESET_SPRITES.burger.code,
        paletteHexes: DEFAULT_MAKECODE_PALETTE.map(c => c.hex),
        settings: getDefaultSettings()
      }
    ];
    setProjects(initial);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {}
  }, []);

  // Sync theme to document root & localStorage
  const updateTheme = useCallback(nextTheme => {
    setTheme(nextTheme);
    viewerRef.current.theme = nextTheme;
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (e) {}
  }, []);

  const toggleTheme = useCallback(() => {
    updateTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, updateTheme]);

  // Persist projects array to localStorage whenever it changes
  const saveProjectsList = useCallback(nextList => {
    setProjects(nextList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    } catch (e) {
      console.warn('Could not save projects to localStorage:', e);
    }
  }, []);

  // Auto-save active project changes back into `projects`
  useEffect(() => {
    if (screen !== 'editor' || !activeProjectId) return;
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === activeProjectId);
      if (idx === -1) return prev;
      const updatedProj = {
        ...prev[idx],
        name: (activeProjectName || 'Untitled Project').trim() || 'Untitled Project',
        updatedAt: Date.now(),
        code: codeText,
        paletteHexes: palette.map(c => c.hex),
        settings: { ...settings }
      };
      const next = [...prev];
      next[idx] = updatedProj;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, [activeProjectId, activeProjectName, codeText, palette, settings, screen]);

  // Compute all 3D stencil layers & multi-color plaque meshes
  const { layers, plaqueMeshes } = useMemo(() => {
    const H = grid.length;
    const W = H > 0 ? grid[0].length : 0;

    const colorCounts = new Map();
    let totalNonTransparent = 0;

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const idx = grid[r][c];
        if (idx > 0 && idx <= 15) {
          colorCounts.set(idx, (colorCounts.get(idx) || 0) + 1);
          totalNonTransparent++;
        }
      }
    }

    const projPrefix = sanitizeFilename(activeProjectName);
    const builtLayers = [];
    let orderCounter = 1;

    if (settings.includeSilhouette && totalNonTransparent > 0) {
      const isHole = grid.map(row => row.map(c => c > 0));
      const mesh = buildStencilMesh(grid, isHole, settings, orderCounter++);
      builtLayers.push({
        key: 'silhouette',
        title: 'Base Silhouette (All Pixels)',
        shortName: `${projPrefix}_Stencil_00_Silhouette`,
        colorIndex: 0,
        colorChar: 'ALL',
        colorHex: '#64748b',
        pixelCount: totalNonTransparent,
        mesh
      });
    }

    const sortedColors = Array.from(colorCounts.keys()).sort((a, b) => a - b);
    for (const colorIdx of sortedColors) {
      const pEntry = palette[colorIdx] || DEFAULT_MAKECODE_PALETTE[colorIdx];
      const isHole = grid.map(row => row.map(c => c === colorIdx));
      const mesh = buildStencilMesh(grid, isHole, settings, orderCounter++);
      builtLayers.push({
        key: `color_${colorIdx}`,
        title: `Color ${pEntry.char.toUpperCase()} — ${pEntry.name}`,
        shortName: `${projPrefix}_Stencil_${pEntry.char.toUpperCase()}_${pEntry.name.replace(/\s+/g, '')}`,
        colorIndex: colorIdx,
        colorChar: pEntry.char.toUpperCase(),
        colorHex: pEntry.hex,
        pixelCount: colorCounts.get(colorIdx),
        mesh
      });
    }

    if (builtLayers.length === 0) {
      const isHole = grid.map(row => row.map(() => false));
      const mesh = buildStencilMesh(grid, isHole, settings, 1);
      builtLayers.push({
        key: 'blank',
        title: 'Blank Plate (No Pixels Painted)',
        shortName: `${projPrefix}_Stencil_Blank`,
        colorIndex: 1,
        colorChar: '-',
        colorHex: '#64748b',
        pixelCount: 0,
        mesh
      });
    }

    const builtPlaque = buildMultiColorPlaqueMeshes(grid, settings, palette);
    return { layers: builtLayers, plaqueMeshes: builtPlaque };
  }, [grid, settings, palette, activeProjectName]);

  const resolvedActiveLayerKey = useMemo(() => {
    if (activeLayerKey && layers.some(l => l.key === activeLayerKey)) {
      return activeLayerKey;
    }
    const firstColor = layers.find(l => l.key.startsWith('color_')) || layers[0];
    return firstColor ? firstColor.key : null;
  }, [activeLayerKey, layers]);

  const activeLayer = useMemo(
    () => layers.find(l => l.key === resolvedActiveLayerKey) || layers[0],
    [layers, resolvedActiveLayerKey]
  );

  // ============================================================================
  // 2D PIXEL CANVAS RENDERER
  // ============================================================================

  useEffect(() => {
    if (screen !== 'editor') return;
    const canvas = sprite2dCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const H = grid.length;
    const W = H > 0 ? grid[0].length : 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!W || !H) return;

    const cellW = canvas.width / W;
    const cellH = canvas.height / H;

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const idx = grid[r][c];
        if (idx > 0 && idx <= 15) {
          ctx.fillStyle = palette[idx].hex;
          ctx.fillRect(
            Math.floor(c * cellW),
            Math.floor(r * cellH),
            Math.ceil(cellW),
            Math.ceil(cellH)
          );
        }
      }
    }

    if (W <= 48 && H <= 48) {
      ctx.strokeStyle = theme === 'light' ? 'rgba(15, 23, 42, 0.16)' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let c = 1; c < W; c++) {
        const x = Math.floor(c * cellW) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let r = 1; r < H; r++) {
        const y = Math.floor(r * cellH) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
  }, [grid, palette, screen, theme]);

  // ============================================================================
  // WEBGL 3D VIEWPORT INITIALIZATION & RENDERING
  // ============================================================================

  const draw3DFrame = useCallback(() => {
    const v = viewerRef.current;
    const gl = v.gl;
    if (!gl || !v.program) return;
    const canvas = gl.canvas;
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
    if (isLight) {
      gl.clearColor(0.91, 0.94, 0.98, 1.0);
    } else {
      gl.clearColor(0.06, 0.08, 0.11, 1.0);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 1.0);

    gl.useProgram(v.program);

    const aspect = width / height;
    const proj = mat4Perspective(42 * (Math.PI / 180), aspect, 1.0, 3500.0);

    const cosP = Math.cos(v.pitch);
    const sinP = Math.sin(v.pitch);
    const cosY = Math.cos(v.yaw);
    const sinY = Math.sin(v.yaw);

    const eye = [
      v.target[0] + v.distance * cosP * sinY,
      v.target[1] - v.distance * cosP * cosY,
      v.target[2] + v.distance * sinP
    ];

    const view = mat4LookAt(eye, v.target, [0, 0, 1]);
    const viewProj = mat4Multiply(proj, view);
    gl.uniformMatrix4fv(v.uniforms.uViewProj, false, viewProj);

    // Draw build plate grid
    if (!v.gridBuf) {
      const lines = [];
      const step = 10;
      const min = -40, max = 320;
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

    // Draw uploaded meshes
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
  }, []);

  // Initialize WebGL context and mouse listeners when entering editor
  useEffect(() => {
    if (screen !== 'editor') return;
    const canvas = viewport3dCanvasRef.current;
    if (!canvas) return;

    const v = viewerRef.current;
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return;
    v.gl = gl;
    v.gridBuf = null;
    v.gpuBuffers = [];

    const vsSource = `
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

    const fsSource = `
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

    const compileShader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    v.program = prog;

    v.attribs = {
      aPos: gl.getAttribLocation(prog, 'aPos'),
      aNormal: gl.getAttribLocation(prog, 'aNormal')
    };
    v.uniforms = {
      uViewProj: gl.getUniformLocation(prog, 'uViewProj'),
      uOffset: gl.getUniformLocation(prog, 'uOffset'),
      uColor: gl.getUniformLocation(prog, 'uColor'),
      uIsLine: gl.getUniformLocation(prog, 'uIsLine')
    };

    const onMouseMove = e => {
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
      draw3DFrame();
    };

    const onMouseUp = () => {
      v.isDragging = false;
    };

    const onWheel = e => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      v.distance = Math.max(15, Math.min(1200, v.distance * factor));
      draw3DFrame();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', draw3DFrame);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', draw3DFrame);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [screen, draw3DFrame]);

  // Upload active 3D scene meshes to GPU whenever layers, viewMode, activeLayer, explodeSpacing, or theme changes
  useEffect(() => {
    if (screen !== 'editor') return;
    const v = viewerRef.current;
    v.showEdges = showEdges;
    v.theme = theme;
    const gl = v.gl;
    if (!gl || !v.program) return;

    for (const b of v.gpuBuffers) {
      gl.deleteBuffer(b.posBuf);
      gl.deleteBuffer(b.normBuf);
      gl.deleteBuffer(b.edgeBuf);
    }
    v.gpuBuffers = [];

    const drawItems = [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, maxZ = 0;

    if (viewMode === 'single') {
      if (activeLayer) {
        drawItems.push({
          mesh: activeLayer.mesh,
          color: hexToRgbNormalized(activeLayer.colorHex),
          offset: [0, 0, 0]
        });
        minX = 0; maxX = activeLayer.mesh.plateW;
        minY = 0; maxY = activeLayer.mesh.plateH;
        maxZ = activeLayer.mesh.thickness;
      }
    } else if (viewMode === 'bed') {
      const layout = computeBuildPlateLayout(layers, 8.0);
      for (const item of layout) {
        drawItems.push({
          mesh: item.layer.mesh,
          color: hexToRgbNormalized(item.layer.colorHex),
          offset: [item.offsetX, item.offsetY, item.offsetZ]
        });
        minX = Math.min(minX, item.offsetX);
        maxX = Math.max(maxX, item.offsetX + item.layer.mesh.plateW);
        minY = Math.min(minY, item.offsetY);
        maxY = Math.max(maxY, item.offsetY + item.layer.mesh.plateH);
        maxZ = Math.max(maxZ, item.layer.mesh.thickness);
      }
    } else if (viewMode === 'stack') {
      const colorLayers = layers.filter(l => l.key !== 'silhouette');
      const stackList = colorLayers.length > 0 ? colorLayers : layers;
      stackList.forEach((layer, idx) => {
        const zOff = idx * (settings.thickness + explodeSpacing);
        drawItems.push({
          mesh: layer.mesh,
          color: hexToRgbNormalized(layer.colorHex),
          offset: [0, 0, zOff]
        });
        minX = Math.min(minX, 0);
        maxX = Math.max(maxX, layer.mesh.plateW);
        minY = Math.min(minY, 0);
        maxY = Math.max(maxY, layer.mesh.plateH);
        maxZ = Math.max(maxZ, zOff + layer.mesh.thickness);
      });
    } else if (viewMode === 'plaque') {
      for (const pm of plaqueMeshes) {
        drawItems.push({
          mesh: pm.mesh,
          color: hexToRgbNormalized(pm.colorHex),
          offset: [0, 0, 0]
        });
        minX = 0; maxX = pm.mesh.plateW;
        minY = 0; maxY = pm.mesh.plateH;
        maxZ = settings.thickness * 1.8;
      }
    }

    for (const item of drawItems) {
      const mesh = item.mesh;
      const triCount = mesh.triangles.length;
      const posData = new Float32Array(triCount * 9);
      const normData = new Float32Array(triCount * 9);
      const edgeData = [];

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
        posData[base] = v0[0]; posData[base + 1] = v0[1]; posData[base + 2] = v0[2];
        posData[base + 3] = v1[0]; posData[base + 4] = v1[1]; posData[base + 5] = v1[2];
        posData[base + 6] = v2[0]; posData[base + 7] = v2[1]; posData[base + 8] = v2[2];

        for (let k = 0; k < 9; k += 3) {
          normData[base + k] = nx;
          normData[base + k + 1] = ny;
          normData[base + k + 2] = nz;
        }

        if (Math.abs(nz) > 0.9) {
          if (v0[0] === v1[0] || v0[1] === v1[1]) {
            edgeData.push(v0[0], v0[1], v0[2], v1[0], v1[1], v1[2]);
          }
          if (v1[0] === v2[0] || v1[1] === v2[1]) {
            edgeData.push(v1[0], v1[1], v1[2], v2[0], v2[1], v2[2]);
          }
          if (v2[0] === v0[0] || v2[1] === v0[1]) {
            edgeData.push(v2[0], v2[1], v2[2], v0[0], v0[1], v0[2]);
          }
        }
      }

      const posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, posData, gl.STATIC_DRAW);

      const normBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
      gl.bufferData(gl.ARRAY_BUFFER, normData, gl.STATIC_DRAW);

      const edgeFloat = new Float32Array(edgeData);
      const edgeBuf = gl.createBuffer();
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

    if (isFinite(minX) && isFinite(maxX)) {
      v.target = [(minX + maxX) * 0.5, (minY + maxY) * 0.5, maxZ * 0.4];
      const span = Math.max(maxX - minX, maxY - minY, maxZ * 2);
      v.distance = Math.max(45, span * 1.45);
    }

    draw3DFrame();
  }, [screen, layers, plaqueMeshes, viewMode, activeLayer, explodeSpacing, settings.thickness, showEdges, theme, draw3DFrame]);

  // ============================================================================
  // PROJECT & SPRITE ACTIONS
  // ============================================================================

  const applyCodeText = useCallback(rawCode => {
    setCodeText(rawCode);
    const parsed = parseMakeCodeInput(rawCode);
    setSpriteOccurrences(parsed.occurrences);
    setSelectedOccurrenceIdx(0);
    setGrid(parsed.occurrences[0].grid);
  }, []);

  const openProject = useCallback(proj => {
    setActiveProjectId(proj.id);
    setActiveProjectName(proj.name);
    setPalette(
      DEFAULT_MAKECODE_PALETTE.map((c, idx) => ({
        ...c,
        hex: (proj.paletteHexes && proj.paletteHexes[idx]) ? proj.paletteHexes[idx] : c.hex
      }))
    );
    setSettings({ ...getDefaultSettings(), ...(proj.settings || {}) });
    applyCodeText(proj.code || PRESET_SPRITES.duck.code);
    setScreen('editor');
  }, [applyCodeText]);

  const handleCreateNewProject = e => {
    e.preventDefault();
    let initialCode = PRESET_SPRITES.duck.code;
    if (newProjTemplate === 'blank16') {
      initialCode = gridToMakeCodeString(createBlankGrid(16, 16));
    } else if (newProjTemplate === 'blank32') {
      initialCode = gridToMakeCodeString(createBlankGrid(32, 32));
    } else if (PRESET_SPRITES[newProjTemplate]) {
      initialCode = PRESET_SPRITES[newProjTemplate].code;
    }

    const newProj = {
      id: generateId(),
      name: (newProjName || 'Untitled Stencil Project').trim() || 'Untitled Stencil Project',
      updatedAt: Date.now(),
      code: initialCode,
      paletteHexes: DEFAULT_MAKECODE_PALETTE.map(c => c.hex),
      settings: getDefaultSettings()
    };

    const next = [newProj, ...projects];
    saveProjectsList(next);
    setShowNewModal(false);
    openProject(newProj);
  };

  const handleDuplicateProject = projId => {
    const orig = projects.find(p => p.id === projId);
    if (!orig) return null;
    const copy = {
      id: generateId(),
      name: `${orig.name} (Copy)`,
      updatedAt: Date.now(),
      code: orig.code,
      paletteHexes: [...(orig.paletteHexes || DEFAULT_MAKECODE_PALETTE.map(c => c.hex))],
      settings: { ...getDefaultSettings(), ...(orig.settings || {}) }
    };
    const next = [copy, ...projects];
    saveProjectsList(next);
    return copy;
  };

  const handleDeleteProject = projId => {
    const target = projects.find(p => p.id === projId);
    if (!target) return;
    if (window.confirm(`Delete project "${target.name}"?`)) {
      saveProjectsList(projects.filter(p => p.id !== projId));
    }
  };

  const handleRenameProjectCard = proj => {
    const nextName = window.prompt('Rename project:', proj.name);
    if (nextName && nextName.trim()) {
      const updated = projects.map(p =>
        p.id === proj.id ? { ...p, name: nextName.trim(), updatedAt: Date.now() } : p
      );
      saveProjectsList(updated);
    }
  };

  const handleQuickDownloadProject3mf = (proj, spriteGrid) => {
    const projSettings = { ...getDefaultSettings(), ...(proj.settings || {}) };
    const paletteHexes = proj.paletteHexes || DEFAULT_MAKECODE_PALETTE.map(c => c.hex);
    const basePrefix = sanitizeFilename(proj.name);
    const builtLayers = [];
    let orderCounter = 1;

    if (projSettings.includeSilhouette) {
      const isHole = spriteGrid.map(row => row.map(c => c > 0));
      const mesh = buildStencilMesh(spriteGrid, isHole, projSettings, orderCounter++);
      builtLayers.push({
        shortName: `${basePrefix}_00_Silhouette`,
        colorHex: '#64748b',
        mesh
      });
    }

    for (let colorIdx = 1; colorIdx <= 15; colorIdx++) {
      let hasColor = false;
      const isHole = spriteGrid.map(row =>
        row.map(c => {
          if (c === colorIdx) {
            hasColor = true;
            return true;
          }
          return false;
        })
      );
      if (hasColor) {
        const pEntry = DEFAULT_MAKECODE_PALETTE[colorIdx];
        const mesh = buildStencilMesh(spriteGrid, isHole, projSettings, orderCounter++);
        builtLayers.push({
          shortName: `${basePrefix}_${pEntry.char.toUpperCase()}_${pEntry.name.replace(/\s+/g, '')}`,
          colorHex: paletteHexes[colorIdx] || pEntry.hex,
          mesh
        });
      }
    }

    if (builtLayers.length === 0) return;
    const layout = computeBuildPlateLayout(builtLayers, 8.0);
    const items = layout.map(entry => ({
      name: entry.layer.shortName,
      colorHex: entry.layer.colorHex,
      mesh: entry.layer.mesh,
      offsetX: entry.offsetX,
      offsetY: entry.offsetY,
      offsetZ: entry.offsetZ
    }));
    const bytes = generate3mfArchive(items, proj.name);
    triggerFileDownload(bytes, `${basePrefix}_All_Stencils.3mf`, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
  };

  // Export & Import JSON Backups
  const handleExportAllProjectsJson = () => {
    const jsonBytes = new TextEncoder().encode(JSON.stringify(projects, null, 2));
    triggerFileDownload(jsonBytes, 'arcade-3mf-stencil-projects.json', 'application/json');
  };

  const handleImportProjectsJson = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (Array.isArray(imported)) {
          const valid = imported
            .filter(item => item && item.name && item.code)
            .map(item => ({
              id: generateId(),
              name: String(item.name),
              updatedAt: item.updatedAt || Date.now(),
              code: String(item.code),
              paletteHexes: Array.isArray(item.paletteHexes)
                ? item.paletteHexes
                : DEFAULT_MAKECODE_PALETTE.map(c => c.hex),
              settings: { ...getDefaultSettings(), ...(item.settings || {}) }
            }));
          if (valid.length > 0) {
            saveProjectsList([...valid, ...projects]);
          }
        }
      } catch (err) {
        window.alert('Could not parse projects JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 2D Pixel Editor Painting & Transforms
  const updateGridAndCode = newGrid => {
    setGrid(newGrid);
    setCodeText(gridToMakeCodeString(newGrid));
    setSpriteOccurrences([{ label: `Sprite (${newGrid[0]?.length || 0}×${newGrid.length})`, grid: newGrid }]);
  };

  const handleCanvasPaint = e => {
    const canvas = sprite2dCanvasRef.current;
    if (!canvas) return;
    const H = grid.length;
    const W = H > 0 ? grid[0].length : 0;
    if (!W || !H) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor((x / rect.width) * W);
    const row = Math.floor((y / rect.height) * H);

    if (row >= 0 && row < H && col >= 0 && col < W) {
      const curIdx = grid[row][col];
      const pEntry = palette[curIdx] || DEFAULT_MAKECODE_PALETTE[0];
      setHoverInfo(`Pixel (${col}, ${row}) · Color ${pEntry.char.toUpperCase()} (${pEntry.name})`);

      if (isPaintingRef.current) {
        const targetColor = e.buttons === 2 ? 0 : selectedBrushColor;
        if (grid[row][col] !== targetColor) {
          const nextGrid = grid.map((r, rIdx) =>
            rIdx === row ? r.map((c, cIdx) => (cIdx === col ? targetColor : c)) : r
          );
          updateGridAndCode(nextGrid);
        }
      }
    }
  };

  const handleTrimSprite = () => {
    const H = grid.length;
    const W = H > 0 ? grid[0].length : 0;
    let rMin = H, rMax = -1, cMin = W, cMax = -1;
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (grid[r][c] > 0) {
          rMin = Math.min(rMin, r);
          rMax = Math.max(rMax, r);
          cMin = Math.min(cMin, c);
          cMax = Math.max(cMax, c);
        }
      }
    }
    if (rMax >= rMin && cMax >= cMin) {
      const trimmed = grid.slice(rMin, rMax + 1).map(row => row.slice(cMin, cMax + 1));
      updateGridAndCode(trimmed);
    }
  };

  const handleFlipH = () => {
    updateGridAndCode(grid.map(row => [...row].reverse()));
  };

  const handleFlipV = () => {
    updateGridAndCode([...grid].reverse());
  };

  const handleRotate90 = () => {
    const H = grid.length;
    const W = H > 0 ? grid[0].length : 0;
    const rotated = Array.from({ length: W }, (_, c) =>
      Array.from({ length: H }, (__, r) => grid[H - 1 - r][c])
    );
    updateGridAndCode(rotated);
  };

  const handleImportImage = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 32;
        let targetW = img.width;
        let targetH = img.height;
        if (targetW > maxDim || targetH > maxDim) {
          const scale = maxDim / Math.max(targetW, targetH);
          targetW = Math.max(1, Math.round(targetW * scale));
          targetH = Math.max(1, Math.round(targetH * scale));
        }

        const offCanvas = document.createElement('canvas');
        offCanvas.width = targetW;
        offCanvas.height = targetH;
        const ctx = offCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const imgData = ctx.getImageData(0, 0, targetW, targetH).data;

        const palRgb = palette.map(p => {
          const c = p.hex.replace('#', '');
          return [
            parseInt(c.slice(0, 2), 16),
            parseInt(c.slice(2, 4), 16),
            parseInt(c.slice(4, 6), 16)
          ];
        });

        const newGrid = createBlankGrid(targetW, targetH);
        for (let r = 0; r < targetH; r++) {
          for (let c = 0; c < targetW; c++) {
            const i = (r * targetW + c) * 4;
            if (imgData[i + 3] < 96) {
              newGrid[r][c] = 0;
              continue;
            }
            const pr = imgData[i], pg = imgData[i + 1], pb = imgData[i + 2];
            let bestIdx = 1;
            let bestDist = Infinity;
            for (let pIdx = 1; pIdx <= 15; pIdx++) {
              const [cr, cg, cb] = palRgb[pIdx];
              const dist = (pr - cr) ** 2 * 0.3 + (pg - cg) ** 2 * 0.59 + (pb - cb) ** 2 * 0.11;
              if (dist < bestDist) {
                bestDist = dist;
                bestIdx = pIdx;
              }
            }
            newGrid[r][c] = bestIdx;
          }
        }
        updateGridAndCode(newGrid);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // .3MF & .STL Download Handlers in Studio
  const downloadSingleLayer3mf = layer => {
    const bytes = generate3mfArchive(
      [{
        name: layer.shortName,
        colorHex: layer.colorHex,
        mesh: layer.mesh,
        offsetX: 0,
        offsetY: 0,
        offsetZ: 0
      }],
      `${activeProjectName} - ${layer.title}`
    );
    triggerFileDownload(bytes, `${layer.shortName}.3mf`, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
  };

  const downloadAllStencils3mf = () => {
    const projPrefix = sanitizeFilename(activeProjectName);
    const layout = computeBuildPlateLayout(layers, 8.0);
    const items = layout.map(entry => ({
      name: entry.layer.shortName,
      colorHex: entry.layer.colorHex,
      mesh: entry.layer.mesh,
      offsetX: entry.offsetX,
      offsetY: entry.offsetY,
      offsetZ: entry.offsetZ
    }));
    const bytes = generate3mfArchive(items, `${activeProjectName} - Stencil Build Plate`);
    triggerFileDownload(bytes, `${projPrefix}_All_Stencils.3mf`, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
  };

  const downloadMultiColorPlaque3mf = () => {
    const projPrefix = sanitizeFilename(activeProjectName);
    const items = plaqueMeshes.map(pm => ({
      name: `${projPrefix}_${pm.name}`,
      colorHex: pm.colorHex,
      mesh: pm.mesh,
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0
    }));
    const bytes = generate3mfArchive(items, `${activeProjectName} - Multi-Color Plaque`);
    triggerFileDownload(bytes, `${projPrefix}_MultiColor_Plaque.3mf`, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
  };

  // Derived Diagnostics for HUD
  const spriteH = grid.length;
  const spriteW = spriteH > 0 ? grid[0].length : 0;
  const colorLayerCount = layers.filter(l => l.key.startsWith('color_')).length;
  const allManifold = layers.every(l => l.mesh.isManifold);
  const inspectedLayers = viewMode === 'single' && activeLayer ? [activeLayer] : layers;
  const unbridgedCount = inspectedLayers.reduce((s, l) => s + l.mesh.islandInfo.remainingIslandCount, 0);
  const bridgedCount = inspectedLayers.reduce((s, l) => s + l.mesh.islandInfo.addedBridgeCells, 0);
  const projPrefix = sanitizeFilename(activeProjectName);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return [...projects]
      .filter(p => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [projects, searchQuery]);

  const renderThemeToggleButton = () => (
    <button
      type="button"
      className="btn btn-secondary theme-toggle-btn"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
    >
      {theme === 'dark' ? (
        <>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );

  return (
    <>
      {/* ====================================================================
          MAIN MENU / PROJECTS HOME SCREEN
          ==================================================================== */}
      {screen === 'menu' && (
        <div className="main-menu-view">
          <header className="menu-header">
            <div className="brand">
              <div className="brand-icon" aria-hidden="true">
                <span className="px c2" /><span className="px c4" /><span className="px c5" /><span className="px c7" />
                <span className="px c9" /><span className="px ca" /><span className="px c3" /><span className="px c1" />
              </div>
              <div>
                <h1>Arcade <span>.3MF</span> Stenciler</h1>
                <p className="subtitle">
                  Turn MakeCode Arcade <code>img`...`</code> JS pixel art into 3D-printable multi-layer <code>.3mf</code> stencils
                </p>
              </div>
            </div>

            <div className="header-actions">
              {renderThemeToggleButton()}
              <label className="btn btn-secondary file-btn" title="Import exported projects (.json)">
                <input type="file" accept=".json,application/json" hidden onChange={handleImportProjectsJson} />
                <span>Import Projects (.json)</span>
              </label>
              <button type="button" className="btn btn-secondary" onClick={handleExportAllProjectsJson}>
                Backup All Projects
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowHelpModal(true)}>
                How to Use
              </button>
            </div>
          </header>

          <main className="menu-content">
            <section className="menu-section">
              <div className="menu-section-header">
                <div>
                  <h2>My Projects</h2>
                  <p className="menu-section-sub">Your saved stencil projects are stored automatically in your browser</p>
                </div>
                <div className="menu-search-wrap">
                  <input
                    type="search"
                    id="projectSearchInput"
                    placeholder="Search projects by name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setNewProjTemplate('duck');
                      setNewProjName('MakeCode Duck Stencil');
                      setShowNewModal(true);
                    }}
                  >
                    + New Stencil Project
                  </button>
                </div>
              </div>

              <div className="projects-grid">
                <button
                  type="button"
                  className="new-project-card"
                  onClick={() => {
                    setNewProjTemplate('duck');
                    setNewProjName('MakeCode Duck Stencil');
                    setShowNewModal(true);
                  }}
                >
                  <div className="new-project-plus">+</div>
                  <strong>New Stencil Project</strong>
                  <span>Create a named project from MakeCode JS code, templates, or a blank grid</span>
                </button>

                {filteredProjects.map(proj => {
                  const parsed = parseMakeCodeInput(proj.code);
                  const spriteGrid = parsed.occurrences[0]?.grid || createBlankGrid(16, 16);
                  const H = spriteGrid.length;
                  const W = H > 0 ? spriteGrid[0].length : 0;
                  const usedColors = new Set();
                  for (let r = 0; r < H; r++) {
                    for (let c = 0; c < W; c++) {
                      if (spriteGrid[r][c] > 0) usedColors.add(spriteGrid[r][c]);
                    }
                  }
                  const pSize = proj.settings?.pixelSize || 4;
                  const pMargin = proj.settings?.margin || 8;

                  return (
                    <div key={proj.id} className="project-card">
                      <div
                        className="project-thumb-wrap"
                        title={`Click to open ${proj.name}`}
                        onClick={() => openProject(proj)}
                      >
                        <PixelThumbnailCanvas
                          grid={spriteGrid}
                          paletteHexes={proj.paletteHexes}
                          width={128}
                          height={128}
                          className="project-thumb-canvas"
                        />
                        <div className="project-thumb-badges">
                          <span className="badge">{W}×{H} px</span>
                          <span className="badge badge-accent">
                            {usedColors.size} color{usedColors.size === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>

                      <div className="project-body">
                        <div className="project-title-row">
                          <span
                            className="project-card-name"
                            title={proj.name}
                            onClick={() => openProject(proj)}
                          >
                            {proj.name}
                          </span>
                          <button
                            type="button"
                            className="btn-xs"
                            title="Rename project"
                            onClick={() => handleRenameProjectCard(proj)}
                          >
                            Rename
                          </button>
                        </div>

                        <div className="project-meta-row">
                          <span>
                            {(pSize * W + 2 * pMargin).toFixed(0)}×{(pSize * H + 2 * pMargin).toFixed(0)} mm
                          </span>
                          <span>Edited {formatRelativeTime(proj.updatedAt)}</span>
                        </div>

                        <div className="project-actions-row">
                          <button
                            type="button"
                            className="btn btn-primary btn-xs btn-open"
                            onClick={() => openProject(proj)}
                          >
                            Open Studio
                          </button>
                          <button
                            type="button"
                            className="btn-xs"
                            title="Download all .3mf stencils for this project"
                            onClick={() => handleQuickDownloadProject3mf(proj, spriteGrid)}
                          >
                            .3MF
                          </button>
                          <button
                            type="button"
                            className="btn-xs"
                            title="Duplicate project"
                            onClick={() => handleDuplicateProject(proj.id)}
                          >
                            Copy
                          </button>
                          <button
                            type="button"
                            className="btn-xs btn-danger"
                            title="Delete project"
                            onClick={() => handleDeleteProject(proj.id)}
                          >
                            Del
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Starter Templates Section */}
            <section className="menu-section">
              <div className="menu-section-header">
                <div>
                  <h2>Starter Arcade Templates</h2>
                  <p className="menu-section-sub">
                    Click any template to create a new named project from classic MakeCode Arcade sprites
                  </p>
                </div>
              </div>

              <div className="templates-grid">
                {Object.entries(PRESET_SPRITES).map(([key, tpl]) => {
                  const g = parseMakeCodeInput(tpl.code).occurrences[0]?.grid || createBlankGrid(16, 16);
                  return (
                    <div
                      key={key}
                      className="template-card"
                      title={`Create a new project from ${tpl.title}`}
                      onClick={() => {
                        setNewProjTemplate(key);
                        setNewProjName(`${tpl.title} Stencil`);
                        setShowNewModal(true);
                      }}
                    >
                      <PixelThumbnailCanvas
                        grid={g}
                        paletteHexes={DEFAULT_MAKECODE_PALETTE.map(c => c.hex)}
                        width={64}
                        height={64}
                        className="template-thumb"
                      />
                      <div className="template-info">
                        <strong>{tpl.title}</strong>
                        <span>{tpl.subtitle}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </main>
        </div>
      )}

      {/* ====================================================================
          STENCIL STUDIO WORKSPACE VIEW
          ==================================================================== */}
      {screen === 'editor' && (
        <div className="editor-view">
          <header className="app-header">
            <div className="brand-and-nav">
              <button
                type="button"
                className="btn btn-secondary back-menu-btn"
                title="Return to Main Menu"
                onClick={() => setScreen('menu')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Main Menu</span>
              </button>

              <div className="project-title-bar">
                <label htmlFor="activeProjectNameInput" className="sr-only">Project Name</label>
                <input
                  type="text"
                  id="activeProjectNameInput"
                  className="project-name-input"
                  placeholder="Untitled Project"
                  maxLength={60}
                  value={activeProjectName}
                  onChange={e => setActiveProjectName(e.target.value)}
                  title="Click to rename project"
                />
                <span className="save-badge">✓ Saved</span>
              </div>
            </div>

            <div className="header-actions">
              <div className="preset-group">
                <label htmlFor="presetSelect">Load Sprite Preset:</label>
                <select
                  id="presetSelect"
                  value=""
                  onChange={e => {
                    const tpl = PRESET_SPRITES[e.target.value];
                    if (tpl) applyCodeText(tpl.code);
                  }}
                >
                  <option value="">-- Replace sprite with preset --</option>
                  {Object.entries(PRESET_SPRITES).map(([k, tpl]) => (
                    <option key={k} value={k}>{tpl.title} ({tpl.subtitle.split(' · ')[0]})</option>
                  ))}
                </select>
              </div>

              <label className="btn btn-secondary file-btn" title="Import a PNG/JPG image and quantize to MakeCode Arcade palette">
                <input type="file" accept="image/*" hidden onChange={handleImportImage} />
                <span>Import Image</span>
              </label>

              <button
                type="button"
                className="btn btn-secondary"
                title="Save a copy of this project"
                onClick={() => {
                  const copy = handleDuplicateProject(activeProjectId);
                  if (copy) openProject(copy);
                }}
              >
                Duplicate
              </button>

              {renderThemeToggleButton()}

              <button type="button" className="btn btn-ghost" onClick={() => setShowHelpModal(true)}>
                How to Use
              </button>
            </div>
          </header>

          <main className="workspace-grid">
            {/* LEFT PANEL: MakeCode JS Code & 2D Pixel Editor */}
            <section className="panel panel-code" aria-label="MakeCode Sprite Input">
              <div className="panel-header">
                <h2>1. MakeCode JS / Sprite Input</h2>
                <div className="badge-row">
                  <span className="badge">{spriteW} × {spriteH} px</span>
                  <span className="badge badge-accent">
                    {colorLayerCount} color{colorLayerCount === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <div className="panel-body">
                {spriteOccurrences.length > 1 && (
                  <div className="multi-sprite-bar">
                    <label htmlFor="spriteOccurrenceSelect">Found multiple sprites in code:</label>
                    <select
                      id="spriteOccurrenceSelect"
                      value={selectedOccurrenceIdx}
                      onChange={e => {
                        const idx = parseInt(e.target.value, 10) || 0;
                        if (spriteOccurrences[idx]) {
                          setSelectedOccurrenceIdx(idx);
                          setGrid(spriteOccurrences[idx].grid.map(r => [...r]));
                        }
                      }}
                    >
                      {spriteOccurrences.map((occ, idx) => (
                        <option key={idx} value={idx}>{occ.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="code-editor-wrap">
                  <div className="code-toolbar">
                    <span>Paste MakeCode <code>img`...`</code> code or marquee selection:</span>
                    <div className="code-toolbar-actions">
                      <button
                        type="button"
                        className="btn-xs"
                        onClick={() => setCodeText(gridToMakeCodeString(grid))}
                      >
                        Format <code>img` `</code>
                      </button>
                      <button
                        type="button"
                        className="btn-xs"
                        onClick={() => {
                          navigator.clipboard?.writeText(gridToMakeCodeString(grid));
                          setCopyButtonText('Copied!');
                          setTimeout(() => setCopyButtonText('Copy JS'), 1200);
                        }}
                      >
                        {copyButtonText}
                      </button>
                      <button
                        type="button"
                        className="btn-xs"
                        onClick={() => updateGridAndCode(createBlankGrid(spriteW || 16, spriteH || 16))}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <textarea
                    id="codeInput"
                    spellCheck={false}
                    value={codeText}
                    onChange={e => applyCodeText(e.target.value)}
                    placeholder="Paste MakeCode Arcade img`...` JS code here..."
                  />
                </div>

                {/* 2D Interactive Pixel Editor & Palette */}
                <div className="pixel-editor-card">
                  <div className="pixel-editor-header">
                    <span className="section-label">Interactive 2D Sprite Preview &amp; Paint</span>
                    <div className="transform-btns">
                      <button type="button" className="btn-xs" onClick={handleTrimSprite}>Trim Borders</button>
                      <button type="button" className="btn-xs" onClick={handleFlipH}>Flip H</button>
                      <button type="button" className="btn-xs" onClick={handleFlipV}>Flip V</button>
                      <button type="button" className="btn-xs" onClick={handleRotate90}>Rot 90°</button>
                    </div>
                  </div>

                  <div className="canvas-2d-container">
                    <canvas
                      ref={sprite2dCanvasRef}
                      id="sprite2dCanvas"
                      width={320}
                      height={320}
                      onContextMenu={e => e.preventDefault()}
                      onMouseDown={e => {
                        isPaintingRef.current = true;
                        handleCanvasPaint(e);
                      }}
                      onMouseUp={() => {
                        isPaintingRef.current = false;
                      }}
                      onMouseMove={handleCanvasPaint}
                    />
                    <div className="pixel-hover-info">{hoverInfo}</div>
                  </div>

                  <div className="palette-section">
                    <div className="palette-header">
                      <span className="section-label">MakeCode Arcade 16-Color Palette</span>
                      <button
                        type="button"
                        className="btn-xs"
                        onClick={() => setPalette(DEFAULT_MAKECODE_PALETTE.map(c => ({ ...c })))}
                      >
                        Reset Palette
                      </button>
                    </div>

                    <div className="palette-bar" role="radiogroup" aria-label="MakeCode Palette Colors">
                      {palette.map(entry => {
                        const rgb = hexToRgbNormalized(entry.hex);
                        const lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
                        const textColor = lum > 0.6 ? '#0d1117' : '#ffffff';
                        return (
                          <div
                            key={entry.index}
                            className={`palette-swatch${entry.transparent ? ' transparent-swatch' : ''}${selectedBrushColor === entry.index ? ' active' : ''}`}
                            style={!entry.transparent ? { backgroundColor: entry.hex, color: textColor } : undefined}
                            title={`${entry.char.toUpperCase()} — ${entry.name} (${entry.transparent ? 'Transparent' : entry.hex})`}
                            onClick={() => setSelectedBrushColor(entry.index)}
                          >
                            {entry.char.toUpperCase()}
                            {!entry.transparent && (
                              <input
                                type="color"
                                value={entry.hex}
                                onChange={e => {
                                  const nextHex = e.target.value;
                                  setPalette(prev =>
                                    prev.map(p => (p.index === entry.index ? { ...p, hex: nextHex } : p))
                                  );
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CENTER PANEL: Interactive 3D Stencil & Build Plate Viewer */}
            <section className="panel panel-3d" aria-label="3D Stencil Preview">
              <div className="panel-header">
                <h2>2. Interactive 3D <code>.3MF</code> Preview</h2>
                <div className="view-mode-tabs" role="tablist">
                  {[
                    { id: 'single', label: 'Single Stencil' },
                    { id: 'bed', label: 'Print Bed (All Layers)' },
                    { id: 'stack', label: 'Stacked Alignment' },
                    { id: 'plaque', label: 'Multi-Color Plaque' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`tab-btn${viewMode === tab.id ? ' active' : ''}`}
                      onClick={() => setViewMode(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel-body preview-3d-body">
                <div className="viewport-toolbar">
                  {viewMode === 'single' && (
                    <div className="layer-selector-wrap">
                      <label htmlFor="activeLayerSelect">Inspecting Stencil:</label>
                      <select
                        id="activeLayerSelect"
                        value={resolvedActiveLayerKey || ''}
                        onChange={e => setActiveLayerKey(e.target.value)}
                      >
                        {layers.map(l => (
                          <option key={l.key} value={l.key}>
                            {l.title} ({l.pixelCount} px)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {viewMode === 'stack' && (
                    <div className="explode-slider-wrap">
                      <label htmlFor="explodeSlider">Stack Z-Spacing:</label>
                      <input
                        type="range"
                        id="explodeSlider"
                        min="0"
                        max="25"
                        step="0.5"
                        value={explodeSpacing}
                        onChange={e => setExplodeSpacing(parseFloat(e.target.value) || 0)}
                      />
                      <span>{explodeSpacing.toFixed(1)} mm</span>
                    </div>
                  )}

                  <div className="camera-btns">
                    <button
                      type="button"
                      className="btn-xs"
                      onClick={() => {
                        viewerRef.current.yaw = -0.55;
                        viewerRef.current.pitch = 0.72;
                        draw3DFrame();
                      }}
                    >
                      Iso View
                    </button>
                    <button
                      type="button"
                      className="btn-xs"
                      onClick={() => {
                        viewerRef.current.yaw = 0;
                        viewerRef.current.pitch = 1.52;
                        draw3DFrame();
                      }}
                    >
                      Top (2D Plan)
                    </button>
                    <button
                      type="button"
                      className="btn-xs"
                      onClick={() => {
                        viewerRef.current.yaw = 0;
                        viewerRef.current.pitch = 0.12;
                        draw3DFrame();
                      }}
                    >
                      Front
                    </button>
                    <button
                      type="button"
                      className="btn-xs"
                      onClick={() => setShowEdges(prev => !prev)}
                    >
                      Edges: {showEdges ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <div className="viewport-container">
                  <canvas
                    ref={viewport3dCanvasRef}
                    id="viewport3dCanvas"
                    onContextMenu={e => e.preventDefault()}
                    onMouseDown={e => {
                      viewerRef.current.isDragging = true;
                      viewerRef.current.dragButton = e.button;
                      viewerRef.current.lastMouse = [e.clientX, e.clientY];
                    }}
                  />

                  <div className="viewport-hud-top">
                    <span className="hud-pill">
                      {viewMode === 'single' && activeLayer
                        ? `${activeProjectName} — ${activeLayer.title}`
                        : viewMode === 'bed'
                        ? `${activeProjectName} — Print Bed (${layers.length} Plates)`
                        : viewMode === 'stack'
                        ? `${activeProjectName} — Stacked Alignment`
                        : `${activeProjectName} — Multi-Color Plaque (${plaqueMeshes.length} parts)`}
                    </span>
                    {activeLayer && (
                      <span className="hud-pill">
                        {activeLayer.mesh.plateW.toFixed(1)} × {activeLayer.mesh.plateH.toFixed(1)} × {activeLayer.mesh.thickness.toFixed(1)} mm
                      </span>
                    )}
                  </div>

                  <div className="viewport-hud-bottom">
                    <div className="hud-stats">
                      <span>
                        {viewMode === 'single' && activeLayer
                          ? `${activeLayer.mesh.vertices.length.toLocaleString()} vertices · ${activeLayer.mesh.triangles.length.toLocaleString()} triangles`
                          : `${layers.reduce((s, l) => s + l.mesh.triangles.length, 0).toLocaleString()} total triangles`}
                      </span>
                      <span className={allManifold ? 'status-ok' : 'status-warn'}>
                        {allManifold ? '✓ Watertight 2-Manifold' : '⚠ Check Mesh Topology'}
                      </span>
                      <span className={unbridgedCount > 0 ? 'status-warn' : 'status-ok'}>
                        {unbridgedCount > 0
                          ? `⚠ ${unbridgedCount} Floating Island${unbridgedCount === 1 ? '' : 's'} (Enable Bridges)`
                          : bridgedCount > 0
                          ? `✓ Auto-Bridged (${bridgedCount} bridge rib${bridgedCount === 1 ? '' : 's'})`
                          : '✓ All Solid Regions Connected'}
                      </span>
                    </div>
                    <div className="hud-controls-hint">
                      Left-drag: Orbit · Right-drag / Shift+drag: Pan · Scroll: Zoom
                    </div>
                  </div>
                </div>

                {/* Primary Export Bar */}
                <div className="primary-export-bar">
                  <button type="button" className="btn btn-primary btn-lg" onClick={downloadAllStencils3mf}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <div>
                      <strong>Download All Stencil Plates (.3mf)</strong>
                      <small>{projPrefix}_All_Stencils.3mf ({layers.length} plates)</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="btn btn-accent btn-lg"
                    onClick={() => {
                      if (viewMode === 'plaque') {
                        downloadMultiColorPlaque3mf();
                      } else if (activeLayer) {
                        downloadSingleLayer3mf(activeLayer);
                      }
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <div>
                      <strong>Download Selected (.3mf)</strong>
                      <small>
                        {viewMode === 'plaque'
                          ? `${projPrefix}_MultiColor_Plaque.3mf (${plaqueMeshes.length} materials)`
                          : activeLayer
                          ? `${activeLayer.shortName}.3mf`
                          : 'Selected stencil'}
                      </small>
                    </div>
                  </button>
                </div>
              </div>
            </section>

            {/* RIGHT PANEL: Stencil Geometry Settings & Per-Color Layer List */}
            <section className="panel panel-settings" aria-label="Stencil Geometry and Layer Exports">
              <div className="panel-header">
                <h2>3. Stencil Settings &amp; Layers</h2>
                <button
                  type="button"
                  className="btn-xs"
                  onClick={() => setSettings(getDefaultSettings())}
                >
                  Reset Defaults
                </button>
              </div>

              <div className="panel-body settings-scroll">
                <div className="settings-group">
                  <h3>Appearance</h3>
                  <div className="control-row">
                    <label htmlFor="themeSelect">Color Theme</label>
                    <select
                      id="themeSelect"
                      value={theme}
                      onChange={e => updateTheme(e.target.value)}
                    >
                      <option value="dark">Dark Theme (Arcade Night)</option>
                      <option value="light">Light Theme (Daylight Studio)</option>
                    </select>
                  </div>
                </div>

                <div className="settings-group">
                  <h3>Physical Dimensions</h3>
                  <div className="control-row">
                    <label>
                      <span>Pixel Size (mm)</span>
                      <span className="val-badge">{settings.pixelSize.toFixed(1)} mm</span>
                    </label>
                    <div className="input-with-number">
                      <input
                        type="range"
                        min="1.0"
                        max="15.0"
                        step="0.5"
                        value={settings.pixelSize}
                        onChange={e => setSettings(s => ({ ...s, pixelSize: parseFloat(e.target.value) || 4.0 }))}
                      />
                      <input
                        type="number"
                        min="0.5"
                        max="50"
                        step="0.5"
                        value={settings.pixelSize}
                        onChange={e => setSettings(s => ({ ...s, pixelSize: parseFloat(e.target.value) || 4.0 }))}
                      />
                    </div>
                  </div>

                  <div className="control-row">
                    <label>
                      <span>Stencil Thickness (mm)</span>
                      <span className="val-badge">{settings.thickness.toFixed(1)} mm</span>
                    </label>
                    <div className="input-with-number">
                      <input
                        type="range"
                        min="0.4"
                        max="5.0"
                        step="0.2"
                        value={settings.thickness}
                        onChange={e => setSettings(s => ({ ...s, thickness: parseFloat(e.target.value) || 1.2 }))}
                      />
                      <input
                        type="number"
                        min="0.2"
                        max="20"
                        step="0.1"
                        value={settings.thickness}
                        onChange={e => setSettings(s => ({ ...s, thickness: parseFloat(e.target.value) || 1.2 }))}
                      />
                    </div>
                  </div>

                  <div className="control-row">
                    <label>
                      <span>Outer Frame Margin (mm)</span>
                      <span className="val-badge">{settings.margin.toFixed(1)} mm</span>
                    </label>
                    <div className="input-with-number">
                      <input
                        type="range"
                        min="2.0"
                        max="30.0"
                        step="1.0"
                        value={settings.margin}
                        onChange={e => setSettings(s => ({ ...s, margin: parseFloat(e.target.value) || 8.0 }))}
                      />
                      <input
                        type="number"
                        min="1.0"
                        max="100"
                        step="0.5"
                        value={settings.margin}
                        onChange={e => setSettings(s => ({ ...s, margin: parseFloat(e.target.value) || 8.0 }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="settings-group">
                  <h3>Cutout &amp; Bridge Mode</h3>
                  <div className="control-row">
                    <label htmlFor="cutoutModeSelect">Pixel Cutout Style</label>
                    <select
                      id="cutoutModeSelect"
                      value={settings.cutoutMode}
                      onChange={e => setSettings(s => ({ ...s, cutoutMode: e.target.value }))}
                    >
                      <option value="grid">Bridged Pixel Grid (Ribs between every pixel)</option>
                      <option value="merged-bridged">Merged Contiguous + Auto-Bridge Islands</option>
                      <option value="merged-raw">Merged Contiguous (Raw / Unbridged)</option>
                    </select>
                    <p className="setting-hint">
                      {settings.cutoutMode === 'grid'
                        ? 'Adds structural grid ribs between pixels so every pixel stays crisp and inner islands never fall out.'
                        : settings.cutoutMode === 'merged-bridged'
                        ? 'Merges adjacent same-color pixels into continuous cutouts and automatically bridges any enclosed solid islands.'
                        : 'Merges adjacent same-color pixels without adding bridges. Watch for floating island warnings.'}
                    </p>
                  </div>

                  {settings.cutoutMode !== 'merged-raw' && (
                    <div className="control-row">
                      <label>
                        <span>Bridge / Grid Rib Width (mm)</span>
                        <span className="val-badge">{settings.bridgeWidth.toFixed(1)} mm</span>
                      </label>
                      <div className="input-with-number">
                        <input
                          type="range"
                          min="0.4"
                          max="3.0"
                          step="0.1"
                          value={settings.bridgeWidth}
                          onChange={e => setSettings(s => ({ ...s, bridgeWidth: parseFloat(e.target.value) || 0.8 }))}
                        />
                        <input
                          type="number"
                          min="0.2"
                          max="10.0"
                          step="0.1"
                          value={settings.bridgeWidth}
                          onChange={e => setSettings(s => ({ ...s, bridgeWidth: parseFloat(e.target.value) || 0.8 }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="settings-group">
                  <h3>Alignment &amp; Layer Identification</h3>
                  <div className="control-row">
                    <label htmlFor="regHolesSelect">Multi-Layer Registration Holes</label>
                    <select
                      id="regHolesSelect"
                      value={settings.regHoles}
                      onChange={e => setSettings(s => ({ ...s, regHoles: e.target.value }))}
                    >
                      <option value="asymmetric3">3 Asymmetric Corner Holes (Foolproof Orientation)</option>
                      <option value="corners4">4 Symmetric Corner Holes</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  {settings.regHoles !== 'none' && (
                    <div className="control-row">
                      <label>
                        <span>Alignment Hole Size (mm)</span>
                        <span className="val-badge">{settings.regHoleSize.toFixed(1)} mm</span>
                      </label>
                      <div className="input-with-number">
                        <input
                          type="range"
                          min="1.5"
                          max="8.0"
                          step="0.2"
                          value={settings.regHoleSize}
                          onChange={e => setSettings(s => ({ ...s, regHoleSize: parseFloat(e.target.value) || 3.2 }))}
                        />
                        <input
                          type="number"
                          min="1.0"
                          max="15.0"
                          step="0.2"
                          value={settings.regHoleSize}
                          onChange={e => setSettings(s => ({ ...s, regHoleSize: parseFloat(e.target.value) || 3.2 }))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.embossId}
                        onChange={e => setSettings(s => ({ ...s, embossId: e.target.checked }))}
                      />
                      <span>Emboss tactile layer index markers on top border</span>
                    </label>
                  </div>

                  <div className="checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.includeSilhouette}
                        onChange={e => setSettings(s => ({ ...s, includeSilhouette: e.target.checked }))}
                      />
                      <span>Include full-sprite silhouette base stencil layer</span>
                    </label>
                  </div>
                </div>

                <div className="settings-group">
                  <div className="layers-list-header">
                    <h3>Generated Stencil Layers</h3>
                    <span className="badge">
                      {layers.length} stencil{layers.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="setting-hint">
                    Click a layer to inspect in 3D, or download individual <code>.3mf</code> / <code>.stl</code> files:
                  </p>
                  <div className="layers-list">
                    {layers.map(layer => {
                      const rgb = hexToRgbNormalized(layer.colorHex);
                      const lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
                      const textCol = lum > 0.6 ? '#0d1117' : '#ffffff';
                      const bridgeNote = layer.mesh.islandInfo.addedBridgeCells > 0
                        ? ` · +${layer.mesh.islandInfo.addedBridgeCells} bridge${layer.mesh.islandInfo.addedBridgeCells === 1 ? '' : 's'}`
                        : layer.mesh.islandInfo.remainingIslandCount > 0
                        ? ` · ⚠ ${layer.mesh.islandInfo.remainingIslandCount} island`
                        : '';

                      return (
                        <div
                          key={layer.key}
                          className={`layer-card${layer.key === resolvedActiveLayerKey ? ' active' : ''}`}
                          onClick={() => {
                            setActiveLayerKey(layer.key);
                            if (viewMode !== 'single') setViewMode('single');
                          }}
                        >
                          <div className="layer-info">
                            <div
                              className="layer-swatch"
                              style={{ background: layer.colorHex, color: textCol }}
                            >
                              {layer.colorChar}
                            </div>
                            <div className="layer-meta">
                              <span className="layer-title">{layer.title}</span>
                              <span className="layer-sub">
                                {layer.pixelCount} cutouts · {layer.mesh.triangles.length} tris{bridgeNote}
                              </span>
                            </div>
                          </div>

                          <div className="layer-actions">
                            <button
                              type="button"
                              className="layer-dl-btn"
                              title="Download this stencil layer as .3mf"
                              onClick={e => {
                                e.stopPropagation();
                                downloadSingleLayer3mf(layer);
                              }}
                            >
                              .3MF
                            </button>
                            <button
                              type="button"
                              className="layer-dl-btn stl-btn"
                              title="Download this stencil layer as binary .stl"
                              onClick={e => {
                                e.stopPropagation();
                                const stlBytes = generateBinaryStl(layer.mesh, layer.shortName);
                                triggerFileDownload(stlBytes, `${layer.shortName}.stl`, 'model/stl');
                              }}
                            >
                              .STL
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      )}

      {/* ====================================================================
          NEW PROJECT MODAL
          ==================================================================== */}
      {showNewModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={e => {
            if (e.target === e.currentTarget) setShowNewModal(false);
          }}
        >
          <div className="modal-card modal-sm">
            <div className="modal-header">
              <h2>Create New Stencil Project</h2>
              <button
                type="button"
                className="btn-icon"
                aria-label="Close"
                onClick={() => setShowNewModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateNewProject} className="modal-body form-stack">
              <div className="form-field">
                <label htmlFor="newProjectNameInput">Project Name</label>
                <input
                  type="text"
                  id="newProjectNameInput"
                  placeholder="e.g. Space Invader Cabinet Art"
                  required
                  maxLength={60}
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label htmlFor="newProjectTemplateSelect">Starting Sprite / Template</label>
                <select
                  id="newProjectTemplateSelect"
                  value={newProjTemplate}
                  onChange={e => {
                    const val = e.target.value;
                    setNewProjTemplate(val);
                    if (PRESET_SPRITES[val]) {
                      setNewProjName(`${PRESET_SPRITES[val].title} Stencil`);
                    } else if (val === 'blank16') {
                      setNewProjName('Custom 16x16 Stencil');
                    } else if (val === 'blank32') {
                      setNewProjName('Custom 32x32 Stencil');
                    }
                  }}
                >
                  {Object.entries(PRESET_SPRITES).map(([k, tpl]) => (
                    <option key={k} value={k}>{tpl.title} ({tpl.subtitle.split(' · ')[0]})</option>
                  ))}
                  <option value="blank16">Blank Canvas (16×16)</option>
                  <option value="blank32">Blank Canvas (32×32)</option>
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create &amp; Open Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          HELP MODAL
          ==================================================================== */}
      {showHelpModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={e => {
            if (e.target === e.currentTarget) setShowHelpModal(false);
          }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h2>How to Use MakeCode Arcade .3MF Stenciler</h2>
              <button
                type="button"
                className="btn-icon"
                aria-label="Close"
                onClick={() => setShowHelpModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <ol className="steps-list">
                <li>
                  <strong>Create or Select a Project:</strong>
                  From the <strong>Main Menu</strong>, create a named project or pick a starter template. All your projects auto-save in your browser and can be backed up or imported as <code>.json</code>.
                </li>
                <li>
                  <strong>Copy your sprite from MakeCode Arcade:</strong>
                  Open <a href="https://arcade.makecode.com" target="_blank" rel="noopener noreferrer">MakeCode Arcade</a>. In the Sprite Editor, select your sprite with the Marquee tool and press <kbd>Ctrl+C</kbd>, or switch to the <strong>JavaScript</strong> tab and copy any <code>img`...`</code> code block.
                </li>
                <li>
                  <strong>Paste &amp; Customize your 3D Stencil:</strong>
                  Adjust <strong>Pixel Size (mm)</strong>, <strong>Stencil Thickness (mm)</strong>, and <strong>Border Margin (mm)</strong>.
                  <ul>
                    <li><strong>Bridged Pixel Grid:</strong> Places thin 3D-printable structural ribs between pixel holes so floating islands never fall out.</li>
                    <li><strong>Merged Contiguous + Auto-Bridge:</strong> Merges neighboring pixels of the same color and automatically adds bridges only where an inner island would otherwise detach.</li>
                    <li><strong>Registration Holes &amp; Tactile Markers:</strong> Adds alignment holes in the corners and raised tactile bumps along the top edge so you can align and identify every color stencil in order when painting or airbrushing.</li>
                  </ul>
                </li>
                <li>
                  <strong>Export to <code>.3MF</code> for 3D Printing:</strong>
                  Download all color stencils together on a single <code>.3mf</code> build plate (named after your project and with embedded MakeCode Arcade filament colors) or download individual <code>.3mf</code> / <code>.stl</code> files for each color layer.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
