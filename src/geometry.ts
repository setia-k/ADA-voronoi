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

/** The part of the segment inside the canvas grown by `margin` on every side, or null if none. */
function clipSegment(segment: Segment, margin = 0): Segment | null {
  const { a, b } = segment;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const limits: [number, number][] = [
    [-dx, a.x + margin],
    [dx, CANVAS_WIDTH + margin - a.x],
    [-dy, a.y + margin],
    [dy, CANVAS_HEIGHT + margin - a.y],
  ];
  let t0 = 0;
  let t1 = 1;
  for (const [p, q] of limits) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return null;
      t0 = Math.max(t0, t);
    } else {
      if (t < t0) return null;
      t1 = Math.min(t1, t);
    }
  }
  return {
    a: { x: a.x + t0 * dx, y: a.y + t0 * dy },
    b: { x: a.x + t1 * dx, y: a.y + t1 * dy },
  };
}

export type { Point, Segment };
export { CANVAS_WIDTH, CANVAS_HEIGHT, EPS, samePoint, countDistinct, clipSegment };
