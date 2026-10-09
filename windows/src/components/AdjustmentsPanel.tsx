import React from 'react';
import { 
  Sun, Activity, TrendingUp, Sparkles, Palette, 
  CircleDot, SplitSquareVertical, Droplets, Shuffle, Eye, Film
} from 'lucide-react';
import { AdjustmentType, Layer } from '../types/kaseno';

interface AdjustmentsPanelProps {
  activeLayer: Layer | null;
  onApplyAdjustment: (kind: AdjustmentType) => void;
  onEditActiveAdjustment?: () => void;
}

export const AdjustmentsPanel: React.FC<AdjustmentsPanelProps> = ({
  activeLayer,
  onApplyAdjustment,
  onEditActiveAdjustment,
}) => {
  const adjustments: { kind: AdjustmentType; label: string; icon: React.ReactNode; color: string }[] = [
    { kind: 'brightness-contrast', label: 'Brightness / Contrast', icon: <Sun size={15} />, color: '#fbbf24' },
    { kind: 'levels', label: 'Levels', icon: <Activity size={15} />, color: '#60a5fa' },
    { kind: 'curves', label: 'Curves', icon: <TrendingUp size={15} />, color: '#a78bfa' },
    { kind: 'exposure', label: 'Exposure', icon: <Sparkles size={15} />, color: '#f472b6' },
    { kind: 'hue-saturation', label: 'Hue / Saturation', icon: <Palette size={15} />, color: '#34d399' },
    { kind: 'color-balance', label: 'Color Balance', icon: <CircleDot size={15} />, color: '#38bdf8' },
    { kind: 'black-white', label: 'Black & White', icon: <SplitSquareVertical size={15} />, color: '#e2e8f0' },
    { kind: 'lut', label: '3D LUT & Film Stock', icon: <Film size={15} />, color: 'var(--kura-yellow)' },
    { kind: 'gaussian-blur', label: 'Gaussian Blur', icon: <Droplets size={15} />, color: '#2dd4bf' },
    { kind: 'noise', label: 'Add Noise', icon: <Activity size={15} />, color: '#fb923c' },
    { kind: 'invert', label: 'Invert', icon: <Shuffle size={15} />, color: '#c084fc' },
  ];

  return (
    <div className="panel-section" style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Adjustments
        </span>
        {activeLayer?.adjustment && onEditActiveAdjustment && (
          <button
            type="button"
            onClick={onEditActiveAdjustment}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: 10,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Edit Settings
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {adjustments.map((adj) => (
          <button
            key={adj.kind}
            type="button"
            onClick={() => onApplyAdjustment(adj.kind)}
            title={adj.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 38,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              cursor: 'pointer',
              color: adj.color,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface-hover)';
              e.currentTarget.style.borderColor = adj.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            {adj.icon}
          </button>
        ))}
      </div>
    </div>
  );
};
