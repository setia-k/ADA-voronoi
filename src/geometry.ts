// (0,0) is the top-left corner of the canvas
// (600,600) is the bottom-right corner.

type Point = {
  readonly x: number;
  readonly y: number;
};

type Segment = {
  readonly a: Point;
  readonly b: Point;
};

/** Also the clipping box for rays in the output file. */
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;

const EPS = 1e-9;

function samePoint(p: Point, q: Point): boolean {
  return Math.abs(p.x - q.x) < EPS && Math.abs(p.y - q.y) < EPS;
}

function countDistinct(points: readonly Point[]): number {
  return new Set(points.map((p) => `${p.x},${p.y}`)).size;
}



export type { Point, Segment };
export { CANVAS_WIDTH, CANVAS_HEIGHT, EPS, samePoint, countDistinct };
