// Voronoi diagram by divide and conquer (bottom-up loop).
import type { Point, Segment } from "./geometry.ts";
import type { Line } from "./renderer.ts";

type Step = { lines: Line[] };

type Result = {
  edges: Segment[];
  log: Step[];
};

function distinct(points: readonly Point[]): Point[] {
  const uniquePoints: Point[] = [];
  for (const p of points) {
    if (!uniquePoints.some((q) => p.x === q.x && p.y === q.y)) {
      uniquePoints.push(p);
    }
  }
  return uniquePoints;
}

function findBisector(p: Point, q: Point) {
  const INFINITE = 2000 // magic far number outside canvas
  const mid: Point = {
    x: (p.x + q.x) / 2,
    y: (p.y + q.y) / 2,
  }
  const dx = q.x - p.x, dy = q.y - p.y
  const len = Math.hypot(dx, dy)
  const dir = { x: -dy / len, y: dx / len }
  return {
    a: { x: mid.x - INFINITE * dir.x, y: mid.y - INFINITE * dir.y },
    b: { x: mid.x + INFINITE * dir.x, y: mid.y + INFINITE * dir.y }
  }
}

function findBridge(left: Point[], right: Point[], upper: boolean): [Point, Point] {
  const all = [...left, ...right];

  const cross = (l: Point, r: Point, p: Point): number => {
    return (r.x - l.x) * (p.y - l.y) - (r.y - l.y) * (p.x - l.x);
  }

  for (const l of left) {
    for (const r of right) {
      // check nothing above upper bridge or nothing below lower bridge
      const ok = all.every((p) => (upper ? cross(l, r, p) >= 0 : cross(l, r, p) <= 0));
      if (ok) return [l, r];
    }
  }

  throw new Error("no bridge found");
}

function solveVoronoi(points: readonly Point[]): Result {

  const edges: Segment[] = [];
  const log: Step[] = [];

  function mergeVoronoi(left: Point[], right: Point[]): Point[] {
    const mergedPoints = [...left, ...right];
    // let p, q;

    // L R have 1 point only
    if (left.length === 1 && right.length === 1) {
      edges.push(findBisector(left[0], right[0]))
      log.push({ lines: edges.map((e) => ({ a: e.a, b: e.b, color: "red" })) });
    } else {
      const upper = findBridge(left, right, true);
      const lower = findBridge(left, right, false);

      log.push({
        lines: [
          ...edges.map((e) => ({ a: e.a, b: e.b, color: "red" })),
          { a: upper[0], b: upper[1], color: "green" },
          { a: lower[0], b: lower[1], color: "blue" },
        ],
      });
    }

    return mergedPoints;
  }


  console.log("start points:", points);
  const sortedPoints = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  console.log("sorted points", sortedPoints);
  let groups: Point[][] = sortedPoints.map((p) => [p]);

  while (groups.length > 1) {
    const next: Point[][] = [];

    console.log("pre-groups", groups);
    console.log("pre-next", next);

    for (let i = 0; i < groups.length; i += 2) {
      if (i + 1 < groups.length) {
        const merged = mergeVoronoi(groups[i], groups[i + 1]);
        next.push(merged);
      } else {
        next.push(groups[i]);
      }
    }
    groups = next;
    console.log("post-groups", groups);
    console.log("post-next", next);
  }

  // Your algorithm goes here.
  // To show a picture: log.push({ lines: [{ a, b, color: "red" }, ...] });


  return { edges, log };
}

export type { Step, Result };
export { solveVoronoi, distinct };
