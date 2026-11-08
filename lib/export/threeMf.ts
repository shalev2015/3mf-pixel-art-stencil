import type { ExportItem } from '@/lib/types';
import { roundCoord } from '@/lib/utils/math';
import { createZipArchive } from '@/lib/export/zip';

export function escapeXml(str: unknown): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generate3mfArchive(items: ExportItem[], title = 'Arcade Stencil'): Uint8Array {
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

  const materialEntries = items.map((item, idx) => {
    const cleanHex = (item.colorHex || '#3b82f6').replace('#', '').toUpperCase();
    const displayColor = `#${cleanHex.padEnd(6, '0')}FF`;
    return `      <base name="${escapeXml(item.name || `Material_${idx}`)}" displaycolor="${displayColor}"/>`;
  });

  const objectBlocks: string[] = [];
  const buildBlocks: string[] = [];

  items.forEach((item, idx) => {
    const objectId = idx + 2;
    const m = item.mesh;
    const vLines = new Array(m.vertices.length);
    for (let i = 0; i < m.vertices.length; i++) {
      const [vx, vy, vz] = m.vertices[i];
      vLines[i] = `          <vertex x="${vx}" y="${vy}" z="${vz}"/>`;
    }

    const tLines = new Array(m.triangles.length);
    for (let i = 0; i < m.triangles.length; i++) {
      const [v1, v2, v3] = m.triangles[i];
      tLines[i] = `          <triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`;
    }

    objectBlocks.push(`    <object id="${objectId}" name="${escapeXml(item.name)}" type="model" pid="1" pindex="${idx}">
      <mesh>
        <vertices>
${vLines.join('\n')}
        </vertices>
        <triangles>
${tLines.join('\n')}
        </triangles>
      </mesh>
    </object>`);

    const tx = roundCoord(item.offsetX || 0);
    const ty = roundCoord(item.offsetY || 0);
    const tz = roundCoord(item.offsetZ || 0);
    buildBlocks.push(`    <item objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 ${tx} ${ty} ${tz}"/>`);
  });

  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${escapeXml(title)}</metadata>
  <metadata name="Application">Arcade 3MF Stenciler</metadata>
  <resources>
    <basematerials id="1">
${materialEntries.join('\n')}
    </basematerials>
${objectBlocks.join('\n')}
  </resources>
  <build>
${buildBlocks.join('\n')}
  </build>
</model>`;

  return createZipArchive([
    { path: '[Content_Types].xml', data: contentTypesXml },
    { path: '_rels/.rels', data: relsXml },
    { path: '3D/3dmodel.model', data: modelXml }
  ]);
}
