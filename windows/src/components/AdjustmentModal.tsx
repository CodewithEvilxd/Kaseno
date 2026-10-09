import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Sliders, RefreshCw } from 'lucide-react';
import { AdjustmentType, LayerAdjustment } from '../types/kaseno';
import { LUT_PRESETS } from '../engine/LutEngine';

interface AdjustmentModalProps {
  isOpen: boolean;
  kind: AdjustmentType;
  initialValues?: LayerAdjustment | null;
  sourceCanvas?: HTMLCanvasElement | null;
  onConfirm: (adjustment: LayerAdjustment) => void;
  onLivePreview?: (adjustment: LayerAdjustment) => void;
  onClose: () => void;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  isOpen,
  kind,
  initialValues,
  sourceCanvas,
  onConfirm,
  onLivePreview,
  onClose,
}) => {
  const [adjustment, setAdjustment] = useState<LayerAdjustment>(() => {
    return initialValues || getDefaultAdjustment(kind);
  });

  const histogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const curvesCanvasRef = useRef<HTMLCanvasElement>(null);

  function getDefaultAdjustment(type: AdjustmentType): LayerAdjustment {
    switch (type) {
      case 'brightness-contrast':
        return { kind: type, brightness: 0, contrast: 0 };
      case 'levels':
        return { kind: type, levels: { inBlack: 0, inMid: 1.0, inWhite: 255, outBlack: 0, outWhite: 255 } };
      case 'curves':
        return { kind: type, curves: { rgb: [{ x: 0, y: 0 }, { x: 255, y: 255 }] } };
      case 'hue-saturation':
        return { kind: type, hue: 0, saturation: 0, lightness: 0, colorize: false };
      case 'color-balance':
        return {
          kind: type,
          colorBalance: {
            shadows: [0, 0, 0],
            midtones: [0, 0, 0],
            highlights: [0, 0, 0],
          },
        };
      case 'exposure':
        return { kind: type, exposure: 0, gamma: 1.0 };
      case 'gaussian-blur':
        return { kind: type, blurRadius: 5 };
      case 'noise':
        return { kind: type, noiseAmount: 15 };
      case 'lut':
        return { kind: type, lut: { preset: 'portra-400', intensity: 100 } };
      case 'invert':
      case 'black-white':
      default:
        return { kind: type };
    }
  }

  useEffect(() => {
    if (isOpen) {
      const val = initialValues || getDefaultAdjustment(kind);
      setAdjustment(val);
      if (onLivePreview) onLivePreview(val);
    }
  }, [isOpen, kind, initialValues]);

  const updateAdj = (updater: (prev: LayerAdjustment) => LayerAdjustment) => {
    setAdjustment(prev => {
      const next = updater(prev);
      if (onLivePreview) onLivePreview(next);
      return next;
    });
  };

  // Render Histogram for Levels
  useEffect(() => {
    if (kind === 'levels' && histogramCanvasRef.current && sourceCanvas) {
      const canvas = histogramCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Compute 256-bin histogram
      const sctx = sourceCanvas.getContext('2d');
      if (sctx) {
        const imgData = sctx.getImageData(0, 0, Math.min(400, sourceCanvas.width), Math.min(400, sourceCanvas.height));
        const data = imgData.data;
        const bins = new Uint32Array(256);
        let maxVal = 0;

        for (let i = 0; i < data.length; i += 4) {
          const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          bins[lum]++;
          if (bins[lum] > maxVal) maxVal = bins[lum];
        }

        // Draw histogram bars
        ctx.fillStyle = '#383844';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#06b6d4';
        const binW = w / 256;
        for (let i = 0; i < 256; i++) {
          const barH = maxVal > 0 ? (bins[i] / maxVal) * (h - 4) : 0;
          ctx.fillRect(i * binW, h - barH, Math.max(1, binW), barH);
        }
      }
    }
  }, [kind, isOpen, sourceCanvas]);

  // Render Curves grid & curve
  useEffect(() => {
    if (kind === 'curves' && curvesCanvasRef.current) {
      const canvas = curvesCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Grid background
      ctx.fillStyle = '#18181d';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#272730';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo((w / 4) * i, 0);
        ctx.lineTo((w / 4) * i, h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, (h / 4) * i);
        ctx.lineTo(w, (h / 4) * i);
        ctx.stroke();
      }

      // Diagonal guide
      ctx.strokeStyle = '#383844';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(w, 0);
      ctx.stroke();

      // Points & line
      const points = adjustment.curves?.rgb || [{ x: 0, y: 0 }, { x: 255, y: 255 }];
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();

      points.forEach((pt, idx) => {
        const px = (pt.x / 255) * w;
        const py = h - (pt.y / 255) * h;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Control points
      ctx.fillStyle = '#ffffff';
      points.forEach(pt => {
        const px = (pt.x / 255) * w;
        const py = h - (pt.y / 255) * h;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }
  }, [kind, isOpen, adjustment]);

  if (!isOpen) return null;

  const titles: Record<AdjustmentType, string> = {
    'brightness-contrast': 'Brightness / Contrast',
    'levels': 'Levels',
    'curves': 'Curves',
    'exposure': 'Exposure & Gamma',
    'hue-saturation': 'Hue / Saturation',
    'color-balance': 'Color Balance',
    'black-white': 'Black & White',
    'invert': 'Invert Colors',
    'gaussian-blur': 'Gaussian Blur',
    'noise': 'Add Noise',
    'lut': '3D LUT & Film Simulation',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <span>{titles[kind] || 'Adjustment'}</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ gap: 14 }}>
          {/* Brightness / Contrast */}
          {kind === 'brightness-contrast' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Brightness:</span>
                  <span>{adjustment.brightness ?? 0}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustment.brightness ?? 0}
                  onChange={(e) => updateAdj(p => ({ ...p, brightness: Number(e.target.value) }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Contrast:</span>
                  <span>{adjustment.contrast ?? 0}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustment.contrast ?? 0}
                  onChange={(e) => updateAdj(p => ({ ...p, contrast: Number(e.target.value) }))}
                />
              </div>
            </>
          )}

          {/* Levels */}
          {kind === 'levels' && (
            <>
              <canvas
                ref={histogramCanvasRef}
                width={380}
                height={100}
                style={{ width: '100%', height: 100, borderRadius: 4, background: '#18181d' }}
              />

              {/* Input Levels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Input Levels:</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={adjustment.levels?.inBlack ?? 0}
                    onChange={(e) => updateAdj(p => ({
                      ...p,
                      levels: { ...(p.levels || { inBlack: 0, inMid: 1.0, inWhite: 255, outBlack: 0, outWhite: 255 }), inBlack: Number(e.target.value) }
                    }))}
                    className="studio-input"
                  />
                  <input
                    type="number"
                    step={0.05}
                    min={0.1}
                    max={9.9}
                    value={adjustment.levels?.inMid ?? 1.0}
                    onChange={(e) => updateAdj(p => ({
                      ...p,
                      levels: { ...(p.levels || { inBlack: 0, inMid: 1.0, inWhite: 255, outBlack: 0, outWhite: 255 }), inMid: Number(e.target.value) }
                    }))}
                    className="studio-input"
                  />
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={adjustment.levels?.inWhite ?? 255}
                    onChange={(e) => updateAdj(p => ({
                      ...p,
                      levels: { ...(p.levels || { inBlack: 0, inMid: 1.0, inWhite: 255, outBlack: 0, outWhite: 255 }), inWhite: Number(e.target.value) }
                    }))}
                    className="studio-input"
                  />
                </div>
              </div>

              {/* Output Levels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Output Levels:</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={adjustment.levels?.outBlack ?? 0}
                    onChange={(e) => updateAdj(p => ({
                      ...p,
                      levels: { ...(p.levels || { inBlack: 0, inMid: 1.0, inWhite: 255, outBlack: 0, outWhite: 255 }), outBlack: Number(e.target.value) }
                    }))}
                    className="studio-input"
                  />
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={adjustment.levels?.outWhite ?? 255}
                    onChange={(e) => updateAdj(p => ({
                      ...p,
                      levels: { ...(p.levels || { inBlack: 0, inMid: 1.0, inWhite: 255, outBlack: 0, outWhite: 255 }), outWhite: Number(e.target.value) }
                    }))}
                    className="studio-input"
                  />
                </div>
              </div>
            </>
          )}

          {/* Curves */}
          {kind === 'curves' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <canvas
                  ref={curvesCanvasRef}
                  width={256}
                  height={256}
                  style={{ width: 256, height: 256, borderRadius: 4, border: '1px solid var(--border-subtle)', cursor: 'crosshair' }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.round(((e.clientX - rect.left) / rect.width) * 255);
                    const y = Math.round((1 - (e.clientY - rect.top) / rect.height) * 255);
                    updateAdj(p => {
                      const cur = [...(p.curves?.rgb || [{ x: 0, y: 0 }, { x: 255, y: 255 }])];
                      cur.push({ x, y });
                      cur.sort((a, b) => a.x - b.x);
                      return { ...p, curves: { rgb: cur } };
                    });
                  }}
                />
              </div>
              <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-dim)' }}>
                Click anywhere on the grid to add a control point
              </div>
            </>
          )}

          {/* Hue / Saturation */}
          {kind === 'hue-saturation' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Hue:</span>
                  <span>{adjustment.hue ?? 0}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={adjustment.hue ?? 0}
                  onChange={(e) => updateAdj(p => ({ ...p, hue: Number(e.target.value) }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Saturation:</span>
                  <span>{adjustment.saturation ?? 0}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustment.saturation ?? 0}
                  onChange={(e) => updateAdj(p => ({ ...p, saturation: Number(e.target.value) }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Lightness:</span>
                  <span>{adjustment.lightness ?? 0}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustment.lightness ?? 0}
                  onChange={(e) => updateAdj(p => ({ ...p, lightness: Number(e.target.value) }))}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={adjustment.colorize ?? false}
                  onChange={(e) => updateAdj(p => ({ ...p, colorize: e.target.checked }))}
                />
                <span>Colorize</span>
              </label>
            </>
          )}

          {/* Color Balance */}
          {kind === 'color-balance' && (
            <>
              {['shadows', 'midtones', 'highlights'].map((toneKey) => {
                const tone = toneKey as 'shadows' | 'midtones' | 'highlights';
                const cur = adjustment.colorBalance?.[tone] || [0, 0, 0];
                return (
                  <div key={tone} style={{ display: 'flex', flexDirection: 'column', gap: 6, borderBottom: '1px solid #222', paddingBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>{tone}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
                      <span style={{ width: 40, color: '#38bdf8' }}>Cyan</span>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        value={cur[0]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateAdj(p => ({
                            ...p,
                            colorBalance: {
                              ...(p.colorBalance || { shadows: [0, 0, 0], midtones: [0, 0, 0], highlights: [0, 0, 0] }),
                              [tone]: [val, cur[1], cur[2]]
                            }
                          }));
                        }}
                        style={{ flex: 1 }}
                      />
                      <span style={{ width: 40, textAlign: 'right', color: '#f87171' }}>Red</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
                      <span style={{ width: 40, color: '#ec4899' }}>Magenta</span>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        value={cur[1]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateAdj(p => ({
                            ...p,
                            colorBalance: {
                              ...(p.colorBalance || { shadows: [0, 0, 0], midtones: [0, 0, 0], highlights: [0, 0, 0] }),
                              [tone]: [cur[0], val, cur[2]]
                            }
                          }));
                        }}
                        style={{ flex: 1 }}
                      />
                      <span style={{ width: 40, textAlign: 'right', color: '#4ade80' }}>Green</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
                      <span style={{ width: 40, color: '#facc15' }}>Yellow</span>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        value={cur[2]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateAdj(p => ({
                            ...p,
                            colorBalance: {
                              ...(p.colorBalance || { shadows: [0, 0, 0], midtones: [0, 0, 0], highlights: [0, 0, 0] }),
                              [tone]: [cur[0], cur[1], val]
                            }
                          }));
                        }}
                        style={{ flex: 1 }}
                      />
                      <span style={{ width: 40, textAlign: 'right', color: '#60a5fa' }}>Blue</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Exposure */}
          {kind === 'exposure' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Exposure:</span>
                  <span>{adjustment.exposure ?? 0}</span>
                </div>
                <input
                  type="range"
                  min={-5}
                  max={5}
                  step={0.1}
                  value={adjustment.exposure ?? 0}
                  onChange={(e) => updateAdj(p => ({ ...p, exposure: Number(e.target.value) }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Gamma Correction:</span>
                  <span>{adjustment.gamma ?? 1.0}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={3.0}
                  step={0.05}
                  value={adjustment.gamma ?? 1.0}
                  onChange={(e) => updateAdj(p => ({ ...p, gamma: Number(e.target.value) }))}
                />
              </div>
            </>
          )}

          {/* Gaussian Blur */}
          {kind === 'gaussian-blur' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text-muted)' }}>Radius:</span>
                <span>{adjustment.blurRadius ?? 5} px</span>
              </div>
              <input
                type="range"
                min={1}
                max={60}
                value={adjustment.blurRadius ?? 5}
                onChange={(e) => updateAdj(p => ({ ...p, blurRadius: Number(e.target.value) }))}
              />
            </div>
          )}

          {/* Noise */}
          {kind === 'noise' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                <span>{adjustment.noiseAmount ?? 15}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={adjustment.noiseAmount ?? 15}
                onChange={(e) => updateAdj(p => ({ ...p, noiseAmount: Number(e.target.value) }))}
              />
            </div>
          )}

          {/* 3D LUT Color Grading & Film Simulation */}
          {kind === 'lut' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Select a cinema film simulation or import a custom .cube 3D LUT:
              </div>

              {/* Preset Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {LUT_PRESETS.map((preset) => {
                  const isSelected = (adjustment.lut?.preset ?? 'portra-400') === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => updateAdj(p => ({
                        ...p,
                        lut: {
                          preset: preset.id,
                          intensity: p.lut?.intensity ?? 100,
                          cubeData: preset.id === 'custom' ? p.lut?.cubeData : undefined,
                        }
                      }))}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: isSelected ? '1.5px solid var(--kura-yellow)' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(254, 240, 138, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: preset.previewColor }} />
                        <span style={{ fontWeight: 700, fontSize: 11.5, color: isSelected ? '#ffffff' : 'var(--text-main)' }}>
                          {preset.name}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.25 }}>
                        {preset.description}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Intensity Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>LUT Intensity:</span>
                  <span style={{ fontWeight: 600 }}>{adjustment.lut?.intensity ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={adjustment.lut?.intensity ?? 100}
                  onChange={(e) => updateAdj(p => ({
                    ...p,
                    lut: {
                      preset: p.lut?.preset ?? 'portra-400',
                      intensity: Number(e.target.value),
                      cubeData: p.lut?.cubeData,
                    }
                  }))}
                />
              </div>

              {/* Custom .cube File Loader */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: 6, border: '1px dashed var(--border-prominent)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {adjustment.lut?.preset === 'custom' ? 'Custom .cube LUT loaded' : 'Import custom .cube file:'}
                </span>
                <label className="capsule-button" style={{ cursor: 'pointer', padding: '2px 9px', fontSize: 11 }}>
                  Browse .cube
                  <input
                    type="file"
                    accept=".cube"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const text = reader.result as string;
                          updateAdj(p => ({
                            ...p,
                            lut: { preset: 'custom', intensity: p.lut?.intensity ?? 100, cubeData: text }
                          }));
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {(kind === 'invert' || kind === 'black-white') && (
            <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-main)' }}>
              Click Apply to toggle {kind === 'invert' ? 'Invert Colors' : 'Black & White'}.
            </div>
          )}
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
              onConfirm(adjustment);
              onClose();
            }}
          >
            <Check size={14} />
            <span>Apply Adjustment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
