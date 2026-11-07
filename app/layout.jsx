import './globals.css';

export const metadata = {
  title: 'MakeCode Arcade 3MF Stenciler — 3D Printable Pixel Art Stencils',
  description: 'Client-side Next.js web app that converts MakeCode Arcade img`...` JS pixel art into 3D-printable multi-layer .3mf stencils.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
