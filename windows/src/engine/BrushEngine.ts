export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export class BrushEngine {
  /**
   * Draws interpolated brush dabs on the given canvas context.
   */
  public static strokeBetween(
    ctx: CanvasRenderingContext2D,
    from: StrokePoint,
    to: StrokePoint,
    options: {
      color: string;
      size: number;
      hardness: number; // 0..1
      opacity: number; // 0..1
      flow: number; // 0..1
      spacing?: number; // 0.05..1
      isEraser?: boolean;
    }
  ) {
    const { color, size, hardness, opacity, flow, spacing = 0.1, isEraser = false } = options;
    const radius = Math.max(0.5, size / 2);
    const step = Math.max(1, radius * spacing * 2);

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.floor(dist / step));

    ctx.save();
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    const dabOpacity = Math.min(1, Math.max(0.01, opacity * flow));
    ctx.globalAlpha = dabOpacity;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const y = from.y + dy * t;
      this.drawDab(ctx, x, y, radius, hardness, color);
    }

    ctx.restore();
  }

  public static drawDab(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    hardness: number,
    color: string
  ) {
    if (radius <= 0) return;

    if (hardness >= 0.98) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const grad = ctx.createRadialGradient(x, y, radius * Math.max(0, hardness), x, y, radius);
      grad.addColorStop(0, color);
      // Fade out smoothly
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Clone stamp painting from source offset.
   */
  public static cloneStampBetween(
    targetCtx: CanvasRenderingContext2D,
    sourceCanvas: HTMLCanvasElement,
    from: StrokePoint,
    to: StrokePoint,
    sourceOffset: { x: number; y: number },
    options: { size: number; hardness: number; opacity: number }
  ) {
    const { size, hardness, opacity } = options;
    const radius = size / 2;
    const step = Math.max(1, radius * 0.2);

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.floor(dist / step));

    targetCtx.save();
    targetCtx.globalAlpha = opacity;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const targetX = from.x + dx * t;
      const targetY = from.y + dy * t;
      const srcX = targetX + sourceOffset.x;
      const srcY = targetY + sourceOffset.y;

      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.arc(targetX, targetY, radius, 0, Math.PI * 2);
      targetCtx.clip();

      targetCtx.drawImage(
        sourceCanvas,
        srcX - radius,
        srcY - radius,
        size,
        size,
        targetX - radius,
        targetY - radius,
        size,
        size
      );
      targetCtx.restore();
    }
    targetCtx.restore();
  }
}
