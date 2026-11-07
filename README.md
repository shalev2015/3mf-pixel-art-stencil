# MakeCode Arcade `.3MF` Stenciler (Client-Side Next.js App)

A 100% client-side **Next.js** web application (`output: 'export'`) inspired by [`riknoll/arcade-stenciler`](https://arcade.makecode.com/arts-and-crafts/stencils) that converts **Microsoft MakeCode Arcade** `img`...`` JavaScript/TypeScript pixel art sprites into **3D-printable `.3mf` stencils** (instead of 2D laser-cutter DXF files).

## Project Structure

- `app/layout.jsx` & `app/page.jsx` — Next.js App Router entry point (`'use client'`)
- `app/globals.css` — Styling for the Main Menu dashboard and 3D Stencil Studio
- `components/StencilApp.jsx` — Interactive client-side React UI (Main Menu, Named Projects manager, 2D pixel painter, WebGL 3D `.3MF` viewport, and layer controls)
- `lib/stencilEngine.js` — Pure client-side MakeCode `img` / `hex` parser, floating-island auto-bridge solver, watertight 2-manifold rectilinear mesh compiler, CRC32 ZIP `.3mf` generator, and binary `.stl` exporter
- `next.config.mjs` — Configured with `output: 'export'` for static client-side-only builds

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

To generate a static client-side export in `out/`:

```bash
npm run build
```
