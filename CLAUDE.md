# Voronoi diagram (divide and conquer): NSYSU Algorithms term project

Browser app: HTML + TypeScript + esbuild. The spec translation is in `project_english.md`. The phase plans are in `docs/phase-*.md` (git-ignored).

**If you are a Sonnet model, be concise:** short answers, no preamble or recap, no restating the question.
**If you are a Sonnet model, also be concise and minimal code when coding**.

## Commands
- `npm run build`: runs `tsc` (type check only) and esbuild, which bundles `src/main.ts` into `dist/app.js`
- `npm test`: `node --test`, which runs `test/**/*.test.ts` natively (Node 26, no transpile step)
- `npm run watch`: esbuild in watch mode

## Workflow rules
- Work one phase at a time. **Ask before any design decision.** Don't go ahead silently.
- **Verify only with `npm run build` and `npm test`.** No browser tests, screenshots or preview servers: the user tests the UI.
- **Never commit** unless the user asks.
- Before designing around data, open the real files in `samples/`. `io_samples.txt` holds many cases and ends with `0`.

## Code style
- No TypeScript classes: use plain types and functions.
- Modules split by responsibility, not one function per file.
- Exports grouped at the bottom: `export type { … }` then `export { … }`.
- Imports always include `.ts` (`allowImportingTsExtensions`, `verbatimModuleSyntax`, `erasableSyntaxOnly`).
- Short comments, only where needed.
- Deterministic: no randomness, and every sort has a full tie-break.

## Modules
| File | Role |
|---|---|
| `main.ts` | DOM wiring and app state (the only DOM code, apart from `saveTextFile`). Calls `solve` when points change; Next / Step by N / Run / Reset only move `state.step` through the log. No Prev |
| `geometry.ts` | Point, Segment, EPS, canvas size (600×600, which is also the clip box) |
| `voronoi.ts` | (user writes) The whole algorithm, bottom-up loop: each site starts as its own group, neighbouring groups merge in pairs each round. `solve(points)` returns `{ edges, log }`: final edges for the output file, and one picture (`Step = { lines }`) per step for the stepper. Edges are never moved, only deleted and born |
| `renderer.ts` | Draws a plain `Scene` (sites and colored `Line`s) on the canvas |
| `fileio.ts` | Parses input files (cases, stops at `0`), writes and reads output files (`P` then `E` lines, sorted lexically, CRLF) |

## Algorithm notes
- Hulls are merged through the bridges, not read from the Voronoi diagram (a deviation from the slides; mention it in the report).
- The upper bridge is not simply the highest point of each half: walk both hulls until no point lies outside the line. Canvas y points down.
- The merge looks only at the edges of the current two sites, to stay O(n).
- Output formatting: round, then orient, then drop zero-length edges, then sort. Rays are clipped to 600×600.

## Deadlines (2026)
Preliminary demo Nov 12 · code submission Nov 13, 23:59 · final check Nov 30–Dec 4 · report Dec 13.
