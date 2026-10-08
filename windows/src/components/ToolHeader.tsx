import React from 'react';
import { ToolType, ToolSettings } from '../types/kaseno';
import { Check, X, FlipHorizontal, FlipVertical, Sparkles, Scissors, RotateCcw } from 'lucide-react';

interface ToolHeaderProps {
  activeTool: ToolType;
  settings: ToolSettings;
  onUpdateSettings: (updater: (prev: ToolSettings) => ToolSettings) => void;
  onSelectTool?: (tool: ToolType) => void;
  onCommitCrop?: () => void;
  onCancelCrop?: () => void;
  onRemoveBackground?: () => void;
  onSelectSubject?: () => void;
  onApplyWarp?: () => void;
  onResetWarp?: () => void;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  activeTool,
  settings,
  onUpdateSettings,
  onSelectTool,
  onCommitCrop,
  onCancelCrop,
  onRemoveBackground,
  onSelectSubject,
  onApplyWarp,
  onResetWarp,
}) => {
  return (
    <div className="studio-toolheader">
      {/* Tool Title with GitKura Bricolage Grotesque & pill badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 90 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#ffffff', letterSpacing: '-0.01em' }}>
          {activeTool === 'brush' ? 'Brush' :
           activeTool === 'eraser' ? 'Eraser' :
           activeTool === 'clone' ? 'Clone Stamp' :
           activeTool === 'marquee-rect' || activeTool === 'marquee-ellipse' ? 'Marquee' :
           activeTool === 'lasso' ? 'Lasso' :
           activeTool === 'wand' ? 'Wand' :
           activeTool === 'crop' ? 'Crop' :
           activeTool === 'warp' ? 'Mesh Warp' :
           activeTool === 'liquify' ? 'Liquify' :
           activeTool === 'type' ? 'Type' :
           activeTool === 'shape' ? 'Shape' :
           activeTool === 'move' ? 'Move' :
           activeTool === 'eyedropper' ? 'Eyedropper' :
           activeTool === 'gradient' ? 'Gradient' :
           activeTool === 'smudge' ? 'Blur & Smudge' : 'Navigation'}
        </span>
        <span className="pill-badge pill-badge-dark" style={{ fontSize: 9.5, padding: '1px 5px', height: 16 }}>
          {activeTool === 'brush' ? 'B' :
           activeTool === 'eraser' ? 'E' :
           activeTool === 'clone' ? 'S' :
           activeTool === 'marquee-rect' || activeTool === 'marquee-ellipse' ? 'M' :
           activeTool === 'lasso' ? 'L' :
           activeTool === 'wand' ? 'W' :
           activeTool === 'crop' ? 'C' :
           activeTool === 'warp' ? 'K' :
           activeTool === 'liquify' ? 'J' :
           activeTool === 'type' ? 'T' :
           activeTool === 'shape' ? 'U' :
           activeTool === 'move' ? 'V' :
           activeTool === 'eyedropper' ? 'I' :
           activeTool === 'gradient' ? 'G' : 'H'}
        </span>
      </div>

      {/* AI Quick Actions (Remove Background & Select Subject) */}
      {(activeTool === 'move' || activeTool === 'wand' || activeTool === 'lasso' || activeTool === 'marquee-rect') && onRemoveBackground && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
          <button
            type="button"
            onClick={onRemoveBackground}
            className="capsule-button"
            style={{ 
              background: 'rgba(254, 240, 138, 0.15)', 
              borderColor: 'var(--kura-yellow)', 
              color: 'var(--kura-yellow)',
              fontWeight: 700,
              fontSize: 11,
              padding: '2px 9px',
              height: 24,
            }}
            title="Automatically cut out subject and remove background with AI"
          >
            ✨ Remove BG
          </button>
          {onSelectSubject && (
            <button
              type="button"
              onClick={onSelectSubject}
              className="capsule-button"
              style={{ fontSize: 11, padding: '2px 9px', height: 24 }}
              title="Automatically create a selection outline around the subject"
            >
              🎯 Select Subject
            </button>
          )}
        </div>
      )}

      <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />

      {/* Brush / Eraser Tool Controls matching BrushControls.swift */}
      {(activeTool === 'brush' || activeTool === 'eraser') && (
        <>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-button ${activeTool === 'brush' ? 'active' : ''}`}
              onClick={() => onSelectTool?.('brush')}
            >
              Paint
            </button>
            <button
              type="button"
              className={`segmented-button ${activeTool === 'eraser' ? 'active' : ''}`}
              onClick={() => onSelectTool?.('eraser')}
            >
              Erase
            </button>
          </div>

          {/* Size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="scrubbable" style={{ fontSize: 11.5, fontWeight: 600, fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>Size</span>
            <input
              type="number"
              min={1}
              max={2000}
              value={activeTool === 'eraser' ? settings.eraser.size : settings.brush.size}
              onChange={(e) => {
                const val = Math.max(1, Math.min(2000, Number(e.target.value)));
                onUpdateSettings(prev => ({
                  ...prev,
                  [activeTool]: { ...prev[activeTool as 'brush' | 'eraser'], size: val }
                }));
              }}
              className="studio-input"
              style={{ width: 44, height: 24, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, padding: '2px 6px' }}
            />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>px</span>
          </div>

          {/* Hardness */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="scrubbable" style={{ fontSize: 11.5, fontWeight: 600, fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>Hardness</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={activeTool === 'eraser' ? settings.eraser.hardness : settings.brush.hardness}
              onChange={(e) => {
                const val = Number(e.target.value);
                onUpdateSettings(prev => ({
                  ...prev,
                  [activeTool]: { ...prev[activeTool as 'brush' | 'eraser'], hardness: val }
                }));
              }}
              style={{ width: 80 }}
            />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-dim)', minWidth: 32 }}>
              {Math.round((activeTool === 'eraser' ? settings.eraser.hardness : settings.brush.hardness) * 100)}%
            </span>
          </div>

          {/* Opacity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="scrubbable" style={{ fontSize: 11.5, fontWeight: 600, fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>Opacity</span>
            <input
              type="range"
              min={0.01}
              max={1}
              step={0.05}
              value={activeTool === 'eraser' ? settings.eraser.opacity : settings.brush.opacity}
              onChange={(e) => {
                const val = Number(e.target.value);
                onUpdateSettings(prev => ({
                  ...prev,
                  [activeTool]: { ...prev[activeTool as 'brush' | 'eraser'], opacity: val }
                }));
              }}
              style={{ width: 80 }}
            />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-dim)', minWidth: 32 }}>
              {Math.round((activeTool === 'eraser' ? settings.eraser.opacity : settings.brush.opacity) * 100)}%
            </span>
          </div>
        </>
      )}

      {/* Clone Stamp Controls */}
      {activeTool === 'clone' && (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span>Aligned</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Size</span>
            <input
              type="number"
              min={1}
              max={2000}
              value={settings.clone.size}
              onChange={(e) => onUpdateSettings(prev => ({
                ...prev,
                clone: { ...prev.clone, size: Number(e.target.value) }
              }))}
              className="studio-input"
              style={{ width: 48, height: 24, textAlign: 'right' }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>px</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Hardness</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.clone.hardness}
              onChange={(e) => onUpdateSettings(prev => ({
                ...prev,
                clone: { ...prev.clone, hardness: Number(e.target.value) }
              }))}
              style={{ width: 75 }}
            />
          </div>

          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Alt-click to set clone source point
          </span>
        </>
      )}

      {/* Marquee Controls */}
      {(activeTool === 'marquee-rect' || activeTool === 'marquee-ellipse') && (
        <>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-button ${activeTool === 'marquee-rect' ? 'active' : ''}`}
              onClick={() => onSelectTool?.('marquee-rect')}
            >
              Rectangle
            </button>
            <button
              type="button"
              className={`segmented-button ${activeTool === 'marquee-ellipse' ? 'active' : ''}`}
              onClick={() => onSelectTool?.('marquee-ellipse')}
            >
              Ellipse
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Feather</span>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.marquee.feather}
              onChange={(e) => onUpdateSettings(prev => ({
                ...prev,
                marquee: { ...prev.marquee, feather: Number(e.target.value) }
              }))}
              className="studio-input"
              style={{ width: 44, height: 24, textAlign: 'right' }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>px</span>
          </div>
        </>
      )}

      {/* Lasso Controls */}
      {activeTool === 'lasso' && (
        <>
          <div className="segmented-control">
            <button type="button" className="segmented-button active">Freehand</button>
            <button type="button" className="segmented-button">Polygonal</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Feather</span>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.marquee.feather}
              onChange={(e) => onUpdateSettings(prev => ({
                ...prev,
                marquee: { ...prev.marquee, feather: Number(e.target.value) }
              }))}
              className="studio-input"
              style={{ width: 44, height: 24, textAlign: 'right' }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>px</span>
          </div>
        </>
      )}

      {/* Wand Controls */}
      {activeTool === 'wand' && (
        <>
          <div className="segmented-control">
            <button type="button" className="segmented-button active">Wand</button>
            <button type="button" className="segmented-button">Object Selection</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Tolerance</span>
            <input
              type="number"
              min={0}
              max={255}
              value={settings.wand.tolerance}
              onChange={(e) => onUpdateSettings(prev => ({
                ...prev,
                wand: { ...prev.wand, tolerance: Number(e.target.value) }
              }))}
              className="studio-input"
              style={{ width: 44, height: 24, textAlign: 'right' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.wand.contiguous}
              onChange={(e) => onUpdateSettings(prev => ({
                ...prev,
                wand: { ...prev.wand, contiguous: e.target.checked }
              }))}
            />
            <span>Contiguous</span>
          </label>
        </>
      )}

      {/* Crop Controls matching CropControls.swift */}
      {activeTool === 'crop' && (
        <>
          <select
            value={settings.crop.aspectRatio}
            onChange={(e) => onUpdateSettings(prev => ({
              ...prev,
              crop: { ...prev.crop, aspectRatio: e.target.value as any }
            }))}
            className="studio-input"
            style={{ height: 26 }}
          >
            <option value="free">Free Aspect Ratio</option>
            <option value="1:1">1:1 Square</option>
            <option value="16:9">16:9 Widescreen</option>
            <option value="4:3">4:3 Standard</option>
          </select>

          <button
            type="button"
            className="capsule-button primary"
            onClick={onCommitCrop}
            style={{ height: 26 }}
          >
            <Check size={12} />
            <span>Apply (Enter)</span>
          </button>

          <button
            type="button"
            className="capsule-button"
            onClick={onCancelCrop}
            style={{ height: 26 }}
          >
            <X size={12} />
            <span>Cancel (Esc)</span>
          </button>
        </>
      )}

      {/* Type Controls matching TypeControls.swift */}
      {activeTool === 'type' && (
        <>
          <select
            value={settings.type.fontFamily}
            onChange={(e) => onUpdateSettings(prev => ({
              ...prev,
              type: { ...prev.type, fontFamily: e.target.value }
            }))}
            className="studio-input"
            style={{ height: 26 }}
          >
            <option value="Segoe UI, sans-serif">Segoe UI</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Courier New, monospace">Courier New</option>
            <option value="Impact, sans-serif">Impact</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Size</span>
            <input
              type="number"
              min={6}
              max={300}
              value={settings.type.fontSize}
              onChange={(e) => onUpdateSettings(prev => ({
                ...prev,
                type: { ...prev.type, fontSize: Number(e.target.value) }
              }))}
              className="studio-input"
              style={{ width: 44, height: 24, textAlign: 'right' }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>pt</span>
          </div>

          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-button ${settings.type.bold ? 'active' : ''}`}
              onClick={() => onUpdateSettings(prev => ({
                ...prev,
                type: { ...prev.type, bold: !prev.type.bold }
              }))}
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className={`segmented-button ${settings.type.italic ? 'active' : ''}`}
              onClick={() => onUpdateSettings(prev => ({
                ...prev,
                type: { ...prev.type, italic: !prev.type.italic }
              }))}
            >
              <em>I</em>
            </button>
          </div>
        </>
      )}

      {/* Shape Controls matching ShapeControls.swift */}
      {activeTool === 'shape' && (
        <>
          <div className="segmented-control">
            {(['rect', 'ellipse', 'line'] as const).map(shapeType => (
              <button
                key={shapeType}
                type="button"
                className={`segmented-button ${settings.shape.type === shapeType ? 'active' : ''}`}
                onClick={() => onUpdateSettings(prev => ({
                  ...prev,
                  shape: { ...prev.shape, type: shapeType }
                }))}
                style={{ textTransform: 'capitalize' }}
              >
                {shapeType === 'rect' ? 'Rectangle' : shapeType === 'ellipse' ? 'Circle' : 'Line'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Stroke</span>
            <input
              type="number"
              min={0}
              max={50}
              value={settings.shape.strokeWidth}
              onChange={(e) => onUpdateSettings(prev => ({
                ...prev,
                shape: { ...prev.shape, strokeWidth: Number(e.target.value) }
              }))}
              className="studio-input"
              style={{ width: 40, height: 24, textAlign: 'right' }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>px</span>
          </div>
        </>
      )}

      {/* Move Tool Options */}
      {activeTool === 'move' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Drag to move · Handles to resize · Space to pan
          </span>
        </div>
      )}

      {/* Mesh Warp Controls */}
      {activeTool === 'warp' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Grid Density</span>
            <div className="segmented-control">
              {([3, 4, 5] as const).map(div => (
                <button
                  key={div}
                  type="button"
                  className={`segmented-button ${(settings.warp?.divisions || 3) === div ? 'active' : ''}`}
                  onClick={() => onUpdateSettings(prev => ({
                    ...prev,
                    warp: { ...(prev.warp || { divisions: 3, points: [] }), divisions: div }
                  }))}
                >
                  {div}×{div}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="tool-button"
            style={{ width: 'auto', padding: '0 10px', height: 26, gap: 5, background: 'var(--accent)', color: '#000', fontWeight: 600, fontSize: 11 }}
            onClick={onApplyWarp}
            title="Commit mesh warp deformation to active layer"
          >
            <Check size={14} />
            Apply Warp
          </button>

          <button
            type="button"
            className="tool-button"
            style={{ width: 'auto', padding: '0 8px', height: 26, gap: 4, fontSize: 11 }}
            onClick={onResetWarp}
            title="Reset mesh grid to default"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </>
      )}

      {/* Liquify Controls */}
      {activeTool === 'liquify' && (
        <>
          <div className="segmented-control">
            {(['push', 'bloat', 'pucker', 'reconstruct'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                className={`segmented-button ${(settings.liquify?.mode || 'push') === mode ? 'active' : ''}`}
                onClick={() => onUpdateSettings(prev => ({
                  ...prev,
                  liquify: { ...(prev.liquify || { mode: 'push', size: 60, strength: 0.5 }), mode }
                }))}
                style={{ textTransform: 'capitalize' }}
              >
                {mode}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Size</span>
            <input
              type="range"
              min={10}
              max={300}
              value={settings.liquify?.size || 60}
              onChange={(e) => onUpdateSettings(prev => ({
                ...prev,
                liquify: { ...(prev.liquify || { mode: 'push', size: 60, strength: 0.5 }), size: Number(e.target.value) }
              }))}
              style={{ width: 75 }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-dim)', width: 34 }}>{settings.liquify?.size || 60}px</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Strength</span>
            <input
              type="range"
              min={0.05}
              max={1.0}
              step={0.05}
              value={settings.liquify?.strength || 0.5}
              onChange={(e) => onUpdateSettings(prev => ({
                ...prev,
                liquify: { ...(prev.liquify || { mode: 'push', size: 60, strength: 0.5 }), strength: Number(e.target.value) }
              }))}
              style={{ width: 75 }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-dim)', width: 30 }}>{Math.round((settings.liquify?.strength || 0.5) * 100)}%</span>
          </div>
        </>
      )}

      {/* Smart Subject & AI Quick Actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        {onSelectSubject && (
          <button
            type="button"
            className="tool-button"
            style={{ width: 'auto', padding: '0 8px', height: 26, gap: 5, fontSize: 11, borderRadius: 4, background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
            onClick={onSelectSubject}
            title="Auto-detect and select foreground subject with marching ants"
          >
            <Sparkles size={13} />
            <span>Select Subject</span>
          </button>
        )}

        {onRemoveBackground && (
          <button
            type="button"
            className="tool-button"
            style={{ width: 'auto', padding: '0 8px', height: 26, gap: 5, fontSize: 11, borderRadius: 4, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}
            onClick={onRemoveBackground}
            title="Automatically isolate subject and remove background with non-destructive mask"
          >
            <Scissors size={13} />
            <span>Remove BG</span>
          </button>
        )}
      </div>
    </div>
  );
};
