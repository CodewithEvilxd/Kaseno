import React, { useState, useEffect } from 'react';
import { X, Download, FileImage, Check } from 'lucide-react';
import { KasenoDocument } from '../types/kaseno';
import { Renderer } from '../engine/Renderer';
import { ProjectIO } from '../engine/ProjectIO';

interface ExportModalProps {
  isOpen: boolean;
  doc: KasenoDocument;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  doc,
  onClose,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState<number>(90);
  const [scale, setScale] = useState<number>(1);
  const [filename, setFilename] = useState<string>(doc.name.replace(/\.[^/.]+$/, ''));
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setFilename(doc.name.replace(/\.[^/.]+$/, ''));
      // Render composite preview
      const comp = Renderer.compositeDocument(doc);
      setPreviewUrl(comp.toDataURL('image/jpeg', 0.8));
    }
  }, [isOpen, doc]);

  if (!isOpen) return null;

  const targetWidth = Math.round(doc.width * scale);
  const targetHeight = Math.round(doc.height * scale);

  const handleExport = () => {
    // Generate high-res composite
    const fullCanvas = Renderer.compositeDocument(doc);
    let outCanvas = fullCanvas;

    if (scale !== 1) {
      outCanvas = document.createElement('canvas');
      outCanvas.width = targetWidth;
      outCanvas.height = targetHeight;
      const ctx = outCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(fullCanvas, 0, 0, targetWidth, targetHeight);
      }
    }

    ProjectIO.exportFlattenedImage(outCanvas, `${filename}.${format}`, format, quality / 100);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileImage size={16} />
            <span>Export Image</span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ gap: 14 }}>
          {/* Preview & Info */}
          <div style={{ display: 'flex', gap: 14 }}>
            <div
              style={{
                width: 130,
                height: 100,
                borderRadius: 4,
                overflow: 'hidden',
                background: '#111',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {previewUrl && (
                <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>File Name:</label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="studio-input"
                  style={{ height: 26 }}
                />
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Target Size: <strong style={{ color: 'var(--text-main)' }}>{targetWidth} × {targetHeight} px</strong>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Format:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { id: 'png', label: 'PNG (Lossless / Alpha)' },
                { id: 'jpeg', label: 'JPEG (Photo)' },
                { id: 'webp', label: 'WebP (Modern Web)' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id as any)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 4,
                    border: format === f.id ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                    background: format === f.id ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
                    color: format === f.id ? 'var(--accent)' : 'var(--text-main)',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality slider (for JPEG / WebP) */}
          {(format === 'jpeg' || format === 'webp') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text-muted)' }}>Quality:</span>
                <span>{quality}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
            </div>
          )}

          {/* Scaling */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Scale:</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { scale: 0.5, label: '0.5x' },
                { scale: 1, label: '1x (Original)' },
                { scale: 2, label: '2x (Retina)' },
                { scale: 3, label: '3x (Print)' },
              ].map(s => (
                <button
                  key={s.scale}
                  type="button"
                  onClick={() => setScale(s.scale)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: scale === s.scale ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                    background: scale === s.scale ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
                    color: scale === s.scale ? 'var(--accent)' : 'var(--text-main)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="studio-button studio-button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="studio-button studio-button-primary" onClick={handleExport}>
            <Download size={14} />
            <span>Export {format.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
