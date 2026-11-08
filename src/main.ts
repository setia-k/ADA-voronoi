import { type Point, CANVAS_WIDTH, CANVAS_HEIGHT, countDistinct, samePoint } from "./geometry.ts";
import { render } from "./renderer.ts";

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}

function context2d(target: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = target.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is not available");
  return context;
}

const canvas = byId<HTMLCanvasElement>("canvas");
const ctx = context2d(canvas);

const ui = {
  undo: byId<HTMLButtonElement>("btnUndo"),
  clear: byId<HTMLButtonElement>("btnClear"),
  stepInfo: byId<HTMLOutputElement>("stepInfo"),
  mousePos: byId<HTMLOutputElement>("mousePos"),
  pointCount: byId<HTMLOutputElement>("pointCount"),
  pointList: byId<HTMLPreElement>("pointList"),
  status: byId<HTMLParagraphElement>("status"),
};

const state = {
  points: [] as Point[],
};

/** Any change to the points resets the run and redraws everything. */
function pointsChanged(): void {
  const totalSteps = Math.max(0, countDistinct(state.points) - 1);
  ui.stepInfo.value = `Step 0 / ${totalSteps}`;

  ui.pointCount.value = `Points: ${state.points.length}`;
  ui.pointList.textContent = state.points.map((p) => `${p.x} ${p.y}`).join("\n");
  ui.undo.disabled = state.points.length === 0;
  ui.clear.disabled = state.points.length === 0;
  ui.status.textContent = "";

  render(ctx, { sites: state.points });
}

/** Mouse position in canvas coordinates: integers, clamped to the canvas. */
function canvasPoint(event: MouseEvent): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / canvas.clientWidth;
  const scaleY = canvas.height / canvas.clientHeight;
  const x = (event.clientX - rect.left - canvas.clientLeft) * scaleX;
  const y = (event.clientY - rect.top - canvas.clientTop) * scaleY;
  return {
    x: Math.min(CANVAS_WIDTH, Math.max(0, Math.round(x))),
    y: Math.min(CANVAS_HEIGHT, Math.max(0, Math.round(y))),
  };
}

canvas.addEventListener("click", (event) => {
  const point = canvasPoint(event);
  if (state.points.some((p) => samePoint(p, point))) {
    return;
  }
  state.points.push(point);
  pointsChanged();
});

canvas.addEventListener("mousemove", (event) => {
  const p = canvasPoint(event);
  ui.mousePos.value = `Mouse: ${p.x}, ${p.y}`;
});

canvas.addEventListener("mouseleave", () => {
  ui.mousePos.value = "Mouse: -, -";
});

ui.undo.addEventListener("click", () => {
  state.points.pop();
  pointsChanged();
});

ui.clear.addEventListener("click", () => {
  state.points = [];
  pointsChanged();
});

pointsChanged();
