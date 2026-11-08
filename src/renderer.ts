import type { Point } from "./geometry.ts";

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

function render(ctx: CanvasRenderingContext2D, scene: Scene): void {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.lineWidth = 1;
  for (const line of scene.lines) {
    ctx.strokeStyle = line.color;
    ctx.beginPath();
    ctx.moveTo(line.a.x, line.a.y);
    ctx.lineTo(line.b.x, line.b.y);
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
