import React, { useState } from 'react';
import { LayerEffects } from '../types/kaseno';
import { X, Sparkles, Check, Sliders } from 'lucide-react';

interface LayerEffectsModalProps {
  isOpen: boolean;
  initialEffects: LayerEffects | null | undefined;
  onConfirm: (effects: LayerEffects) => void;
  onClose: () => void;
}

export const LayerEffectsModal: React.FC<LayerEffectsModalProps> = ({
  isOpen,
  initialEffects,
  onConfirm,
  onClose,
}) => {
  const [effects, setEffects] = useState<LayerEffects>(() => initialEffects ? JSON.parse(JSON.stringify(initialEffects)) : {
    stroke: { enabled: false, size: 4, color: '#ffffff', opacity: 1.0, position: 'outside' },
    dropShadow: { enabled: false, distance: 10, angle: 90, blur: 15, color: '#000000', opacity: 0.75 },
    outerGlow: { enabled: false, size: 20, color: '#00e5ff', opacity: 0.8 },
    colorOverlay: { enabled: false, color: '#ff0055', opacity: 0.5 },
  });

  const [activeTab, setActiveTab] = useState<'shadow' | 'stroke' | 'glow' | 'overlay'>('shadow');

  if (!isOpen) return null;

  const handlePreset = (type: 'sticker' | 'neon' | 'cinematic' | 'glass') => {
    switch (type) {
      case 'sticker':
        setEffects({
          stroke: { enabled: true, size: 8, color: '#ffffff', opacity: 1.0, position: 'outside' },
          dropShadow: { enabled: true, distance: 8, angle: 90, blur: 12, color: '#000000', opacity: 0.4 },
          outerGlow: { enabled: false, size: 0, color: '#ffffff', opacity: 0 },
          colorOverlay: { enabled: false, color: '#ffffff', opacity: 0 },
        });
        break;
      case 'neon':
        setEffects({
          stroke: { enabled: true, size: 2, color: '#38bdf8', opacity: 0.9, position: 'center' },
          dropShadow: { enabled: false, distance: 0, angle: 0, blur: 0, color: '#000000', opacity: 0 },
          outerGlow: { enabled: true, size: 30, color: '#0ea5e9', opacity: 1.0 },
          colorOverlay: { enabled: false, color: '#ffffff', opacity: 0 },
        });
        break;
      case 'cinematic':
        setEffects({
          stroke: { enabled: false, size: 0, color: '#ffffff', opacity: 0, position: 'outside' },
          dropShadow: { enabled: true, distance: 24, angle: 120, blur: 35, color: '#000000', opacity: 0.85 },
          outerGlow: { enabled: false, size: 0, color: '#ffffff', opacity: 0 },
          colorOverlay: { enabled: false, color: '#ffffff', opacity: 0 },
        });
        break;
      case 'glass':
        setEffects({
          stroke: { enabled: true, size: 1, color: '#ffffff', opacity: 0.4, position: 'inside' },
          dropShadow: { enabled: true, distance: 12, angle: 90, blur: 24, color: '#000000', opacity: 0.5 },
          outerGlow: { enabled: true, size: 10, color: '#ffffff', opacity: 0.2 },
          colorOverlay: { enabled: false, color: '#ffffff', opacity: 0 },
        });
        break;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ width: 540, maxHeight: '90vh' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="var(--kura-yellow)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Layer Styles (Live FX)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Style Presets Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Presets:</span>
          <button type="button" onClick={() => handlePreset('sticker')} className="capsule-button" style={{ padding: '2px 8px', fontSize: 10.5 }}>
            🏷️ Sticker Outline
          </button>
          <button type="button" onClick={() => handlePreset('neon')} className="capsule-button" style={{ padding: '2px 8px', fontSize: 10.5 }}>
            ⚡ Neon Glow
          </button>
          <button type="button" onClick={() => handlePreset('cinematic')} className="capsule-button" style={{ padding: '2px 8px', fontSize: 10.5 }}>
            🎬 Deep Cinema Shadow
          </button>
          <button type="button" onClick={() => handlePreset('glass')} className="capsule-button" style={{ padding: '2px 8px', fontSize: 10.5 }}>
            💎 Glass Edge
          </button>
        </div>

        {/* Body Tabs Layout */}
        <div style={{ display: 'flex', flex: 1, minHeight: 320 }}>
          {/* Left Tabs */}
          <div style={{ width: 140, borderRight: '1px solid var(--border-subtle)', padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'shadow', label: 'Drop Shadow', enabled: !!effects.dropShadow?.enabled },
              { id: 'stroke', label: 'Stroke Outline', enabled: !!effects.stroke?.enabled },
              { id: 'glow', label: 'Outer Glow', enabled: !!effects.outerGlow?.enabled },
              { id: 'overlay', label: 'Color Overlay', enabled: !!effects.colorOverlay?.enabled },
            ].map(tab => (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: 11.5,
                }}
              >
                <span>{tab.label}</span>
                <input
                  type="checkbox"
                  checked={tab.enabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setEffects(prev => ({
                      ...prev,
                      [tab.id === 'shadow' ? 'dropShadow' : tab.id === 'stroke' ? 'stroke' : tab.id === 'glow' ? 'outerGlow' : 'colorOverlay']: {
                        ...(prev as any)[tab.id === 'shadow' ? 'dropShadow' : tab.id === 'stroke' ? 'stroke' : tab.id === 'glow' ? 'outerGlow' : 'colorOverlay'],
                        enabled: checked,
                      }
                    }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))}
          </div>

          {/* Right Parameters Area */}
          <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {activeTab === 'shadow' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Enable Drop Shadow</span>
                  <input
                    type="checkbox"
                    checked={!!effects.dropShadow?.enabled}
                    onChange={(e) => setEffects(prev => ({ ...prev, dropShadow: { ...prev.dropShadow!, enabled: e.target.checked } }))}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Opacity</span>
                    <span>{Math.round((effects.dropShadow?.opacity ?? 0.75) * 100)}%</span>
                  </div>
                  <input
                    type="range" min={0} max={1} step={0.01}
                    value={effects.dropShadow?.opacity ?? 0.75}
                    onChange={(e) => setEffects(prev => ({ ...prev, dropShadow: { ...prev.dropShadow!, opacity: parseFloat(e.target.value) } }))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Distance</span>
                    <span>{effects.dropShadow?.distance ?? 10} px</span>
                  </div>
                  <input
                    type="range" min={0} max={100}
                    value={effects.dropShadow?.distance ?? 10}
                    onChange={(e) => setEffects(prev => ({ ...prev, dropShadow: { ...prev.dropShadow!, distance: parseInt(e.target.value) } }))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Blur (Size)</span>
                    <span>{effects.dropShadow?.blur ?? 15} px</span>
                  </div>
                  <input
                    type="range" min={0} max={80}
                    value={effects.dropShadow?.blur ?? 15}
                    onChange={(e) => setEffects(prev => ({ ...prev, dropShadow: { ...prev.dropShadow!, blur: parseInt(e.target.value) } }))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Shadow Color:</span>
                  <input
                    type="color"
                    value={effects.dropShadow?.color ?? '#000000'}
                    onChange={(e) => setEffects(prev => ({ ...prev, dropShadow: { ...prev.dropShadow!, color: e.target.value } }))}
                    style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  />
                </div>
              </>
            )}

            {activeTab === 'stroke' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Enable Stroke Outline</span>
                  <input
                    type="checkbox"
                    checked={!!effects.stroke?.enabled}
                    onChange={(e) => setEffects(prev => ({ ...prev, stroke: { ...prev.stroke!, enabled: e.target.checked } }))}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Stroke Size</span>
                    <span>{effects.stroke?.size ?? 4} px</span>
                  </div>
                  <input
                    type="range" min={1} max={50}
                    value={effects.stroke?.size ?? 4}
                    onChange={(e) => setEffects(prev => ({ ...prev, stroke: { ...prev.stroke!, size: parseInt(e.target.value) } }))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Stroke Color:</span>
                  <input
                    type="color"
                    value={effects.stroke?.color ?? '#ffffff'}
                    onChange={(e) => setEffects(prev => ({ ...prev, stroke: { ...prev.stroke!, color: e.target.value } }))}
                    style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  />
                </div>
              </>
            )}

            {activeTab === 'glow' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Enable Outer Glow</span>
                  <input
                    type="checkbox"
                    checked={!!effects.outerGlow?.enabled}
                    onChange={(e) => setEffects(prev => ({ ...prev, outerGlow: { ...prev.outerGlow!, enabled: e.target.checked } }))}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Glow Radius</span>
                    <span>{effects.outerGlow?.size ?? 20} px</span>
                  </div>
                  <input
                    type="range" min={1} max={100}
                    value={effects.outerGlow?.size ?? 20}
                    onChange={(e) => setEffects(prev => ({ ...prev, outerGlow: { ...prev.outerGlow!, size: parseInt(e.target.value) } }))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Glow Color:</span>
                  <input
                    type="color"
                    value={effects.outerGlow?.color ?? '#00e5ff'}
                    onChange={(e) => setEffects(prev => ({ ...prev, outerGlow: { ...prev.outerGlow!, color: e.target.value } }))}
                    style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  />
                </div>
              </>
            )}

            {activeTab === 'overlay' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Enable Color Overlay</span>
                  <input
                    type="checkbox"
                    checked={!!effects.colorOverlay?.enabled}
                    onChange={(e) => setEffects(prev => ({ ...prev, colorOverlay: { ...prev.colorOverlay!, enabled: e.target.checked } }))}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Overlay Opacity</span>
                    <span>{Math.round((effects.colorOverlay?.opacity ?? 0.5) * 100)}%</span>
                  </div>
                  <input
                    type="range" min={0} max={1} step={0.01}
                    value={effects.colorOverlay?.opacity ?? 0.5}
                    onChange={(e) => setEffects(prev => ({ ...prev, colorOverlay: { ...prev.colorOverlay!, opacity: parseFloat(e.target.value) } }))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fill Color:</span>
                  <input
                    type="color"
                    value={effects.colorOverlay?.color ?? '#ff0055'}
                    onChange={(e) => setEffects(prev => ({ ...prev, colorOverlay: { ...prev.colorOverlay!, color: e.target.value } }))}
                    style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} className="capsule-button">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(effects);
              onClose();
            }}
            className="capsule-button primary"
            style={{ fontWeight: 700 }}
          >
            Apply Effects
          </button>
        </div>
      </div>
    </div>
  );
};
