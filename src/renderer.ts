import { type Point, clipSegment } from "./geometry.ts";

type Line = {
  readonly a: Point;
  readonly b: Point;
  readonly color: string;
};

type Scene = {
  readonly sites: readonly Point[];
  readonly lines: readonly Line[];
};

const SITE_RADIUS = 3;
const BACKGROUND = "#fff";
const SITE_COLOR = "#000";
// Lines are cut to the canvas first: canvas can't draw huge coordinates reliably.
const CLIP_MARGIN = 10;

function render(ctx: CanvasRenderingContext2D, scene: Scene): void {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.lineWidth = 1;
  for (const line of scene.lines) {
    const visible = clipSegment(line, CLIP_MARGIN);
    if (!visible) continue;
    ctx.strokeStyle = line.color;
    ctx.beginPath();
    ctx.moveTo(visible.a.x, visible.a.y);
    ctx.lineTo(visible.b.x, visible.b.y);
    ctx.stroke();
  }

  ctx.fillStyle = SITE_COLOR;
  for (const site of scene.sites) {
    ctx.beginPath();
    ctx.arc(site.x, site.y, SITE_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
  }
}

export type { Line, Scene };
export { render };
