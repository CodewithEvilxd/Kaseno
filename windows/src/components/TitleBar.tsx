import React, { useState } from 'react';
import { Plus, X, ZoomIn, ZoomOut, Check, ChevronDown } from 'lucide-react';
import { KasenoDocument } from '../types/kaseno';

interface TitleBarProps {
  documents: KasenoDocument[];
  activeDocIndex: number;
  onSelectDoc: (index: number) => void;
  onCloseDoc: (index: number) => void;
  onNewCanvas: () => void;
  onOpenFile: () => void;
  onSaveProject: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitCanvas: () => void;
  onActualPixels: () => void;
  onOpenAdjustment: (kind: string) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  documents,
  activeDocIndex,
  onSelectDoc,
  onCloseDoc,
  onNewCanvas,
  onOpenFile,
  onSaveProject,
  onExport,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitCanvas,
  onActualPixels,
  onOpenAdjustment,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuItems = [
    {
      label: 'File',
      items: [
        { label: 'New Canvas…', shortcut: 'Ctrl+N', action: onNewCanvas },
        { label: 'Open…', shortcut: 'Ctrl+O', action: onOpenFile },
        { type: 'separator' },
        { label: 'Save Project', shortcut: 'Ctrl+S', action: onSaveProject },
        { label: 'Export Flattened Image…', shortcut: 'Ctrl+Shift+E', action: onExport },
      ]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: onUndo },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: onRedo },
        { type: 'separator' },
        { label: 'Cut', shortcut: 'Ctrl+X', action: () => document.execCommand('cut') },
        { label: 'Copy', shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
        { label: 'Paste', shortcut: 'Ctrl+V', action: () => document.execCommand('paste') },
      ]
    },
    {
      label: 'Image',
      items: [
        { label: 'Brightness / Contrast…', action: () => onOpenAdjustment('brightness-contrast') },
        { label: 'Levels…', action: () => onOpenAdjustment('levels') },
        { label: 'Curves…', action: () => onOpenAdjustment('curves') },
        { label: 'Exposure & Gamma…', action: () => onOpenAdjustment('exposure') },
        { label: 'Hue / Saturation…', action: () => onOpenAdjustment('hue-saturation') },
        { label: 'Color Balance…', action: () => onOpenAdjustment('color-balance') },
        { label: 'Black & White', action: () => onOpenAdjustment('black-white') },
        { label: 'Invert', action: () => onOpenAdjustment('invert') },
      ]
    },
    {
      label: 'Filter',
      items: [
        { label: 'Gaussian Blur…', action: () => onOpenAdjustment('gaussian-blur') },
        { label: 'Add Noise…', action: () => onOpenAdjustment('noise') },
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Fit in Window', shortcut: 'Ctrl+0', action: onFitCanvas },
        { label: 'Actual Pixels (100%)', shortcut: 'Ctrl+1', action: onActualPixels },
        { label: 'Zoom In', shortcut: 'Ctrl++', action: () => onZoomChange(zoom * 1.25) },
        { label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => onZoomChange(zoom / 1.25) },
      ]
    }
  ];

  return (
    <div className="studio-titlebar">
      {/* Left: App Logo, Menus & New Canvas (+) Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* App Title / Brand with Mascot Logo & GitKura Bricolage Grotesque typography */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 6 }}>
          <img 
            src="/app-icon.png" 
            alt="Kaseno Mascot" 
            style={{ 
              width: 24, 
              height: 24, 
              borderRadius: 6, 
              objectFit: 'cover',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              border: '1.5px solid rgba(254, 240, 138, 0.5)',
              display: 'block',
              flexShrink: 0
            }} 
          />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Kaseno
          </span>
          {/* GitKura-style Kanji / Studio pill badge */}
          <span className="pill-badge pill-badge-yellow" style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, height: 16 }}>
            創
          </span>
        </div>

        {/* Traditional Native Menus with Plus Jakarta Sans */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {menuItems.map((m) => (
            <div key={m.label} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setActiveMenu(activeMenu === m.label ? null : m.label)}
                style={{
                  background: activeMenu === m.label ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                  border: 'none',
                  color: activeMenu === m.label ? '#ffffff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '4px 9px',
                  borderRadius: 5,
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (activeMenu) setActiveMenu(m.label);
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  if (activeMenu !== m.label) {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {m.label}
              </button>

              {activeMenu === m.label && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 4,
                    background: '#242424',
                    border: '1.5px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 8,
                    padding: '5px 0',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.7)',
                    minWidth: 200,
                    zIndex: 100,
                  }}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  {m.items.map((item, idx) => {
                    if ((item as any).type === 'separator') {
                      return <div key={idx} style={{ height: 1, background: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />;
                    }
                    const menuItem = item as { label?: string; shortcut?: string; action?: () => void };
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setActiveMenu(null);
                          menuItem.action?.();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 14px',
                          fontSize: 11.5,
                          fontFamily: 'var(--font-sans)',
                          fontWeight: 500,
                          cursor: 'pointer',
                          color: '#f8fafc',
                          transition: 'background 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span>{menuItem.label}</span>
                        {menuItem.shortcut && (
                          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.65, fontWeight: 500 }}>
                            {menuItem.shortcut}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* New Canvas (+) Button matching ToolbarItem(placement: .navigation) in Kaseno macOS */}
        <button
          type="button"
          onClick={onNewCanvas}
          className="capsule-button"
          title="New canvas (Ctrl+N)"
          style={{ height: 26, padding: '0 8px' }}
        >
          <Plus size={14} />
          <span style={{ fontSize: 11 }}>New</span>
        </button>
      </div>

      {/* Center: ProjectTabStrip with GitKura yellow highlighter marker effect */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: '100%', overflowX: 'auto' }}>
          {documents.map((doc, idx) => {
            const isActive = idx === activeDocIndex;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(idx)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  padding: '3px 6px',
                  background: 'transparent',
                  userSelect: 'none',
                }}
              >
                {/* Text with highlighter directly in its background (NO box!) */}
                <span className={isActive ? 'text-highlight' : 'text-inactive'}>
                  {doc.name}
                </span>

                {documents.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseDoc(idx);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      padding: 1,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: 0.6,
                      transition: 'all 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                    title="Close project"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>


      {/* Right: Zoom controls matching Kaseno macOS toolbar + GitKura user pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          onClick={onFitCanvas}
          className="capsule-button"
          title="Fit canvas in window (Ctrl+0)"
          style={{ height: 26, fontSize: 11.5, fontFamily: 'var(--font-sans)', fontWeight: 600 }}
        >
          Fit
        </button>

        <button
          type="button"
          onClick={onActualPixels}
          className="capsule-button"
          title="Actual pixels (Ctrl+1)"
          style={{ height: 26, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600 }}
        >
          100%
        </button>

        <div className="segmented-control" style={{ height: 26 }}>
          <button
            type="button"
            className="segmented-button"
            onClick={() => onZoomChange(Math.min(10, zoom * 1.25))}
            title="Zoom in (Ctrl++)"
            style={{ padding: '2px 7px', height: 22 }}
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            className="segmented-button"
            onClick={() => onZoomChange(Math.max(0.1, zoom / 1.25))}
            title="Zoom out (Ctrl+-)"
            style={{ padding: '2px 7px', height: 22 }}
          >
            <ZoomOut size={13} />
          </button>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 3px' }} />

        {/* Top-Right Creator Highlighter Tag (Matching GitKura Highlighter Style) */}
        <div 
          className="text-highlight" 
          style={{ 
            fontSize: 11.5, 
            padding: '3px 10px', 
            borderRadius: 4,
            cursor: 'default',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
          }}
          title="Kaseno Creator & Artist"
        >
          Nishant Gaurav
        </div>
      </div>
    </div>
  );
};
