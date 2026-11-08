import type { Mesh } from '@/lib/types';

export function generateBinaryStl(mesh: Mesh, headerTitle = 'Arcade Stencil'): Uint8Array {
  const triCount = mesh.triangles.length;
  const buf = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buf);
  const headerBytes = new TextEncoder().encode(headerTitle.slice(0, 79));
  new Uint8Array(buf, 0, headerBytes.length).set(headerBytes);
  view.setUint32(80, triCount, true);

  let offset = 84;
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

    view.setFloat32(offset, nx, true);
    view.setFloat32(offset + 4, ny, true);
    view.setFloat32(offset + 8, nz, true);

    view.setFloat32(offset + 12, v0[0], true);
    view.setFloat32(offset + 16, v0[1], true);
    view.setFloat32(offset + 20, v0[2], true);

    view.setFloat32(offset + 24, v1[0], true);
    view.setFloat32(offset + 28, v1[1], true);
    view.setFloat32(offset + 32, v1[2], true);

    view.setFloat32(offset + 36, v2[0], true);
    view.setFloat32(offset + 40, v2[1], true);
    view.setFloat32(offset + 44, v2[2], true);

    view.setUint16(offset + 48, 0, true);
    offset += 50;
  }

  return new Uint8Array(buf);
}
