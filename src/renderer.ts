import type { Point, Segment } from "./geometry.ts";

type Scene = {
  readonly sites: readonly Point[];
  readonly edges: readonly Segment[];
};

const SITE_RADIUS = 3;
const BACKGROUND = "#fff";
const SITE_COLOR = "#000";
const EDGE_COLOR = "#000";

function render(ctx: CanvasRenderingContext2D, scene: Scene): void {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.strokeStyle = EDGE_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const edge of scene.edges) {
    ctx.moveTo(edge.a.x, edge.a.y);
    ctx.lineTo(edge.b.x, edge.b.y);
  }
  ctx.stroke();

  ctx.fillStyle = SITE_COLOR;
  for (const site of scene.sites) {
    ctx.beginPath();
    ctx.arc(site.x, site.y, SITE_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
  }
}

export type { Scene };
export { render };
