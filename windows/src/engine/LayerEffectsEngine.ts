/**
 * Layer Effects (Layer Styles) Rendering Engine for Kaseno
 * High-performance non-destructive Stroke, Drop Shadow, Outer Glow, and Color Overlay.
 */
import { LayerEffects } from '../types/kaseno';

export class LayerEffectsEngine {
  /**
   * Renders the complete layer effects stack around/under the source canvas
   */
  public static renderWithEffects(
    sourceCanvas: HTMLCanvasElement,
    effects: LayerEffects | null | undefined
  ): HTMLCanvasElement {
    if (!effects) return sourceCanvas;

    const hasAny = (effects.dropShadow?.enabled) ||
                   (effects.outerGlow?.enabled) ||
                   (effects.stroke?.enabled) ||
                   (effects.colorOverlay?.enabled);

    if (!hasAny) return sourceCanvas;

    const w = sourceCanvas.width;
    const h = sourceCanvas.height;

    // Buffer canvas for composite with effects
    const output = document.createElement('canvas');
    output.width = w;
    output.height = h;
    const ctx = output.getContext('2d');
    if (!ctx) return sourceCanvas;

    // 1. Drop Shadow (rendered under source)
    if (effects.dropShadow?.enabled) {
      const shadow = effects.dropShadow;
      const rad = (shadow.angle * Math.PI) / 180;
      const dx = Math.cos(rad) * shadow.distance;
      const dy = Math.sin(rad) * shadow.distance;

      ctx.save();
      ctx.shadowColor = this.hexToRgba(shadow.color, shadow.opacity);
      ctx.shadowBlur = shadow.blur;
      ctx.shadowOffsetX = dx;
      ctx.shadowOffsetY = dy;
      ctx.drawImage(sourceCanvas, 0, 0);
      ctx.restore();
    }

    // 2. Outer Glow (rendered under source)
    if (effects.outerGlow?.enabled) {
      const glow = effects.outerGlow;
      ctx.save();
      ctx.shadowColor = this.hexToRgba(glow.color, glow.opacity);
      ctx.shadowBlur = glow.size;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      // Draw multiple passes for rich neon outer glow
      ctx.drawImage(sourceCanvas, 0, 0);
      ctx.drawImage(sourceCanvas, 0, 0);
      ctx.restore();
    }

    // 3. Stroke (rendered around edge)
    if (effects.stroke?.enabled) {
      const stroke = effects.stroke;
      const strokeCanvas = document.createElement('canvas');
      strokeCanvas.width = w;
      strokeCanvas.height = h;
      const sCtx = strokeCanvas.getContext('2d');
      if (sCtx) {
        sCtx.drawImage(sourceCanvas, 0, 0);
        sCtx.globalCompositeOperation = 'source-in';
        sCtx.fillStyle = this.hexToRgba(stroke.color, stroke.opacity);
        sCtx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.shadowColor = this.hexToRgba(stroke.color, stroke.opacity);
        ctx.shadowBlur = stroke.size;
        ctx.drawImage(strokeCanvas, 0, 0);
        ctx.restore();
      }
    }

    // 4. Source Canvas
    ctx.drawImage(sourceCanvas, 0, 0);

    // 5. Color Overlay (rendered over source pixels)
    if (effects.colorOverlay?.enabled) {
      const overlay = effects.colorOverlay;
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = this.hexToRgba(overlay.color, overlay.opacity);
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    return output;
  }

  private static hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length >= 6) {
      r = parseInt(clean.substring(0, 2), 16);
      g = parseInt(clean.substring(2, 4), 16);
      b = parseInt(clean.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
  }
}
