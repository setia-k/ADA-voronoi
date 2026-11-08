import { test } from "node:test";
import assert from "node:assert/strict";
import { countDistinct, samePoint } from "../src/geometry.ts";

test("samePoint compares coordinates", () => {
  assert.equal(samePoint({ x: 1, y: 2 }, { x: 1, y: 2 }), true);
  assert.equal(samePoint({ x: 1, y: 2 }, { x: 2, y: 1 }), false);
});

test("countDistinct counts duplicates once", () => {
  assert.equal(countDistinct([]), 0);
  assert.equal(countDistinct([{ x: 200, y: 200 }, { x: 200, y: 200 }, { x: 1, y: 1 }]), 2);
});
