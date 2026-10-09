import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

interface ColorPickerModalProps {
  isOpen: boolean;
  initialColor: string;
  title?: string;
  onConfirm: (hex: string) => void;
  onClose: () => void;
}

// Convert HEX to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 255, g: 255, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to HEX
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = h / 360;
  s = s / 100;
  v = v / 100;
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  initialColor,
  title = 'Color Picker',
  onConfirm,
  onClose,
}) => {
  const [currentColor, setCurrentColor] = useState(initialColor);
  const [hsv, setHsv] = useState({ h: 0, s: 100, v: 100 });
  const [rgb, setRgb] = useState({ r: 255, g: 0, b: 0 });
  const [hexInput, setHexInput] = useState(initialColor);

  const satValBoxRef = useRef<HTMLDivElement>(null);
  const [isDraggingSatVal, setIsDraggingSatVal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentColor(initialColor);
      setHexInput(initialColor);
      const rgbVal = hexToRgb(initialColor);
      setRgb(rgbVal);
      setHsv(rgbToHsv(rgbVal.r, rgbVal.g, rgbVal.b));
    }
  }, [isOpen, initialColor]);

  if (!isOpen) return null;

  const updateFromHsv = (newH: number, newS: number, newV: number) => {
    const newRgb = hsvToRgb(newH, newS, newV);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHsv({ h: newH, s: newS, v: newV });
    setRgb(newRgb);
    setCurrentColor(newHex);
    setHexInput(newHex);
  };

  const updateFromRgb = (r: number, g: number, b: number) => {
    const newHex = rgbToHex(r, g, b);
    const newHsv = rgbToHsv(r, g, b);
    setRgb({ r, g, b });
    setHsv(newHsv);
    setCurrentColor(newHex);
    setHexInput(newHex);
  };

  const handleSatValPointer = (e: React.MouseEvent | MouseEvent) => {
    if (!satValBoxRef.current) return;
    const rect = satValBoxRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);
    updateFromHsv(hsv.h, s, v);
  };

  const swatches = [
    '#ffffff', '#000000', '#ef4444', '#f97316', '#f59e0b',
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#1e293b'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <span>{title}</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ gap: 16 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            {/* 2D Saturation / Value Spectrum Box */}
            <div
              ref={satValBoxRef}
              onMouseDown={(e) => {
                setIsDraggingSatVal(true);
                handleSatValPointer(e);
                const handleMove = (ev: MouseEvent) => handleSatValPointer(ev);
                const handleUp = () => {
                  window.removeEventListener('mousemove', handleMove);
                  window.removeEventListener('mouseup', handleUp);
                  setIsDraggingSatVal(false);
                };
                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', handleUp);
              }}
              style={{
                width: 220,
                height: 180,
                borderRadius: 4,
                position: 'relative',
                cursor: 'crosshair',
                backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                backgroundImage: `
                  linear-gradient(to right, #fff, transparent),
                  linear-gradient(to top, #000, transparent)
                `,
                border: '1px solid var(--border-prominent)',
              }}
            >
              {/* Pointer Circle */}
              <div
                style={{
                  position: 'absolute',
                  left: `${hsv.s}%`,
                  top: `${100 - hsv.v}%`,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: '2px solid #fff',
                  boxShadow: '0 0 2px #000',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              />
            </div>

            {/* Vertical Hue Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <input
                type="range"
                min={0}
                max={360}
                value={hsv.h}
                onChange={(e) => updateFromHsv(Number(e.target.value), hsv.s, hsv.v)}
                style={{
                  width: 180,
                  height: 14,
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'bottom left',
                  marginTop: 180,
                  background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
                  borderRadius: 7,
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Preview Box & Numeric Inputs */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginLeft: 16 }}>
              {/* Preview Comparison */}
              <div style={{ display: 'flex', height: 42, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-prominent)' }}>
                <div style={{ flex: 1, background: currentColor }} title="New Color" />
                <div style={{ flex: 1, background: initialColor }} title="Current Color" />
              </div>

              {/* HEX */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, width: 28, color: 'var(--text-muted)' }}>HEX:</span>
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => {
                    setHexInput(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      const rgbVal = hexToRgb(e.target.value);
                      setRgb(rgbVal);
                      setHsv(rgbToHsv(rgbVal.r, rgbVal.g, rgbVal.b));
                      setCurrentColor(e.target.value);
                    }
                  }}
                  className="studio-input"
                  style={{ flex: 1, height: 24, fontSize: 11 }}
                />
              </div>

              {/* RGB Inputs */}
              {(['r', 'g', 'b'] as const).map(ch => (
                <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, width: 28, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{ch}:</span>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb[ch]}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(255, Number(e.target.value)));
                      updateFromRgb(
                        ch === 'r' ? val : rgb.r,
                        ch === 'g' ? val : rgb.g,
                        ch === 'b' ? val : rgb.b
                      );
                    }}
                    className="studio-input"
                    style={{ flex: 1, height: 24, fontSize: 11 }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Swatches */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
            {swatches.map(sw => (
              <div
                key={sw}
                onClick={() => {
                  const rgbVal = hexToRgb(sw);
                  updateFromRgb(rgbVal.r, rgbVal.g, rgbVal.b);
                }}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 3,
                  backgroundColor: sw,
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="studio-button studio-button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="studio-button studio-button-primary"
            onClick={() => {
              onConfirm(currentColor);
              onClose();
            }}
          >
            <Check size={14} />
            <span>Apply Color</span>
          </button>
        </div>
      </div>
    </div>
  );
};
