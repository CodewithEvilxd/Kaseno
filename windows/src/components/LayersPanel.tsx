import React, { useState } from 'react';
import { 
  Eye, EyeOff, Lock, Unlock, PlusSquare, FolderPlus, 
  Sparkles, Sliders, Trash2, CornerDownRight, Layers,
  ChevronDown, Link as LinkIcon
} from 'lucide-react';
import { Layer, BlendMode, KasenoDocument, AdjustmentType } from '../types/kaseno';

interface LayersPanelProps {
  doc: KasenoDocument;
  width?: number;
  onSelectLayer: (layerID: string) => void;
  onUpdateLayer: (layerID: string, updater: (l: Layer) => Layer) => void;
  onReorderLayers: (sourceIndex: number, targetIndex: number) => void;
  onNewLayer: () => void;
  onDuplicateLayer: (layerID: string) => void;
  onDeleteLayer: (layerID: string) => void;
  onAddMask: (layerID: string) => void;
  onOpenAdjustment: (kind: AdjustmentType) => void;
  onOpenEffects?: (layerID?: string) => void;
  onConvertToSmartObject?: (layerID: string) => void;
  onOpenSmartObject?: (layerID: string) => void;
  onRemoveBackground?: (layerID: string) => void;
}

const BLEND_GROUPS = [
  {
    name: 'Normal',
    modes: [{ value: 'normal', label: 'Normal' }]
  },
  {
    name: 'Darken',
    modes: [
      { value: 'darken', label: 'Darken' },
      { value: 'multiply', label: 'Multiply' },
      { value: 'color-burn', label: 'Color Burn' }
    ]
  },
  {
    name: 'Lighten',
    modes: [
      { value: 'lighten', label: 'Lighten' },
      { value: 'screen', label: 'Screen' },
      { value: 'color-dodge', label: 'Color Dodge' }
    ]
  },
  {
    name: 'Contrast',
    modes: [
      { value: 'overlay', label: 'Overlay' },
      { value: 'soft-light', label: 'Soft Light' },
      { value: 'hard-light', label: 'Hard Light' }
    ]
  },
  {
    name: 'Inversion',
    modes: [
      { value: 'difference', label: 'Difference' },
      { value: 'exclusion', label: 'Exclusion' }
    ]
  },
  {
    name: 'Component',
    modes: [
      { value: 'hue', label: 'Hue' },
      { value: 'saturation', label: 'Saturation' },
      { value: 'color', label: 'Color' },
      { value: 'luminosity', label: 'Luminosity' }
    ]
  }
];

export const LayersPanel: React.FC<LayersPanelProps> = ({
  doc,
  width = 252,
  onSelectLayer,
  onUpdateLayer,
  onReorderLayers,
  onNewLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onAddMask,
  onOpenAdjustment,
  onOpenEffects,
  onConvertToSmartObject,
  onOpenSmartObject,
  onRemoveBackground,
}) => {
  const [editingLayerID, setEditingLayerID] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [adjustmentMenuOpen, setAdjustmentMenuOpen] = useState(false);
  const [effectsMenuOpen, setEffectsMenuOpen] = useState(false);

  const activeLayer = doc.layers.find(l => l.id === doc.activeLayerID) || doc.layers[0];

  const handleStartRename = (layer: Layer) => {
    setEditingLayerID(layer.id);
    setEditingName(layer.name);
  };

  const handleFinishRename = (layerID: string) => {
    if (editingName.trim()) {
      onUpdateLayer(layerID, l => ({ ...l, name: editingName.trim() }));
    }
    setEditingLayerID(null);
  };

  const reversedLayers = [...doc.layers].reverse();

  return (
    <div className="panel-section" style={{ width, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Panel Header: "Layers" & Count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>Layers</span>
        <span className="pill-badge pill-badge-dark" style={{ fontSize: 10, padding: '1px 6px', height: 18 }}>
          {doc.layers.length}
        </span>
      </div>

      {/* 2. LayerAppearanceControls matching LayerAppearanceControls.swift */}
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-header)' }}>
        {/* Blend Mode Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11.5, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--text-muted)', width: 44 }}>Blend</span>
          <select
            value={activeLayer ? activeLayer.blendMode : 'normal'}
            onChange={(e) => {
              if (activeLayer) {
                onUpdateLayer(activeLayer.id, l => ({ ...l, blendMode: e.target.value as BlendMode }));
              }
            }}
            disabled={!activeLayer}
            className="studio-input"
            style={{ flex: 1, height: 24, fontSize: 11.5, fontFamily: 'var(--font-sans)', fontWeight: 500, borderRadius: 9999, padding: '2px 8px' }}
          >
            {BLEND_GROUPS.map(group => (
              <optgroup key={group.name} label={group.name}>
                {group.modes.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Opacity Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="scrubbable" style={{ fontSize: 11.5, fontFamily: 'var(--font-sans)', fontWeight: 600, width: 44, color: 'var(--text-muted)' }}>Opacity</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={activeLayer ? activeLayer.opacity : 1}
            onChange={(e) => {
              if (activeLayer) {
                onUpdateLayer(activeLayer.id, l => ({ ...l, opacity: Number(e.target.value) }));
              }
            }}
            disabled={!activeLayer}
            style={{ flex: 1 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <input
              type="text"
              value={activeLayer ? Math.round(activeLayer.opacity * 100) : 100}
              onChange={(e) => {
                const num = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(num) && activeLayer) {
                  const val = Math.max(0, Math.min(100, num)) / 100;
                  onUpdateLayer(activeLayer.id, l => ({ ...l, opacity: val }));
                }
              }}
              disabled={!activeLayer}
              className="studio-input"
              style={{ width: 44, height: 22, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, padding: '2px 6px' }}
            />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>%</span>
          </div>
        </div>
      </div>

      {/* 3. Layer List (52px row height matching NativeLayerList.swift) */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {reversedLayers.map((layer) => {
          const isActive = layer.id === doc.activeLayerID;
          const actualIndex = doc.layers.findIndex(l => l.id === layer.id);

          return (
            <div
              key={layer.id}
              className={`layer-row ${isActive ? 'active' : ''}`}
              onClick={() => onSelectLayer(layer.id)}
            >
              {/* Clipping mask indicator */}
              {layer.isClippingMask && (
                <CornerDownRight size={13} color="var(--accent)" style={{ marginLeft: 4, flexShrink: 0 }} />
              )}

              {/* Eye Visibility Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateLayer(layer.id, l => ({ ...l, isVisible: !l.isVisible }));
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: layer.isVisible ? 'var(--text-main)' : 'rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={layer.isVisible ? 'Hide layer' : 'Show layer'}
              >
                {layer.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>

              {/* Layer Thumbnail (36x36 rounded) */}
              <div
                onDoubleClick={(e) => {
                  if (layer.isSmartObject) {
                    e.stopPropagation();
                    onOpenSmartObject?.(layer.id);
                  }
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 4,
                  background: '#181818',
                  border: layer.isSmartObject ? '1.5px solid #f59e0b' : '1px solid var(--border-subtle)',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: layer.isSmartObject ? 'pointer' : 'default',
                }}
                title={layer.isSmartObject ? 'Smart Object: Double-click to open and edit contents' : ''}
              >
                {layer.adjustment ? (
                  <Sliders size={16} color="var(--accent)" />
                ) : layer.text ? (
                  <span style={{ fontSize: 13, fontWeight: 'bold' }}>T</span>
                ) : layer.canvas ? (
                  <img
                    src={layer.thumbnailUrl || layer.canvas.toDataURL()}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Layers size={14} color="var(--text-dim)" />
                )}
              </div>

              {/* Mask Thumbnail (if present) */}
              {layer.maskCanvas && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, l => ({ ...l, maskEnabled: !l.maskEnabled }));
                  }}
                  title="Layer Mask"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 4,
                    background: '#000',
                    border: layer.maskEnabled ? '1px solid #ffffff' : '1px dashed var(--danger)',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={layer.maskCanvas.toDataURL()}
                    alt="mask"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* Layer Name & Subtitle */}
              <div style={{ flex: 1, minWidth: 0 }} onDoubleClick={() => handleStartRename(layer)}>
                {editingLayerID === layer.id ? (
                  <input
                    type="text"
                    value={editingName}
                    autoFocus
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleFinishRename(layer.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(layer.id);
                      if (e.key === 'Escape') setEditingLayerID(null);
                    }}
                    className="studio-input"
                    style={{ width: '100%', height: 22 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 600, color: isActive ? '#ffffff' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {layer.name}
                      </span>
                      {layer.isSmartObject && (
                        <span
                          className="pill-badge"
                          style={{
                            background: '#f59e0b',
                            color: '#000',
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '1px 5px',
                            height: 15,
                            borderRadius: 3,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSmartObject?.(layer.id);
                          }}
                          title="Smart Object - click or double-click thumbnail to edit"
                        >
                          SO
                        </span>
                      )}
                      {layer.effects && Object.values(layer.effects).some((e: any) => e?.enabled) && (
                        <span
                          className="pill-badge"
                          style={{
                            background: '#06b6d4',
                            color: '#000',
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '1px 5px',
                            height: 15,
                            borderRadius: 3,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEffects?.(layer.id);
                          }}
                          title="Layer Styles - Click to edit effects"
                        >
                          fx
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {layer.adjustment ? (
                        layer.adjustment.kind.replace('-', ' ')
                      ) : layer.isSmartObject ? (
                        <span style={{ color: '#fbbf24' }}>Embedded Composition</span>
                      ) : (
                        `${layer.transform.width} × ${layer.transform.height} px`
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Lock Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateLayer(layer.id, l => ({ ...l, isLocked: !l.isLocked }));
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: layer.isLocked ? 'var(--accent)' : 'transparent',
                  cursor: 'pointer',
                  padding: 2,
                }}
                className={isActive ? 'show-on-hover' : ''}
              >
                {layer.isLocked ? <Lock size={12} /> : <Unlock size={12} style={{ opacity: 0.2 }} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* 4. Footer Toolbar matching exact footer in LayersPanel.swift */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 38,
          padding: '0 8px',
          background: 'var(--bg-app)',
          borderTop: '1px solid var(--border-subtle)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* plus.square (New blank layer) */}
          <button
            type="button"
            className="tool-button"
            style={{ width: 28, height: 28 }}
            onClick={onNewLayer}
            title="New blank layer (Ctrl+Shift+N)"
          >
            <PlusSquare size={15} />
          </button>

          {/* folder.badge.plus (New folder / group) */}
          <button
            type="button"
            className="tool-button"
            style={{ width: 28, height: 28 }}
            onClick={() => {
              if (activeLayer) onDuplicateLayer(activeLayer.id);
            }}
            title="Group / Duplicate (Ctrl+G)"
          >
            <FolderPlus size={15} />
          </button>

          {/* LayerMaskMenu (circle.dashed / mask) */}
          <button
            type="button"
            className="tool-button"
            style={{ width: 28, height: 28 }}
            onClick={() => {
              if (activeLayer) onAddMask(activeLayer.id);
            }}
            title="Add Layer Mask"
          >
            <div style={{ width: 14, height: 14, border: '1.5px dashed currentColor', borderRadius: '50%' }} />
          </button>

          {/* Layer effects sparkles */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="tool-button"
              style={{ width: 28, height: 28 }}
              onClick={() => {
                if (onOpenEffects && activeLayer) {
                  onOpenEffects(activeLayer.id);
                } else {
                  setEffectsMenuOpen(!effectsMenuOpen);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setEffectsMenuOpen(!effectsMenuOpen);
              }}
              title="Layer Styles (fx) · Right-click for menu"
            >
              <Sparkles size={15} />
            </button>

            {effectsMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 34,
                  left: 0,
                  background: '#1e1e1e',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: 6,
                  padding: '4px 0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  width: 210,
                  zIndex: 100,
                }}
              >
                <div
                  onClick={() => {
                    setEffectsMenuOpen(false);
                    if (activeLayer) onOpenEffects?.(activeLayer.id);
                  }}
                  style={{ padding: '6px 12px', fontSize: 11, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Sparkles size={12} />
                  <span>Layer Styles (fx)…</span>
                </div>
                <div
                  onClick={() => {
                    setEffectsMenuOpen(false);
                    if (activeLayer) onConvertToSmartObject?.(activeLayer.id);
                  }}
                  style={{ padding: '6px 12px', fontSize: 11, cursor: 'pointer', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Layers size={12} />
                  <span>Convert to Smart Object</span>
                </div>
                {activeLayer?.isSmartObject && (
                  <div
                    onClick={() => {
                      setEffectsMenuOpen(false);
                      if (activeLayer) onOpenSmartObject?.(activeLayer.id);
                    }}
                    style={{ padding: '6px 12px', fontSize: 11, cursor: 'pointer', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>📂 Edit Smart Object</span>
                  </div>
                )}
                <div
                  onClick={() => {
                    setEffectsMenuOpen(false);
                    if (activeLayer) onRemoveBackground?.(activeLayer.id);
                  }}
                  style={{ padding: '6px 12px', fontSize: 11, cursor: 'pointer', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>✂️ Remove Background (AI)</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <div
                  onClick={() => {
                    setEffectsMenuOpen(false);
                    onOpenAdjustment('gaussian-blur');
                  }}
                  style={{ padding: '6px 12px', fontSize: 11, cursor: 'pointer', color: '#cbd5e1' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Gaussian Blur…
                </div>
              </div>
            )}
          </div>

          {/* circle.lefthalf.filled (Adjustment layer) */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="tool-button"
              style={{ width: 28, height: 28 }}
              onClick={() => setAdjustmentMenuOpen(!adjustmentMenuOpen)}
              title="New adjustment layer"
            >
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'linear-gradient(to right, currentColor 50%, transparent 50%)', border: '1.5px solid currentColor' }} />
            </button>

            {adjustmentMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 34,
                  left: 0,
                  background: '#242424',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: 6,
                  padding: '4px 0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  width: 170,
                  zIndex: 100,
                }}
              >
                {[
                  { kind: 'brightness-contrast', label: 'Brightness/Contrast' },
                  { kind: 'levels', label: 'Levels…' },
                  { kind: 'curves', label: 'Curves…' },
                  { kind: 'exposure', label: 'Exposure…' },
                  { kind: 'hue-saturation', label: 'Hue/Saturation…' },
                  { kind: 'color-balance', label: 'Color Balance…' },
                  { kind: 'black-white', label: 'Black & White' },
                  { kind: 'invert', label: 'Invert' },
                  { kind: 'gaussian-blur', label: 'Gaussian Blur…' },
                  { kind: 'noise', label: 'Add Noise…' },
                ].map(item => (
                  <div
                    key={item.kind}
                    onClick={() => {
                      setAdjustmentMenuOpen(false);
                      onOpenAdjustment(item.kind as AdjustmentType);
                    }}
                    style={{ padding: '6px 12px', fontSize: 11, cursor: 'pointer', color: '#fff' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete button (trash) */}
        <button
          type="button"
          className="tool-button"
          style={{ width: 28, height: 28 }}
          disabled={doc.layers.length <= 1}
          onClick={() => {
            if (activeLayer && doc.layers.length > 1) {
              onDeleteLayer(activeLayer.id);
            }
          }}
          title="Delete layer"
        >
          <Trash2 size={14} color={doc.layers.length > 1 ? 'var(--text-muted)' : 'var(--text-dim)'} />
        </button>
      </div>
    </div>
  );
};
