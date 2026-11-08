'use client';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** How-to-use modal explaining the pixel art to .3MF stencil workflow. */
export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <h2>How to Use Arcade .3MF Stenciler</h2>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <ol className="steps-list">
            <li>
              <strong>Create or Select a Project:</strong> From the{' '}
              <strong>Main Menu</strong>, create a named project or pick a starter template.
              All your projects auto-save in your browser and can be backed up or imported as{' '}
              <code>.json</code>.
            </li>
            <li>
              <strong>Copy your sprite:</strong> In the Sprite Editor, select your sprite
              with the Marquee tool and press <kbd>Ctrl+C</kbd>, or switch to the{' '}
              <strong>JavaScript</strong> tab and copy any <code>img`...`</code> code block.
            </li>
            <li>
              <strong>Paste &amp; Customize your 3D Stencil:</strong> Adjust{' '}
              <strong>Pixel Size (mm)</strong>, <strong>Stencil Thickness (mm)</strong>, and{' '}
              <strong>Border Margin (mm)</strong>.
              <ul>
                <li>
                  <strong>Bridged Pixel Grid:</strong> Places thin 3D-printable structural
                  ribs between pixel holes so floating islands never fall out.
                </li>
                <li>
                  <strong>Merged Contiguous + Auto-Bridge:</strong> Merges neighboring pixels
                  of the same color and automatically adds bridges only where an inner island
                  would otherwise detach.
                </li>
                <li>
                  <strong>Registration Holes &amp; Tactile Markers:</strong> Adds alignment
                  holes in the corners and raised tactile bumps along the top edge so you can
                  align and identify every color stencil in order when painting or
                  airbrushing.
                </li>
              </ul>
            </li>
            <li>
              <strong>
                Export to <code>.3MF</code> for 3D Printing:
              </strong>{' '}
              Download all color stencils together on a single <code>.3mf</code> build plate
              (named after your project and with embedded Arcade filament colors) or download
              individual <code>.3mf</code> / <code>.stl</code> files for each color layer.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
