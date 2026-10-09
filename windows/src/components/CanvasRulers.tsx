import React, { useEffect, useRef } from 'react';

interface CanvasRulersProps {
  width: number;
  height: number;
  zoom: number;
  pan: { x: number; y: number };
}

export const CanvasRulers: React.FC<CanvasRulersProps> = ({
  width,
  height,
  zoom,
  pan,
}) => {
  const hRulerRef = useRef<HTMLCanvasElement>(null);
  const vRulerRef = useRef<HTMLCanvasElement>(null);

  // Helper for major tick spacing in pixels
  const getMajorStep = (scale: number): number => {
    const target = 70 / Math.max(scale, 0.0001);
    const nice = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];
    return nice.find(n => n >= target) || 10000;
  };

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    const rulerThickness = 18;

    // 1. Horizontal Ruler
    if (hRulerRef.current) {
      const canvas = hRulerRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const cssW = width;
        const cssH = rulerThickness;

        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Background
        ctx.fillStyle = '#262626';
        ctx.fillRect(0, 0, cssW, cssH);

        const step = getMajorStep(zoom);
        const minor = step / 10;
        const startDocX = -(pan.x - rulerThickness) / zoom;
        const endDocX = (cssW - (pan.x - rulerThickness)) / zoom;
        const first = Math.floor(Math.min(startDocX, endDocX) / minor) * minor;
        const last = Math.ceil(Math.max(startDocX, endDocX) / minor) * minor;

        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        for (let docX = first; docX <= last + 0.001; docX += minor) {
          const viewX = docX * zoom + pan.x - rulerThickness;
          if (viewX < 0 || viewX > cssW) continue;

          const remainder = Math.abs(docX % step);
          const isMajor = remainder < 0.001 || Math.abs(remainder - step) < 0.001;
          const isMid = !isMajor && Math.abs(docX % (step / 2)) < 0.001;
          const tickH = isMajor ? 8 : isMid ? 5 : 3;

          // Tick line
          ctx.fillStyle = isMajor ? '#94a3b8' : '#52525b';
          ctx.fillRect(Math.round(viewX), cssH - tickH, 1, tickH);

          // Major number label
          if (isMajor) {
            ctx.fillStyle = '#cbd5e1';
            const labelText = Math.round(docX).toString();
            ctx.fillText(labelText, Math.round(viewX) + 3, 2);
          }
        }

        // Bottom border hairline
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(0, cssH - 1, cssW, 1);
      }
    }

    // 2. Vertical Ruler
    if (vRulerRef.current) {
      const canvas = vRulerRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const cssW = rulerThickness;
        const cssH = height;

        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Background
        ctx.fillStyle = '#262626';
        ctx.fillRect(0, 0, cssW, cssH);

        const step = getMajorStep(zoom);
        const minor = step / 10;
        const startDocY = -(pan.y - rulerThickness) / zoom;
        const endDocY = (cssH - (pan.y - rulerThickness)) / zoom;
        const first = Math.floor(Math.min(startDocY, endDocY) / minor) * minor;
        const last = Math.ceil(Math.max(startDocY, endDocY) / minor) * minor;

        ctx.font = '8px "JetBrains Mono", monospace';

        for (let docY = first; docY <= last + 0.001; docY += minor) {
          const viewY = docY * zoom + pan.y - rulerThickness;
          if (viewY < 0 || viewY > cssH) continue;

          const remainder = Math.abs(docY % step);
          const isMajor = remainder < 0.001 || Math.abs(remainder - step) < 0.001;
          const isMid = !isMajor && Math.abs(docY % (step / 2)) < 0.001;
          const tickW = isMajor ? 8 : isMid ? 5 : 3;

          // Tick line
          ctx.fillStyle = isMajor ? '#94a3b8' : '#52525b';
          ctx.fillRect(cssW - tickW, Math.round(viewY), tickW, 1);

          // Major number label (rotated 90° to read downwards along the ruler)
          if (isMajor) {
            ctx.fillStyle = '#cbd5e1';
            const labelText = Math.round(docY).toString();
            ctx.save();
            // Position at X=8 (center of ruler's label lane), Y=viewY+3 (just below tick)
            ctx.translate(8, Math.round(viewY) + 3);
            ctx.rotate(Math.PI / 2); // 90° clockwise, reads downwards
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, 0, 0);
            ctx.restore();
          }
        }

        // Right border hairline
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(cssW - 1, 0, 1, cssH);
      }
    }
  }, [width, height, zoom, pan]);

  return (
    <>
      {/* Corner Square (18x18) */}
      <div className="ruler-corner">
        <svg width="18" height="18">
          <line x1="3" y1="15" x2="15" y2="3" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        </svg>
      </div>

      {/* Horizontal Ruler */}
      <div className="ruler-horizontal">
        <canvas ref={hRulerRef} style={{ width: '100%', height: 18, display: 'block' }} />
      </div>

      {/* Vertical Ruler */}
      <div className="ruler-vertical">
        <canvas ref={vRulerRef} style={{ width: 18, height: '100%', display: 'block' }} />
      </div>
    </>
  );
};
