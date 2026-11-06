import assert from "node:assert/strict";
import { test } from "node:test";

test("feedback context omits preview sharing tokens and query parameters", async () => {
  const context = await import("../feedback-context.js").catch(() => ({}));
  assert.equal(typeof context.safeFeedbackPageUrl, "function", "safeFeedbackPageUrl is not implemented");
  assert.equal(
    context.safeFeedbackPageUrl("https://preview.example.com/today?_vercel_share=secret#section"),
    "https://preview.example.com/today"
  );
});
