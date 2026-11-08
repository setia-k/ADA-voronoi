// Voronoi diagram by divide and conquer (bottom-up loop).
import type { Point, Segment } from "./geometry.ts";
import type { Line } from "./renderer.ts";

type Step = { lines: Line[] };

type Result = {
  edges: Segment[];
  log: Step[];
};

function solveVoronoi(points: readonly Point[]): Result {
  const edges: Segment[] = [];
  const log: Step[] = [];


  return { edges, log };
}

export type { Step, Result };
export { solveVoronoi };
