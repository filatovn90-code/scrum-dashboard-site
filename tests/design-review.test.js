import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("profile schema includes the locale used by profile settings", () => {
  const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /alter table public\.profiles add column if not exists locale text/i);
});

test("empty analytics do not report an overload risk", async () => {
  const { getOverloadRisk } = await import("../analytics-risk.js");
  assert.equal(getOverloadRisk(null, null), "unknown");
  assert.equal(getOverloadRisk(4, 8), "risk");
  assert.equal(getOverloadRisk(5, 4), "high");
  assert.equal(getOverloadRisk(7, 3), "normal");
});

test("the application shell uses one column on narrow screens", () => {
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css, /@media\s*\(max-width:\s*960px\)\s*\{\s*body\.app-has-shell\s+\.app-shell\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});
