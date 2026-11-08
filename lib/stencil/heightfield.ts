import type { Mesh, Triangle, Vec3 } from '@/lib/types';
import { roundCoord } from '@/lib/utils/math';
import { verifyManifoldMesh } from '@/lib/stencil/manifold';

export function compressRectilinearGrid(
  X: number[],
  Y: number[],
  cellZ: number[][]
): { X: number[]; Y: number[]; cellZ: number[][] } {
  const nx = X.length - 1;
  const ny = Y.length - 1;

  const keepXIndices = [0];
  const keptCols = [cellZ[0]];

  for (let ix = 1; ix < nx; ix++) {
    const prevCol = keptCols[keptCols.length - 1];
    const currCol = cellZ[ix];
    let identical = true;
    for (let iy = 0; iy < ny; iy++) {
      if (prevCol[iy] !== currCol[iy]) {
        identical = false;
        break;
      }
    }
    if (!identical) {
      keepXIndices.push(ix);
      keptCols.push(currCol);
    }
  }
  keepXIndices.push(nx);

  const newX = keepXIndices.map(i => X[i]);
  const newNx = keptCols.length;

  const keepYIndices = [0];
  for (let iy = 1; iy < ny; iy++) {
    let identical = true;
    for (let ix = 0; ix < newNx; ix++) {
      if (keptCols[ix][iy - 1] !== keptCols[ix][iy]) {
        identical = false;
        break;
      }
    }
    if (!identical) {
      keepYIndices.push(iy);
    }
  }
  keepYIndices.push(ny);

  const newY = keepYIndices.map(j => Y[j]);
  const newNy = newY.length - 1;

  const newCellZ = Array.from({ length: newNx }, (_, ix) =>
    Array.from({ length: newNy }, (__, iy) => keptCols[ix][keepYIndices[iy]])
  );

  return { X: newX, Y: newY, cellZ: newCellZ };
}

export function compileHeightfieldToManifoldMesh(
  X: number[],
  Y: number[],
  cellZ: number[][],
  zBottomValue = 0
): Mesh {
  const nx = X.length - 1;
  const ny = Y.length - 1;

  const vertices: Vec3[] = [];
  const vertexMap = new Map<string, number>();
  const triangles: Triangle[] = [];

  function getVertexIndex(ix: number, iy: number, zVal: number): number {
    const zRound = roundCoord(zVal);
    const key = `${ix}_${iy}_${zRound}`;
    let idx = vertexMap.get(key);
    if (idx === undefined) {
      idx = vertices.length;
      vertices.push([X[ix], Y[iy], zRound]);
      vertexMap.set(key, idx);
    }
    return idx;
  }

  const zLevelsSet = new Set([roundCoord(zBottomValue)]);
  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      if (cellZ[ix][iy] > zBottomValue) {
        zLevelsSet.add(roundCoord(cellZ[ix][iy]));
      }
    }
  }
  const zLevels = Array.from(zLevelsSet).sort((a, b) => a - b);

  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      const h = cellZ[ix][iy];
      if (h <= zBottomValue) continue;

      const t00 = getVertexIndex(ix, iy, h);
      const t10 = getVertexIndex(ix + 1, iy, h);
      const t11 = getVertexIndex(ix + 1, iy + 1, h);
      const t01 = getVertexIndex(ix, iy + 1, h);
      triangles.push([t00, t10, t11]);
      triangles.push([t00, t11, t01]);

      const b00 = getVertexIndex(ix, iy, zBottomValue);
      const b10 = getVertexIndex(ix + 1, iy, zBottomValue);
      const b11 = getVertexIndex(ix + 1, iy + 1, zBottomValue);
      const b01 = getVertexIndex(ix, iy + 1, zBottomValue);
      triangles.push([b00, b11, b10]);
      triangles.push([b00, b01, b11]);
    }
  }

  function emitWallX(ix: number, iy: number, zLow: number, zHigh: number, normalPositiveX: boolean) {
    for (let k = 0; k < zLevels.length - 1; k++) {
      const z0 = zLevels[k];
      const z1 = zLevels[k + 1];
      if (z0 >= roundCoord(zLow) - 1e-5 && z1 <= roundCoord(zHigh) + 1e-5) {
        const p00 = getVertexIndex(ix, iy, z0);
        const p10 = getVertexIndex(ix, iy + 1, z0);
        const p11 = getVertexIndex(ix, iy + 1, z1);
        const p01 = getVertexIndex(ix, iy, z1);
        if (normalPositiveX) {
          triangles.push([p00, p10, p11]);
          triangles.push([p00, p11, p01]);
        } else {
          triangles.push([p00, p11, p10]);
          triangles.push([p00, p01, p11]);
        }
      }
    }
  }

  function emitWallY(ix: number, iy: number, zLow: number, zHigh: number, normalPositiveY: boolean) {
    for (let k = 0; k < zLevels.length - 1; k++) {
      const z0 = zLevels[k];
      const z1 = zLevels[k + 1];
      if (z0 >= roundCoord(zLow) - 1e-5 && z1 <= roundCoord(zHigh) + 1e-5) {
        const q00 = getVertexIndex(ix, iy, z0);
        const q10 = getVertexIndex(ix + 1, iy, z0);
        const q11 = getVertexIndex(ix + 1, iy, z1);
        const q01 = getVertexIndex(ix, iy, z1);
        if (normalPositiveY) {
          triangles.push([q00, q11, q10]);
          triangles.push([q00, q01, q11]);
        } else {
          triangles.push([q00, q10, q11]);
          triangles.push([q00, q11, q01]);
        }
      }
    }
  }

  for (let ix = 0; ix <= nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      const hLeft = ix > 0 ? cellZ[ix - 1][iy] : zBottomValue;
      const hRight = ix < nx ? cellZ[ix][iy] : zBottomValue;
      if (hLeft > hRight) {
        emitWallX(ix, iy, hRight, hLeft, true);
      } else if (hRight > hLeft) {
        emitWallX(ix, iy, hLeft, hRight, false);
      }
    }
  }

  for (let iy = 0; iy <= ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const hBot = iy > 0 ? cellZ[ix][iy - 1] : zBottomValue;
      const hTop = iy < ny ? cellZ[ix][iy] : zBottomValue;
      if (hBot > hTop) {
        emitWallY(ix, iy, hTop, hBot, true);
      } else if (hTop > hBot) {
        emitWallY(ix, iy, hBot, hTop, false);
      }
    }
  }

  const manifoldCheck = verifyManifoldMesh(vertices, triangles);

  return {
    vertices,
    triangles,
    isManifold: manifoldCheck.isManifold,
    openEdges: manifoldCheck.openEdges,
    volumeMm3: manifoldCheck.volumeMm3
  };
}
