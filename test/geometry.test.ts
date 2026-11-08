import { test } from "node:test";
import assert from "node:assert/strict";
import { countDistinct, samePoint, clipSegment } from "../src/geometry.ts";

test("samePoint compares coordinates", () => {
  assert.equal(samePoint({ x: 1, y: 2 }, { x: 1, y: 2 }), true);
  assert.equal(samePoint({ x: 1, y: 2 }, { x: 2, y: 1 }), false);
});

test("countDistinct counts duplicates once", () => {
  assert.equal(countDistinct([]), 0);
  assert.equal(countDistinct([{ x: 200, y: 200 }, { x: 200, y: 200 }, { x: 1, y: 1 }]), 2);
});

test("clipSegment cuts a huge line to the canvas, with or without margin", () => {
  const huge = { a: { x: -1e7, y: 300 }, b: { x: 1e7, y: 300 } };
  assert.deepEqual(clipSegment(huge), { a: { x: 0, y: 300 }, b: { x: 600, y: 300 } });
  assert.deepEqual(clipSegment(huge, 10), { a: { x: -10, y: 300 }, b: { x: 610, y: 300 } });
});

test("clipSegment keeps inside segments and drops outside ones", () => {
  const inside = { a: { x: 100, y: 100 }, b: { x: 200, y: 300 } };
  assert.deepEqual(clipSegment(inside), inside);
  assert.equal(clipSegment({ a: { x: -1e7, y: -50 }, b: { x: 1e7, y: -50 } }), null);
});

test("clipSegment keeps the vertex end of a ray", () => {
  const clipped = clipSegment({ a: { x: 196, y: 271 }, b: { x: -9950791, y: 989551 } });
  assert.ok(clipped);
  assert.deepEqual(clipped.a, { x: 196, y: 271 });
  assert.ok(Math.abs(clipped.b.x) < 1e-6);
});
