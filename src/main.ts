import { type Point, type Segment, CANVAS_WIDTH, CANVAS_HEIGHT, samePoint } from "./geometry.ts";
import { type InputFile, parseInputFile, formatOutputFile, parseOutputFile, saveTextFile } from "./fileio.ts";
import { type Line, render } from "./renderer.ts";
import { type Step, distinct, solveVoronoi } from "./voronoi.ts";

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
  loadInput: byId<HTMLButtonElement>("btnLoadInput"),
  fileInput: byId<HTMLInputElement>("fileInput"),
  caseSelect: byId<HTMLSelectElement>("caseSelect"),
  nextCase: byId<HTMLButtonElement>("btnNextCase"),
  clearInput: byId<HTMLButtonElement>("btnClearInput"),
  caseInfo: byId<HTMLOutputElement>("caseInfo"),
  next: byId<HTMLButtonElement>("btnNext"),
  stepCount: byId<HTMLInputElement>("stepCount"),
  stepBy: byId<HTMLButtonElement>("btnStepN"),
  run: byId<HTMLButtonElement>("btnRun"),
  reset: byId<HTMLButtonElement>("btnReset"),
  stepInfo: byId<HTMLOutputElement>("stepInfo"),
  saveOutput: byId<HTMLButtonElement>("btnSaveOutput"),
  loadOutput: byId<HTMLButtonElement>("btnLoadOutput"),
  fileOutput: byId<HTMLInputElement>("fileOutput"),
  undo: byId<HTMLButtonElement>("btnUndo"),
  clear: byId<HTMLButtonElement>("btnClear"),
  mousePos: byId<HTMLOutputElement>("mousePos"),
  pointCount: byId<HTMLOutputElement>("pointCount"),
  pointList: byId<HTMLPreElement>("pointList"),
  status: byId<HTMLParagraphElement>("status"),
};

type Source = "manual" | "case" | "editedCase" | "outputFile";

const state = {
  points: [] as Point[],
  edges: [] as Segment[],
  log: [] as Step[],
  step: 0, // 0 = only the sites, k = log[k - 1]
  source: "manual" as Source,
  input: null as InputFile | null,
  caseIndex: -1,
};

/** Draws the current step and updates the step buttons. */
function draw(): void {
  const fromOutputFile = state.source === "outputFile";
  const last = state.log.length;
  let lines: readonly Line[] = [];
  if (fromOutputFile) lines = state.edges.map((e) => ({ ...e, color: "#000" }));
  else if (state.step > 0) lines = state.log[state.step - 1].lines;

  render(ctx, { sites: state.points, lines });
  ui.stepInfo.value = `Step ${state.step} / ${last}`;
  for (const button of [ui.next, ui.stepBy, ui.run]) {
    button.disabled = fromOutputFile || state.step === last;
  }
  ui.reset.disabled = fromOutputFile || state.step === 0;
}

function goToStep(step: number): void {
  state.step = Math.min(state.log.length, Math.max(0, step));
  draw();
}

/** Any change to the points reruns the algorithm and goes back to step 0. */
function pointsChanged(loadedEdges: Segment[] = []): void {
  const result = state.source === "outputFile" ? { edges: loadedEdges, log: [] } : solveVoronoi(distinct(state.points));
  state.edges = result.edges;
  state.log = result.log;
  state.step = 0;

  ui.pointCount.value = `Points: ${state.points.length}`;
  ui.pointList.textContent = state.points.map((p) => `${p.x} ${p.y}`).join("\n");
  ui.undo.disabled = state.points.length === 0;
  ui.clear.disabled = state.points.length === 0;
  ui.status.textContent = "";

  draw();
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

// ---- Cases ----

function caseLabel(index: number, edited: boolean): string {
  const size = state.input?.cases[index].length ?? 0;
  return `Case ${index + 1} · ${edited ? "edited" : `${size} pts`}`;
}

function fillCaseSelect(input: InputFile): void {
  ui.caseSelect.replaceChildren(
    ...input.cases.map((_, i) => new Option(caseLabel(i, false), String(i))),
  );
  ui.caseSelect.disabled = input.cases.length === 0;
}

/** Restores the previous case's label and shows case `index`, untouched, from the file. */
function showCase(index: number): void {
  const input = state.input;
  if (!input) return;
  if (state.caseIndex >= 0 && state.caseIndex < input.cases.length) {
    ui.caseSelect.options[state.caseIndex].text = caseLabel(state.caseIndex, false);
  }
  state.caseIndex = index;
  state.source = "case";
  state.points = [...input.cases[index]];
  ui.caseSelect.value = String(index);
  ui.caseInfo.value = "";
  ui.nextCase.disabled = false;
  pointsChanged();
}

/** Forgets the loaded input file; the dropdown and Next case go back to their empty state. */
function clearInputFile(): void {
  state.input = null;
  state.caseIndex = -1;
  ui.caseSelect.replaceChildren(new Option("No file loaded"));
  ui.caseSelect.disabled = true;
  ui.nextCase.disabled = true;
  ui.clearInput.disabled = true;
  ui.caseInfo.value = "";
}

/** Called before any hand edit: a loaded case becomes "edited", an output file becomes manual points. */
function markEdited(): void {
  if (state.source === "case") {
    state.source = "editedCase";
    ui.caseSelect.options[state.caseIndex].text = caseLabel(state.caseIndex, true);
  } else if (state.source === "outputFile") {
    state.source = "manual";
  }
}

function stopFileTest(message: string): void {
  ui.nextCase.disabled = true;
  ui.caseInfo.value = message;
}

function saveFileName(): string {
  if (state.source !== "case" && state.source !== "editedCase") return "output.txt";
  const number = String(state.caseIndex + 1).padStart(2, "0");
  return `case-${number}${state.source === "editedCase" ? "-edited" : ""}.txt`;
}

/** Reads the file chosen in a hidden file input, then clears it so the same file can be chosen again. */
async function readChosenFile(input: HTMLInputElement): Promise<string | null> {
  const file = input.files?.[0];
  input.value = "";
  return file ? file.text() : null;
}

// ---- Canvas ----

canvas.addEventListener("click", (event) => {
  const point = canvasPoint(event);
  if (state.points.some((p) => samePoint(p, point))) return;
  markEdited();
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

// ---- Input file ----

ui.loadInput.addEventListener("click", () => ui.fileInput.click());

ui.fileInput.addEventListener("change", async () => {
  const text = await readChosenFile(ui.fileInput);
  if (text === null) return;

  const input = parseInputFile(text);
  state.input = input;
  state.caseIndex = -1;
  ui.clearInput.disabled = false;
  fillCaseSelect(input);

  if (input.cases.length === 0) {
    ui.caseSelect.replaceChildren(new Option("No cases in file"));
    state.source = "manual";
    state.points = [];
    pointsChanged();
    stopFileTest(input.endedWithZero ? "讀入點數為零，檔案測試停止" : "No cases in file");
    return;
  }
  showCase(0);
});

ui.caseSelect.addEventListener("change", () => {
  showCase(Number(ui.caseSelect.value));
});

ui.nextCase.addEventListener("click", () => {
  const input = state.input;
  if (!input) return;
  if (state.caseIndex + 1 < input.cases.length) {
    showCase(state.caseIndex + 1);
  } else {
    stopFileTest(input.endedWithZero ? "讀入點數為零，檔案測試停止" : "No more cases in file");
  }
});

ui.clearInput.addEventListener("click", () => {
  clearInputFile();
  state.source = "manual";
  state.points = [];
  pointsChanged();
});

/** The spec's "press a key for the next case". Controls keep their own Enter behaviour. */
document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.target instanceof Element && event.target.closest("button, input, select, textarea")) return;
  if (ui.nextCase.disabled) return;
  event.preventDefault();
  ui.nextCase.click();
});

// ---- Steps ----

ui.next.addEventListener("click", () => goToStep(state.step + 1));
ui.stepBy.addEventListener("click", () => goToStep(state.step + Math.max(1, Number(ui.stepCount.value) || 1)));
ui.run.addEventListener("click", () => goToStep(state.log.length));
ui.reset.addEventListener("click", () => goToStep(0));

// ---- Output file ----

ui.saveOutput.addEventListener("click", async () => {
  try {
    const savedAs = await saveTextFile(saveFileName(), formatOutputFile(state.points, state.edges));
    if (savedAs) ui.status.textContent = `Saved ${savedAs}`;
  } catch (error) {
    ui.status.textContent = `Could not save: ${error instanceof Error ? error.message : error}`;
  }
});

ui.loadOutput.addEventListener("click", () => ui.fileOutput.click());

ui.fileOutput.addEventListener("change", async () => {
  const text = await readChosenFile(ui.fileOutput);
  if (text === null) return;

  const output = parseOutputFile(text);
  clearInputFile();
  state.source = "outputFile";
  state.points = [...output.points];
  pointsChanged([...output.edges]);
});

// ---- Edit ----

ui.undo.addEventListener("click", () => {
  markEdited();
  state.points.pop();
  pointsChanged();
});

ui.clear.addEventListener("click", () => {
  markEdited();
  state.points = [];
  pointsChanged();
});

clearInputFile();
pointsChanged();
