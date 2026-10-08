/**
 * Mesh Warp & Liquify Deformation Engine for Kaseno
 * High-performance 2D grid warping, push deform, bloat, pucker & reconstruction.
 */

export interface WarpGridPoint {
  x: number;
  y: number;
  origX: number;
  origY: number;
}

export class WarpEngine {
  /**
   * Initializes a regular grid of control points for a given bounding box
   */
  public static createGrid(
    width: number,
    height: number,
    divisions: number = 3
  ): WarpGridPoint[][] {
    const grid: WarpGridPoint[][] = [];
    for (let r = 0; r <= divisions; r++) {
      const row: WarpGridPoint[] = [];
      const y = (r / divisions) * height;
      for (let c = 0; c <= divisions; c++) {
        const x = (c / divisions) * width;
        row.push({ x, y, origX: x, origY: y });
      }
      grid.push(row);
    }
    return grid;
  }

  /**
   * Deforms a canvas using the perturbed grid points
   */
  public static renderMeshWarp(
    sourceCanvas: HTMLCanvasElement,
    grid: WarpGridPoint[][]
  ): HTMLCanvasElement {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const rows = grid.length - 1;
    const cols = grid[0].length - 1;

    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d');
    if (!ctx) return sourceCanvas;

    // Render deformed triangular patches
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p0 = grid[r][c];
        const p1 = grid[r][c + 1];
        const p2 = grid[r + 1][c + 1];
        const p3 = grid[r + 1][c];

        this.drawTriangle(ctx, sourceCanvas, p0, p1, p2);
        this.drawTriangle(ctx, sourceCanvas, p0, p2, p3);
      }
    }

    return out;
  }

  /**
   * Applies liquify push, bloat, or pucker deformation around a brush point
   */
  public static applyLiquify(
    canvas: HTMLCanvasElement,
    centerX: number,
    centerY: number,
    radius: number,
    strength: number,
    mode: 'push' | 'bloat' | 'pucker' | 'reconstruct',
    deltaX: number = 0,
    deltaY: number = 0
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x0 = Math.max(0, Math.floor(centerX - radius));
    const y0 = Math.max(0, Math.floor(centerY - radius));
    const x1 = Math.min(canvas.width, Math.ceil(centerX + radius));
    const y1 = Math.min(canvas.height, Math.ceil(centerY + radius));
    const bw = x1 - x0;
    const bh = y1 - y0;
    if (bw <= 0 || bh <= 0) return;

    const imgData = ctx.getImageData(x0, y0, bw, bh);
    const srcData = ctx.getImageData(x0, y0, bw, bh);
    const pixels = imgData.data;
    const src = srcData.data;

    const r2 = radius * radius;

    for (let y = 0; y < bh; y++) {
      const py = y0 + y;
      const dy = py - centerY;
      for (let x = 0; x < bw; x++) {
        const px = x0 + x;
        const dx = px - centerX;
        const dist2 = dx * dx + dy * dy;

        if (dist2 >= r2) continue;

        const dist = Math.sqrt(dist2);
        const falloff = Math.cos((dist / radius) * (Math.PI / 2)) * strength;

        let sampleX = px;
        let sampleY = py;

        if (mode === 'push') {
          sampleX -= deltaX * falloff;
          sampleY -= deltaY * falloff;
        } else if (mode === 'bloat') {
          sampleX -= dx * falloff * 0.4;
          sampleY -= dy * falloff * 0.4;
        } else if (mode === 'pucker') {
          sampleX += dx * falloff * 0.4;
          sampleY += dy * falloff * 0.4;
        }

        const sx = Math.max(0, Math.min(bw - 1, Math.round(sampleX - x0)));
        const sy = Math.max(0, Math.min(bh - 1, Math.round(sampleY - y0)));

        const targetIdx = (y * bw + x) * 4;
        const sampleIdx = (sy * bw + sx) * 4;

        pixels[targetIdx] = src[sampleIdx];
        pixels[targetIdx + 1] = src[sampleIdx + 1];
        pixels[targetIdx + 2] = src[sampleIdx + 2];
        pixels[targetIdx + 3] = src[sampleIdx + 3];
      }
    }

    ctx.putImageData(imgData, x0, y0);
  }

  private static drawTriangle(
    ctx: CanvasRenderingContext2D,
    im: HTMLCanvasElement,
    p0: WarpGridPoint,
    p1: WarpGridPoint,
    p2: WarpGridPoint
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();
    ctx.clip();

    // Affine texture map
    const x0 = p0.x, y0 = p0.y;
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const u0 = p0.origX, v0 = p0.origY;
    const u1 = p1.origX, v1 = p1.origY;
    const u2 = p2.origX, v2 = p2.origY;

    const delta = u0 * (v1 - v2) - v0 * (u1 - u2) + (u1 * v2 - u2 * v1);
    if (Math.abs(delta) > 0.0001) {
      const a = (x0 * (v1 - v2) - y0 * (u1 - u2) + (x1 * v2 - x2 * v1)) / delta;
      const b = (u0 * (y1 - y2) - v0 * (x1 - x2) + (y1 * u2 - y2 * u1)) / delta;
      const c = (x0 * (v2 - v0) - y0 * (u2 - u0) + (x2 * v0 - x0 * v2)) / delta;
      const d = (u0 * (y2 - y0) - v0 * (x2 - x0) + (y2 * u0 - y0 * u2)) / delta;
      const e = x0 - a * u0 - c * v0;
      const f = y0 - b * u0 - d * v0;

      ctx.transform(a, b, c, d, e, f);
      ctx.drawImage(im, 0, 0);
    }
    ctx.restore();
  }
}
