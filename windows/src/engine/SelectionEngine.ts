export class SelectionEngine {
  public static createRectSelection(
    width: number,
    height: number,
    rect: { x: number; y: number; width: number; height: number },
    feather: number = 0
  ): Uint8Array {
    const mask = new Uint8Array(width * height);
    const minX = Math.max(0, Math.min(width - 1, Math.floor(Math.min(rect.x, rect.x + rect.width))));
    const maxX = Math.max(0, Math.min(width - 1, Math.floor(Math.max(rect.x, rect.x + rect.width))));
    const minY = Math.max(0, Math.min(height - 1, Math.floor(Math.min(rect.y, rect.y + rect.height))));
    const maxY = Math.max(0, Math.min(height - 1, Math.floor(Math.max(rect.y, rect.y + rect.height))));

    for (let y = minY; y <= maxY; y++) {
      const rowOffset = y * width;
      for (let x = minX; x <= maxX; x++) {
        mask[rowOffset + x] = 255;
      }
    }

    if (feather > 0) {
      return this.featherMask(mask, width, height, feather);
    }
    return mask;
  }

  public static createEllipseSelection(
    width: number,
    height: number,
    rect: { x: number; y: number; width: number; height: number },
    feather: number = 0
  ): Uint8Array {
    const mask = new Uint8Array(width * height);
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const rx = Math.max(1, Math.abs(rect.width) / 2);
    const ry = Math.max(1, Math.abs(rect.height) / 2);

    const minX = Math.max(0, Math.floor(cx - rx));
    const maxX = Math.min(width - 1, Math.ceil(cx + rx));
    const minY = Math.max(0, Math.floor(cy - ry));
    const maxY = Math.min(height - 1, Math.ceil(cy + ry));

    for (let y = minY; y <= maxY; y++) {
      const dy = (y - cy) / ry;
      const dy2 = dy * dy;
      if (dy2 > 1) continue;
      const rowOffset = y * width;
      for (let x = minX; x <= maxX; x++) {
        const dx = (x - cx) / rx;
        if (dx * dx + dy2 <= 1) {
          mask[rowOffset + x] = 255;
        }
      }
    }

    if (feather > 0) {
      return this.featherMask(mask, width, height, feather);
    }
    return mask;
  }

  public static createLassoSelection(
    width: number,
    height: number,
    points: { x: number; y: number }[]
  ): Uint8Array {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx || points.length < 3) return new Uint8Array(width * height);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    const imgData = ctx.getImageData(0, 0, width, height);
    const mask = new Uint8Array(width * height);
    for (let i = 0; i < mask.length; i++) {
      mask[i] = imgData.data[i * 4];
    }
    return mask;
  }

  /**
   * Magic wand flood fill based on tolerance and color difference.
   */
  public static magicWand(
    sourceImageData: ImageData,
    startX: number,
    startY: number,
    tolerance: number,
    contiguous: boolean
  ): Uint8Array {
    const w = sourceImageData.width;
    const h = sourceImageData.height;
    const data = sourceImageData.data;
    const mask = new Uint8Array(w * h);

    if (startX < 0 || startX >= w || startY < 0 || startY >= h) return mask;

    const startIdx = (startY * w + startX) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];
    const targetA = data[startIdx + 3];

    const maxDiff = tolerance * 2.55;

    const match = (idx: number) => {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      const diff = Math.max(Math.abs(r - targetR), Math.abs(g - targetG), Math.abs(b - targetB), Math.abs(a - targetA));
      return diff <= maxDiff;
    };

    if (!contiguous) {
      for (let i = 0; i < w * h; i++) {
        if (match(i * 4)) {
          mask[i] = 255;
        }
      }
      return mask;
    }

    // BFS queue for contiguous flood fill
    const queue = [startY * w + startX];
    const visited = new Uint8Array(w * h);
    visited[startY * w + startX] = 1;
    mask[startY * w + startX] = 255;

    let head = 0;
    while (head < queue.length) {
      const pos = queue[head++];
      const x = pos % w;
      const y = Math.floor(pos / w);

      const neighbors = [
        x > 0 ? pos - 1 : -1,
        x < w - 1 ? pos + 1 : -1,
        y > 0 ? pos - w : -1,
        y < h - 1 ? pos + w : -1,
      ];

      for (const n of neighbors) {
        if (n !== -1 && !visited[n]) {
          visited[n] = 1;
          if (match(n * 4)) {
            mask[n] = 255;
            queue.push(n);
          }
        }
      }
    }

    return mask;
  }

  public static invertMask(mask: Uint8Array): Uint8Array {
    const res = new Uint8Array(mask.length);
    for (let i = 0; i < mask.length; i++) {
      res[i] = 255 - mask[i];
    }
    return res;
  }

  public static featherMask(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
    const r = Math.max(1, Math.min(30, Math.round(radius)));
    const out = new Uint8Array(mask.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        for (let ky = -r; ky <= r; ky += 2) {
          const ny = Math.min(height - 1, Math.max(0, y + ky));
          for (let kx = -r; kx <= r; kx += 2) {
            const nx = Math.min(width - 1, Math.max(0, x + kx));
            sum += mask[ny * width + nx];
            count++;
          }
        }
        out[y * width + x] = Math.round(sum / count);
      }
    }
    return out;
  }

  /**
   * Renders marching ants animated boundary over the viewport canvas.
   */
  public static renderMarchingAnts(
    ctx: CanvasRenderingContext2D,
    mask: Uint8Array,
    width: number,
    height: number,
    dashOffset: number
  ) {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = dashOffset;
    ctx.strokeStyle = '#ffffff';

    // Fast contour drawing: trace edge pixels where mask has value > 128 and neighbor <= 128
    ctx.beginPath();
    const step = 2; // Performance optimization for large canvases
    for (let y = 0; y < height; y += step) {
      const row = y * width;
      for (let x = 0; x < width; x += step) {
        const val = mask[row + x];
        if (val > 128) {
          const left = x > 0 ? mask[row + x - 1] : 0;
          const right = x < width - 1 ? mask[row + x + 1] : 0;
          const top = y > 0 ? mask[row - width + x] : 0;
          const bottom = y < height - 1 ? mask[row + width + x] : 0;

          if (left <= 128 || right <= 128 || top <= 128 || bottom <= 128) {
            ctx.rect(x, y, 1, 1);
          }
        }
      }
    }
    ctx.stroke();

    // Secondary black dash for high contrast visibility on all backgrounds
    ctx.lineDashOffset = dashOffset + 4;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    ctx.restore();
  }
}
