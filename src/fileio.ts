import { type Point, type Segment, clipSegment } from "./geometry.ts";

type InputFile = {
  readonly cases: readonly (readonly Point[])[];
  readonly endedWithZero: boolean;
};

type OutputFile = {
  readonly points: readonly Point[];
  readonly edges: readonly Segment[];
};

function dataLines(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => line.split(/\s+/));
}

function parseInputFile(text: string): InputFile {
  const lines = dataLines(text);
  const cases: Point[][] = [];
  let i = 0;

  while (i < lines.length) {
    const n = Number(lines[i++][0]);
    if (n === 0) return { cases, endedWithZero: true };

    const points: Point[] = [];
    for (let k = 0; k < n && i < lines.length; k++, i++) {
      points.push({ x: Number(lines[i][0]), y: Number(lines[i][1]) });
    }
    cases.push(points);
  }
  return { cases, endedWithZero: false };
}

function compareLexical(a: readonly number[], b: readonly number[]): number {
  for (let k = 0; k < a.length; k++) {
    if (a[k] !== b[k]) return a[k] - b[k];
  }
  return 0;
}

function uniqueRows(rows: number[][]): number[][] {
  const sorted = [...rows].sort(compareLexical);
  return sorted.filter((row, k) => k === 0 || compareLexical(row, sorted[k - 1]) !== 0);
}

/**
 * Output format: "P x y" lines, then "E x1 y1 x2 y2" lines, both in lexical order.
 * Edges are clipped to the canvas, rounded, then oriented (x1 < x2, or x1 = x2 and y1 <= y2),
 * then sorted, so rounding can never break the order. Edges that round to a single point are dropped.
 */
function formatOutputFile(points: readonly Point[], edges: readonly Segment[]): string {
  const pointRows = uniqueRows(points.map((p) => [Math.round(p.x), Math.round(p.y)]));

  const edgeRows = uniqueRows(
    edges
      .map((e) => clipSegment(e))
      .filter((e) => e !== null)
      .map((e) => {
        const a = [Math.round(e.a.x), Math.round(e.a.y)];
        const b = [Math.round(e.b.x), Math.round(e.b.y)];
        return compareLexical(a, b) <= 0 ? [...a, ...b] : [...b, ...a];
      })
      .filter(([x1, y1, x2, y2]) => x1 !== x2 || y1 !== y2),
  );

  const lines = [
    ...pointRows.map((r) => `P ${r.join(" ")}`),
    ...edgeRows.map((r) => `E ${r.join(" ")}`),
  ];
  return lines.join("\r\n") + "\r\n";
}

function parseOutputFile(text: string): OutputFile {
  const points: Point[] = [];
  const edges: Segment[] = [];
  for (const [kind, ...values] of dataLines(text)) {
    const v = values.map(Number);
    if (kind === "P") points.push({ x: v[0], y: v[1] });
    if (kind === "E") edges.push({ a: { x: v[0], y: v[1] }, b: { x: v[2], y: v[3] } });
  }
  return { points, edges };
}

type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{
  name: string;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
}>;

async function saveTextFile(fileName: string, text: string): Promise<string | null> {
  const picker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
  if (picker) {
    try {
      const handle = await picker.call(window, {
        suggestedName: fileName,
        types: [{ description: "Text file", accept: { "text/plain": [".txt"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return handle.name;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return null; // user cancelled
      throw error;
    }
  }

  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return fileName;
}

export type { InputFile, OutputFile };
export { parseInputFile, formatOutputFile, parseOutputFile, saveTextFile };
