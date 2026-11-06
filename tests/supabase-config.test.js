import assert from "node:assert/strict";
import { test } from "node:test";
import { loadHostedSupabaseConfig } from "../supabase-config.js";
import { resolveSupabaseConfig } from "../api/config/supabase.js";
import { resolveDatabaseUrl } from "../lib/db-config.js";

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

test("server-side Supabase routes reject production in preview", () => {
  assert.throws(() => resolveSupabaseConfig({
    environment: "preview", url: productionUrl, anonKey: "public-key"
  }), /production/);
});

test("health database accepts only the matching staging project in preview", () => {
  const stagingDb = "postgresql://postgres.pltvmpnrvguofhyolvps:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";
  const productionDb = "postgresql://postgres.fzgphisavsmtmvserson:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";
  assert.equal(resolveDatabaseUrl({ databaseUrl: stagingDb, supabaseUrl: stagingUrl, environment: "preview" }), stagingDb);
  assert.throws(() => resolveDatabaseUrl({ databaseUrl: productionDb, supabaseUrl: stagingUrl, environment: "preview" }), /matching Supabase project/);
  assert.throws(() => resolveDatabaseUrl({ databaseUrl: productionDb, supabaseUrl: productionUrl, environment: "preview" }), /production/);
});

test("health database refuses an unknown connection string in preview", () => {
  assert.throws(() => resolveDatabaseUrl({
    databaseUrl: "postgresql://postgres:password@other.example.com/postgres",
    supabaseUrl: stagingUrl,
    environment: "preview"
  }), /matching Supabase project/);
  assert.throws(() => resolveDatabaseUrl({
    databaseUrl: "postgresql://postgres.pltvmpnrvguofhyolvps:password@other.example.com/postgres",
    supabaseUrl: stagingUrl,
    environment: "preview"
  }), /matching Supabase project/);
  assert.throws(() => resolveDatabaseUrl({
    databaseUrl: "postgresql://postgres.pltvmpnrvguofhyolvps:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
    environment: "preview"
  }), /Supabase URL/);
});
