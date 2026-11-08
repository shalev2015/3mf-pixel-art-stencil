import type { Triangle, Vec3 } from '@/lib/types';

export interface ManifoldCheck {
  isManifold: boolean;
  openEdges: number;
  volumeMm3: number;
}

export function verifyManifoldMesh(vertices: Vec3[], triangles: Triangle[]): ManifoldCheck {
  const halfEdges = new Set<string>();
  let duplicateHalfEdges = 0;
  let signedVol6 = 0;

  for (let i = 0; i < triangles.length; i++) {
    const [a, b, c] = triangles[i];
    const edges = [[a, b], [b, c], [c, a]];
    for (const [u, v] of edges) {
      const key = `${u}_${v}`;
      if (halfEdges.has(key)) duplicateHalfEdges++;
      halfEdges.add(key);
    }

    const va = vertices[a];
    const vb = vertices[b];
    const vc = vertices[c];
    signedVol6 +=
      va[0] * (vb[1] * vc[2] - vb[2] * vc[1]) -
      va[1] * (vb[0] * vc[2] - vb[2] * vc[0]) +
      va[2] * (vb[0] * vc[1] - vb[1] * vc[0]);
  }

  let unmatchedHalfEdges = 0;
  for (const key of halfEdges) {
    const sep = key.indexOf('_');
    const u = key.slice(0, sep);
    const v = key.slice(sep + 1);
    if (!halfEdges.has(`${v}_${u}`)) unmatchedHalfEdges++;
  }

  return {
    isManifold: duplicateHalfEdges === 0 && unmatchedHalfEdges === 0 && signedVol6 > 0,
    openEdges: unmatchedHalfEdges,
    volumeMm3: signedVol6 / 6.0
  };
}
