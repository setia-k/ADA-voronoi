import type { Point } from "./geometry.ts";

export type Scene = {
  readonly sites: readonly Point[];
};

const SITE_RADIUS = 3;
const BACKGROUND = "#fff";
const SITE_COLOR = "#000";

export function render(ctx: CanvasRenderingContext2D, scene: Scene): void {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = SITE_COLOR;
  for (const site of scene.sites) {
    ctx.beginPath();
    ctx.arc(site.x, site.y, SITE_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
  }
}
