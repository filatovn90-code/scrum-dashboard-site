import assert from "node:assert/strict";
import { test } from "node:test";
import { Readable } from "node:stream";
import * as feedbackApi from "../api/feedback.js";

const saveFeedbackRecord = (...args) => {
  assert.equal(typeof feedbackApi.saveFeedbackRecord, "function", "saveFeedbackRecord is not implemented");
  return feedbackApi.saveFeedbackRecord(...args);
};

test("guest feedback is saved without requiring a read policy", async () => {
  let inserted;
  const supabase = {
    from(table) {
      assert.equal(table, "feedback");
      return {
        async insert(row) {
          inserted = row;
          return { error: null };
        }
      };
    }
  };

  const id = await saveFeedbackRecord(supabase, {
    type: "bug", message: "The save button did not work", locale: "en"
  }, null, { createId: () => "test-feedback-id", emailConfigured: false });

  assert.equal(id, "test-feedback-id");
  assert.equal(inserted.user_id, null);
  assert.equal(inserted.email_delivery_status, "skipped");
  assert.equal(inserted.message, "The save button did not work");
});

test("feedback save reports a database failure", async () => {
  const supabase = {
    from() {
      return { async insert() { return { error: new Error("Database unavailable") }; } };
    }
  };

  await assert.rejects(saveFeedbackRecord(supabase, {
    type: "suggestion", message: "A useful suggestion", locale: "ru"
  }, "user-1", { createId: () => "test-feedback-id", emailConfigured: false }), /Database unavailable/);
});

test("guest rate limiting does not depend on a supplied email", () => {
  assert.equal(typeof feedbackApi.getFeedbackRateLimitKey, "function", "getFeedbackRateLimitKey is not implemented");
  const req = { headers: { "x-forwarded-for": "203.0.113.8" }, socket: {} };
  assert.equal(feedbackApi.getFeedbackRateLimitKey(req, "first@example.com", null), "ip:203.0.113.8");
  assert.equal(feedbackApi.getFeedbackRateLimitKey(req, "second@example.com", null), "ip:203.0.113.8");
  assert.equal(feedbackApi.getFeedbackRateLimitKey(req, "second@example.com", "user-1"), "user:user-1");
});

test("rate limiter keeps only active keys and enforces the preview window", () => {
  assert.equal(typeof feedbackApi.enforceFeedbackRateLimit, "function", "enforceFeedbackRateLimit is not implemented");
  feedbackApi.resetFeedbackRateLimitForTests();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    feedbackApi.enforceFeedbackRateLimit("ip:203.0.113.9");
  }
  assert.throws(
    () => feedbackApi.enforceFeedbackRateLimit("ip:203.0.113.9"),
    (error) => error.statusCode === 429
  );
  feedbackApi.resetFeedbackRateLimitForTests();
});

test("invalid authenticated feedback does not fall back to a guest", async () => {
  assert.equal(typeof feedbackApi.getFeedbackAuthContext, "function", "getFeedbackAuthContext is not implemented");
  const req = { headers: { authorization: "Bearer expired-token" } };
  await assert.rejects(
    feedbackApi.getFeedbackAuthContext(req, async () => { throw new Error("Invalid token"); }),
    /Invalid token/
  );
});

test("feedback submission requires a signed-in user", async () => {
  await assert.rejects(
    feedbackApi.getFeedbackAuthContext({ headers: {} }),
    (error) => error.statusCode === 401
  );
});

test("the shared database limit is returned as HTTP 429", async () => {
  const supabase = { from: () => ({ async insert() {
    return { error: { code: "P0001", message: "feedback_rate_limit" } };
  } }) };
  await assert.rejects(
    saveFeedbackRecord(supabase, { type: "bug", message: "An issue with the page", locale: "en" }, "user-1"),
    (error) => error.statusCode === 429
  );
});

test("oversized JSON feedback is rejected before buffering the whole body", async () => {
  assert.equal(typeof feedbackApi.parseRequest, "function");
  const req = Readable.from([Buffer.alloc(65537, "x")]);
  req.headers = { "content-type": "application/json" };
  await assert.rejects(feedbackApi.parseRequest(req), (error) => error.statusCode === 413);
});

test("email-enabled feedback records an attempt without requiring update permission", async () => {
  let inserted;
  const supabase = { from: () => ({ async insert(row) { inserted = row; return { error: null }; } }) };
  await saveFeedbackRecord(supabase, { type: "bug", message: "An issue with the page", locale: "en" }, null, {
    createId: () => "test-id", emailConfigured: true
  });
  assert.equal(inserted.email_delivery_status, "attempted");
});
