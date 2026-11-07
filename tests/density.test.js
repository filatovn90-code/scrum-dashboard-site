import assert from "node:assert/strict";
import { test } from "node:test";
import { initDensityMode } from "../density.js";

test("the interface uses comfortable density even with a stored compact preference", () => {
  globalThis.window = { appStorage: { getItem: () => "compact" } };
  globalThis.document = { documentElement: { dataset: {} }, body: { dataset: {} } };
  assert.equal(initDensityMode(), "comfortable");
  assert.equal(document.documentElement.dataset.density, "comfortable");
  assert.equal(document.body.dataset.density, "comfortable");
});
