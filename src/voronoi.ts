// Voronoi diagram by divide and conquer (bottom-up loop).
import type { Point, Segment } from "./geometry.ts";
import type { Line } from "./renderer.ts";

type Step = { lines: Line[] };
type Edge = Segment & { pair: { p: Point; q: Point } };

type Result = {
  edges: Edge[];
  log: Step[];
};

const walk = {
  // find crossing
  crossing(p1: Point, p2: Point, p3: Point, p4: Point): { point: Point; t: number } | null {
    const d1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const d2 = { x: p4.x - p3.x, y: p4.y - p3.y };
    const denom = d1.x * d2.y - d1.y * d2.x;
    if (denom === 0) return null;
    const w = { x: p3.x - p1.x, y: p3.y - p1.y };
    const t = (w.x * d2.y - w.y * d2.x) / denom;
    const u = (w.x * d1.y - w.y * d1.x) / denom;
    if (t < 0 || t > 1 || u < 0 || u > 1) return null;
    return { point: { x: p1.x + t * d1.x, y: p1.y + t * d1.y }, t };
  },

  // does edge e separate site s from something?
  touches(e: Edge, s: Point): boolean {
    return e.pair.p === s || e.pair.q === s;
  },

  // the site on the other side of e from s
  other(e: Edge, s: Point): Point {
    return e.pair.p === s ? e.pair.q : e.pair.p;
  },
};
// distance between 2 points
function toDistance(p: Point, q: Point): number {
  return (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
}

function distinct(points: readonly Point[]): Point[] {
  const uniquePoints: Point[] = [];
  for (const p of points) {
    if (!uniquePoints.some((q) => p.x === q.x && p.y === q.y)) {
      uniquePoints.push(p);
    }
  }
  return uniquePoints;
}

function findBisector(p: Point, q: Point): Edge {
  const INFINITE = 10000000; // magic far number outside canvas
  const mid: Point = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy);
  const dir = { x: -dy / len, y: dx / len };
  return {
    a: { x: mid.x - INFINITE * dir.x, y: mid.y - INFINITE * dir.y },
    b: { x: mid.x + INFINITE * dir.x, y: mid.y + INFINITE * dir.y },
    pair: { p, q },
  };
}

function findBridge(left: Point[], right: Point[], upper: boolean): [Point, Point] {
  const all = [...left, ...right];
  let best: [Point, Point] | null = null;

  function cross(l: Point, r: Point, p: Point): number {
    return (r.x - l.x) * (p.y - l.y) - (r.y - l.y) * (p.x - l.x);
  }

  for (const l of left) {
    for (const r of right) {
      // check nothing above upper bridge or nothing below lower bridge
      const ok = all.every((p) => (upper ? cross(l, r, p) >= 0 : cross(l, r, p) <= 0));
      if (ok && (best === null || toDistance(l, r) < toDistance(best[0], best[1]))) best = [l, r];
    }
  }
  if (best) return best;
  throw new Error("no bridge found");
}

function solveVoronoi(points: readonly Point[]): Result {
  const edges: Edge[] = [];
  const log: Step[] = [];

  function mergeVoronoi(left: Point[], right: Point[]): Point[] {
    const mergedPoints = [...left, ...right];
    const isWrongSide = (e: Edge): boolean => {
      const mid = { x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2 };
      const others = left.includes(e.pair.p) ? right : left;
      return others.some((s) => toDistance(mid, s) < toDistance(mid, e.pair.p) - 1e-9);
    }
    // let p, q;

    // left diagram red, right diagram blue, other groups gray, new chain purple
    function picture(list: Edge[], chain: Edge[], extra: Line[] = []): Step {
      return {
        lines: [
          ...list.map((e) => ({
            a: e.a,
            b: e.b,
            color: left.includes(e.pair.p) ? "red" : right.includes(e.pair.p) ? "blue" : "lightgray",
          })),
          ...chain.map((e) => ({ a: e.a, b: e.b, color: "purple" })),
          ...extra,
        ],
      };
    }

    // L R have 1 point only
    if (left.length === 1 && right.length === 1) {
      edges.push(findBisector(left[0], right[0]));
      log.push(picture(edges, []));
    } else {
      const upper = findBridge(left, right, true);
      const lower = findBridge(left, right, false);
      const chain: Edge[] = [];
      const bridges: Line[] = [
        { a: upper[0], b: upper[1], color: "green" },
        { a: lower[0], b: lower[1], color: "green" },
      ];
      const untrimmed = [...edges];

      log.push(picture(untrimmed, [], bridges));

      let [l, r] = upper;
      let start = findBisector(l, r).a;

      // draw the walk
      for (let guard = 0; guard < 1000; guard++) {
        const bis = findBisector(l, r);

        // if last pair
        if (l === lower[0] && r === lower[1]) {
          chain.push({ a: start, b: bis.b, pair: { p: l, q: r } });
          break;
        }

        // first hit (a left and a right edge can be hit at the same point)
        let hits: { point: Point; t: number; edge: Edge }[] = [];
        for (const e of edges) {
          if (!walk.touches(e, l) && !walk.touches(e, r)) continue;
          const c = walk.crossing(start, bis.b, e.a, e.b);
          if (!c || c.t <= 1e-9) continue;
          if (hits.length === 0 || c.t < hits[0].t - 1e-12) hits = [{ ...c, edge: e }];
          else if (c.t <= hits[0].t + 1e-12) hits.push({ ...c, edge: e });
        }
        if (hits.length === 0) {
          console.warn("walk found no hit", l, r);
          break;
        }
        const hit = hits[0];

        chain.push({ a: start, b: hit.point, pair: { p: l, q: r } });
        let [nextL, nextR] = [l, r];
        for (const { edge: e } of hits) {
          const own = walk.touches(e, l) ? l : r;
          const opp = own === l ? r : l;
          const cut = toDistance(e.a, opp) < toDistance(e.a, own)
            ? { ...e, a: hit.point }
            : { ...e, b: hit.point };
          edges[edges.indexOf(e)] = cut;

          if (walk.touches(e, l)) nextL = walk.other(e, l);
          else nextR = walk.other(e, r);
        }
        [l, r] = [nextL, nextR];
        start = hit.point;
      }

      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if ((left.includes(e.pair.p) || right.includes(e.pair.p)) && isWrongSide(e)) {
          edges.splice(i, 1);
        }
      }

      log.push(picture(untrimmed, chain, bridges));
      log.push(picture(edges, chain));
      edges.push(...chain);
    }

    return mergedPoints;
  }

  const sortedPoints = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  let groups: Point[][] = sortedPoints.map((p) => [p]);

  while (groups.length > 1) {
    const next: Point[][] = [];


    for (let i = 0; i < groups.length; i += 2) {
      if (i + 1 < groups.length) {
        const merged = mergeVoronoi(groups[i], groups[i + 1]);
        next.push(merged);
      } else {
        next.push(groups[i]);
      }
    }
    groups = next;
  }

  // final diagram in black
  if (log.length > 0) log.push({ lines: edges.map((e) => ({ a: e.a, b: e.b, color: "black" })) });

  return { edges, log };
}

export type { Step, Result };
export { solveVoronoi, distinct };
