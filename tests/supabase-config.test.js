import assert from "node:assert/strict";
import { test } from "node:test";
import { loadHostedSupabaseConfig } from "../supabase-config.js";
import { resolveSupabaseConfig } from "../api/config/supabase.js";

const stagingUrl = "https://pltvmpnrvguofhyolvps.supabase.co";
const productionUrl = "https://fzgphisavsmtmvserson.supabase.co";

test("hosted client accepts only a valid same-origin config response", async () => {
  const config = await loadHostedSupabaseConfig(async (path) => {
    assert.equal(path, "/api/config/supabase");
    return { ok: true, json: async () => ({ ok: true, url: stagingUrl, anonKey: "public-test-key" }) };
  });
  assert.deepEqual(config, { url: stagingUrl, anonKey: "public-test-key" });
});

test("hosted client fails closed when config endpoint fails", async () => {
  await assert.rejects(
    loadHostedSupabaseConfig(async () => ({ ok: false, status: 500 })),
    /Supabase configuration unavailable/
  );
});

test("hosted client rejects malformed config instead of falling back", async () => {
  await assert.rejects(
    loadHostedSupabaseConfig(async () => ({ ok: true, json: async () => ({ ok: true, url: productionUrl }) })),
    /Supabase configuration unavailable/
  );
});

test("server refuses missing configuration", () => {
  assert.throws(() => resolveSupabaseConfig({ environment: "preview" }), /missing/);
});

test("server refuses production database in preview", () => {
  assert.throws(() => resolveSupabaseConfig({
    environment: "preview", url: productionUrl, anonKey: "public-key"
  }), /production/);
});

test("server serves production database only in production", () => {
  assert.deepEqual(resolveSupabaseConfig({
    environment: "production", url: productionUrl, anonKey: "public-key"
  }), { url: productionUrl, anonKey: "public-key" });
});
