import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("remote session is read from the authenticated Supabase client before any cached profile", () => {
  const source = readFileSync(new URL("../supabase-client.js", import.meta.url), "utf8");
  const session = source.slice(source.indexOf("export async function getCurrentSession"), source.indexOf("export async function waitForSessionPersistence"));
  assert.doesNotMatch(session, /return cachedRemoteSession/);
  assert.match(session, /session\?\.access_token/);
});

test("board mutation failures do not replace the board", () => {
  const source = readFileSync(new URL("../backlog.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /backlogBoard\.textContent = error\.message/);
});
