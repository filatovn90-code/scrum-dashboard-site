import assert from "node:assert/strict";
import { test } from "node:test";
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
