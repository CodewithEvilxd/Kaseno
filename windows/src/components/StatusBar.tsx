import React from 'react';
import { KasenoDocument, ToolType } from '../types/kaseno';

interface StatusBarProps {
  doc: KasenoDocument | null;
  zoom: number;
  activeTool: ToolType;
  isBusy?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  doc,
  zoom,
  activeTool,
  isBusy = false,
}) => {
  const getToolGuidance = (): string => {
    switch (activeTool) {
      case 'marquee-rect':
        return 'Drag a rectangle · Shift add · Alt subtract · Shift again mid-drag square · Drag inside to move · Delete clears · Ctrl+D deselect';
      case 'marquee-ellipse':
        return 'Drag an ellipse · Shift add · Alt subtract · Shift again mid-drag circle · Drag inside to move · Delete clears · Ctrl+D deselect';
      case 'wand':
        return 'Click to select similar colors · Tab for Object · Shift add · Alt subtract · Drag inside to move · Delete clears · Ctrl+D deselect';
      case 'lasso':
        return 'Drag to select · Drag inside to move · Shift add · Alt subtract · Delete clears · Ctrl+D deselect';
      case 'brush':
        return 'Drag to paint · [ ] size · Shift-[ ] hardness · 1–0 opacity · Escape cancel · Space to pan';
      case 'eraser':
        return 'Drag to erase · [ ] size · Shift-[ ] hardness · 1–0 opacity · Escape cancel · Space to pan';
      case 'smudge':
        return 'Drag to smudge & soften pixels · [ ] size · Shift-[ ] hardness · Space to pan';
      case 'clone':
        return 'Alt-click to set the source · Drag to clone · [ ] size · Shift-[ ] hardness · 1–0 opacity · Space to pan';
      case 'type':
        return 'Drag a text box · Click text to edit · Drag box handles to resize · Ctrl+Enter finish · Escape cancel';
      case 'shape':
        return 'Drag to draw a shape on a new layer · Shift square/circle · Alt from center · Escape cancel · Space to pan';
      case 'gradient':
        return 'Drag to draw · Shift 45° · 1–0 opacity · Enter apply · Escape cancel';
      case 'crop':
        return 'Drag to crop · Enter apply · Escape cancel · Space to pan';
      case 'move':
        return 'Drag to move · Handles to resize · Circle to rotate · 1–0 layer opacity · Space to pan';
      case 'hand':
        return 'Drag to pan · Pinch to zoom';
      case 'zoom':
        return 'Click to zoom in · Alt-click to zoom out · Drag right or left to zoom smoothly · Space to pan';
      case 'eyedropper':
        return 'Click canvas to sample color · Toggle sample ring in options bar';
      default:
        return 'Ready when you are · Space to pan';
    }
  };

  return (
    <div className="studio-statusbar">
      {/* 1. Left: App Name, Engine status & Document metrics (NO highlighter box!) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap' }}>
        {/* App Name & Mini Mascot Icon as clean text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img 
            src="/app-icon.png" 
            alt="" 
            style={{ 
              width: 14, 
              height: 14, 
              borderRadius: 3.5, 
              objectFit: 'cover',
              border: '1px solid rgba(254, 240, 138, 0.4)'
            }} 
          />
          <span style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: 11, 
            fontWeight: 700, 
            color: '#94a3b8',
            letterSpacing: '0.02em',
          }}>
            Kaseno v1.0
          </span>
        </div>

        {/* Engine Ready with simple glowing dot, NO box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#cbd5e1' }}>
          <span style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            background: '#34d399', 
            display: 'inline-block', 
            boxShadow: '0 0 6px rgba(52, 211, 153, 0.7)' 
          }} />
          <span style={{ fontWeight: 500 }}>Engine Ready</span>
        </div>

        {/* Separator dot */}
        <span style={{ color: 'var(--border-prominent)', fontSize: 10 }}>•</span>

        {doc ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' }}>
              {(zoom * 100).toFixed(0)}%
            </span>
            <span>·</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' }}>
              {doc.width} × {doc.height} px
            </span>
            <span>·</span>
            <span>sRGB · Transparent</span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            Ready when you are
          </span>
        )}
      </div>

      {/* 2. Center: Prominent Handwritten Notebook Tool Guidance (Patrick Hand font) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0 10px' }}>
        {isBusy ? (
          <span className="handwritten-note" style={{ color: 'var(--kura-yellow)' }}>
            Working…
          </span>
        ) : (
          <span className="handwritten-note" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {getToolGuidance()}
          </span>
        )}
      </div>

      {/* 3. Right: Creator Signature as clean plain text, NO highlighter box! */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
        <span style={{ 
          fontSize: 11.5, 
          fontFamily: 'var(--font-sans)', 
          color: '#94a3b8',
          letterSpacing: '0.01em',
        }}>
          by <strong style={{ color: '#f1f5f9', fontWeight: 700 }}>Nishant Gaurav</strong>
        </span>
      </div>
    </div>
  );
};
