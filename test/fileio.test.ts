import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatOutputFile, parseInputFile, parseOutputFile } from "../src/fileio.ts";

const sample = (name: string) => readFileSync(new URL(`../samples/${name}`, import.meta.url), "utf8");

test("official input file: every case, stops at 0", () => {
  const input = parseInputFile(sample("io_samples.txt"));
  assert.equal(input.endedWithZero, true);
  assert.equal(input.cases.length, 20);
  assert.deepEqual(input.cases.map((c) => c.length), [2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 6, 12, 15]);
  assert.deepEqual(input.cases[0][0], { x: 289, y: 290 });
  assert.equal(input.cases[input.cases.length - 1].length, 15);
});

test("duplicate points in the input are kept", () => {
  const input = parseInputFile(sample("io_samples.txt"));
  assert.ok(input.cases.some((c) => c.length === 2 && c[0].x === c[1].x && c[0].y === c[1].y));
});

test("comments are skipped and junk after 0 is ignored", () => {
  const input = parseInputFile("# comment\r\n2\r\n1 2  \r\n3 4\r\n0\r\n9 9\r\n");
  assert.deepEqual(input.cases, [[{ x: 1, y: 2 }, { x: 3, y: 4 }]]);
  assert.equal(input.endedWithZero, true);
});

test("file without a final 0 still returns its cases", () => {
  const input = parseInputFile("1\n5 6\n");
  assert.deepEqual(input.cases, [[{ x: 5, y: 6 }]]);
  assert.equal(input.endedWithZero, false);
});

test("sample_a round-trips to the official text (order and orientation fixed)", () => {
  const parsed = parseOutputFile(sample("sample_a.txt"));
  assert.equal(parsed.points.length, 4);
  assert.equal(parsed.edges.length, 5);

  const scrambled = [...parsed.edges].reverse().map((e) => ({ a: e.b, b: e.a }));
  const expected = sample("sample_a.txt").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const actual = formatOutputFile([...parsed.points].reverse(), scrambled).trim().split("\r\n");
  assert.deepEqual(actual, expected);
});

test("rounding happens before orienting and sorting", () => {
  const text = formatOutputFile([], [
    { a: { x: 100.4, y: 50 }, b: { x: 99.6, y: 10 } },
    { a: { x: 3.2, y: 3.4 }, b: { x: 2.8, y: 2.6 } },
  ]);
  assert.equal(text, "E 100 10 100 50\r\n");
});

test("formatOutputFile clips rays to the canvas and drops edges outside it", () => {
  const text = formatOutputFile([], [
    { a: { x: 196, y: 271 }, b: { x: -9950791, y: 989551 } },
    { a: { x: -1e7, y: -50 }, b: { x: 1e7, y: -50 } },
  ]);
  assert.deepEqual(text.trim().split("\r\n"), ["E 0 290 196 271"]);
});
