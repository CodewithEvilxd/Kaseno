import React, { useState } from 'react';
import { X, MoreVertical, Plus } from 'lucide-react';

interface NewCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (config: {
    name: string;
    width: number;
    height: number;
    resolution: number;
    background: 'white' | 'black' | 'transparent';
  }) => void;
  onOpenProject?: () => void;
  onImportImage?: () => void;
}

const PRESET_GROUPS = [
  {
    category: 'Resolutions',
    presets: [
      { title: '4K', width: 3840, height: 2160 },
      { title: '1440p', width: 2560, height: 1440 },
      { title: '1080p', width: 1920, height: 1080 },
    ]
  },
  {
    category: 'Devices',
    presets: [
      { title: 'iPhone 18 Pro', width: 1206, height: 2622 },
      { title: 'iPhone 18 Pro Max', width: 1320, height: 2868 },
      { title: 'MacBook Pro 14"', width: 3024, height: 1964 },
      { title: 'MacBook Pro 16"', width: 3456, height: 2234 },
      { title: 'Studio Display', width: 5120, height: 2880 },
    ]
  },
  {
    category: 'Social Formats',
    presets: [
      { title: 'Instagram Square', width: 1080, height: 1080 },
      { title: 'Instagram Portrait', width: 1080, height: 1350 },
      { title: 'Instagram Story', width: 1080, height: 1920 },
      { title: 'YouTube Thumb', width: 1080, height: 608 },
    ]
  }
];

export const NewCanvasModal: React.FC<NewCanvasModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  onOpenProject,
  onImportImage,
}) => {
  const [width, setWidth] = useState('1920');
  const [height, setHeight] = useState('1080');
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);

  if (!isOpen) return null;

  const numW = parseInt(width, 10);
  const numH = parseInt(height, 10);
  const isValid = !isNaN(numW) && !isNaN(numH) && numW >= 1 && numH >= 1 && numW <= 16384 && numH <= 16384;

  const handleCreate = () => {
    if (!isValid) return;
    onCreate({
      name: 'Untitled',
      width: numW,
      height: numH,
      resolution: 72,
      background: 'transparent',
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content dot-grid-bg"
        style={{ 
          width: 480, 
          padding: '24px 26px', 
          gap: 16, 
          position: 'relative', 
          border: '1.5px solid var(--border-prominent)',
          borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Washi tape accent at top */}
        <div className="washi-tape-accent" />

        {/* Top: Chapter Breadcrumb Pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div className="chapter-pill">
            <span style={{ color: 'var(--kura-yellow)' }}>●</span>
            <span>CHAPTER 01 · CANVAS SETUP</span>
          </div>

          {/* Preset Sizes Menu Button (3 dots) */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="tool-button"
              style={{ width: 28, height: 28 }}
              onClick={() => setShowPresetsMenu(!showPresetsMenu)}
              title="Preset sizes for screens and common formats"
            >
              <MoreVertical size={16} />
            </button>

            {showPresetsMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  background: '#242424',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: 8,
                  padding: '4px 0',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                  width: 200,
                  zIndex: 100,
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                {PRESET_GROUPS.map((group, gIdx) => (
                  <React.Fragment key={group.category}>
                    {gIdx > 0 && <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />}
                    <div style={{ padding: '4px 12px', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {group.category}
                    </div>
                    {group.presets.map(p => (
                      <div
                        key={p.title}
                        onClick={() => {
                          setWidth(p.width.toString());
                          setHeight(p.height.toString());
                          setShowPresetsMenu(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 12px',
                          fontSize: 11,
                          cursor: 'pointer',
                          color: '#fff',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontWeight: 500 }}>{p.title}</span>
                        <span style={{ fontSize: 10, opacity: 0.7, fontFamily: 'var(--font-mono)' }}>{p.width}×{p.height}</span>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Heading with Yellow Marker Highlight & Handwritten Subtitle */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            <span className="text-highlight">Canvas Setup & Workspace</span>
          </h2>
          <p className="handwritten-note" style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>
            Configure pixel dimensions, choose device presets, or target local project storage.
          </p>
        </div>

        {/* Quick Presets Pill Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: '1080p', w: '1920', h: '1080' },
            { label: '4K', w: '3840', h: '2160' },
            { label: 'Instagram', w: '1080', h: '1080' },
            { label: 'iPhone', w: '1206', h: '2622' },
          ].map((preset) => {
            const isSelected = width === preset.w && height === preset.h;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setWidth(preset.w);
                  setHeight(preset.h);
                }}
                className={`pill-badge ${isSelected ? 'pill-badge-yellow' : 'pill-badge-dark'}`}
                style={{ cursor: 'pointer', padding: '3px 10px', fontSize: 10.5 }}
              >
                <span>{preset.label}</span>
                <span style={{ opacity: 0.6 }}>({preset.w}×{preset.h})</span>
              </button>
            );
          })}
        </div>

        {/* Dimension Fields (Width × Height) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Width */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Width</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '7px 12px',
              }}
            >
              <input
                type="text"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              />
              <span className="pill-badge pill-badge-dark" style={{ fontSize: 9.5, padding: '1px 5px', height: 16 }}>px</span>
            </div>
          </div>

          <div style={{ paddingTop: 22, fontSize: 16, color: 'var(--text-dim)', fontWeight: 600 }}>×</div>

          {/* Height */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Height</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '7px 12px',
              }}
            >
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              />
              <span className="pill-badge pill-badge-dark" style={{ fontSize: 9.5, padding: '1px 5px', height: 16 }}>px</span>
            </div>
          </div>
        </div>

        {/* Sticky Guide Note */}
        <div className="sticky-guide-card" style={{ padding: '10px 14px', marginTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="handwritten-note" style={{ fontSize: 13.5, color: isValid ? '#93c5fd' : '#f87171' }}>
              {isValid ? '✨ Transparent canvas · sRGB 16-bit color buffer · Ready to draw' : '⚠️ Enter whole numbers from 1 to 16,384 pixels.'}
            </span>
            <span className="pill-badge pill-badge-green" style={{ fontSize: 9.5 }}>
              sRGB
            </span>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            className="capsule-button"
            style={{ height: 30, fontSize: 11.5 }}
            onClick={() => {
              onClose();
              onOpenProject?.();
            }}
          >
            Open project
          </button>

          <button
            type="button"
            className="capsule-button"
            style={{ height: 30, fontSize: 11.5 }}
            onClick={() => {
              onClose();
              onImportImage?.();
            }}
          >
            Import image
          </button>

          <div style={{ flex: 1 }} />

          <button
            type="button"
            className="capsule-button primary"
            style={{ 
              height: 32, 
              padding: '0 18px', 
              fontSize: 12, 
              fontWeight: 700, 
              fontFamily: 'var(--font-sans)',
              background: isValid ? 'var(--kura-yellow)' : 'rgba(255,255,255,0.1)',
              color: isValid ? '#1e293b' : 'var(--text-dim)',
              borderColor: isValid ? '#ca8a04' : 'transparent',
              boxShadow: isValid ? '0 2px 8px rgba(254, 240, 138, 0.3)' : 'none'
            }}
            disabled={!isValid}
            onClick={handleCreate}
          >
            Create Canvas
          </button>
        </div>
      </div>
    </div>
  );
};
