import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from "./supabase-public-config.js";

let remoteSupabasePromise;
let localSupabasePromise;

export const LEGACY_AUTH_KEY = "scrum-dashboard-auth-user";

const LOCAL_AUTH_ACCOUNTS_KEY = "focusflow-local-auth-accounts";
const LOCAL_AUTH_SESSION_KEY = "focusflow-local-auth-session";
const REMOTE_AUTH_SESSION_KEY = "focusflow-remote-auth-session";
const LOCAL_DB_KEY = "focusflow-local-db";
const DEFAULT_LOCALE = "ru";

function isFilePreview() {
  return window.location.protocol === "file:";
}

export function canUseLocalAuthFallback() {
  return isFilePreview();
}

function getSupabaseStorage() {
  return {
    getItem(key) {
      return window.appStorage?.getItem(key) ?? null;
    },
    setItem(key, value) {
      window.appStorage?.setItem(key, value);
    },
    removeItem(key) {
      window.appStorage?.removeItem(key);
    }
  };
}

function readJsonStorage(key, fallback) {
  const raw = window.appStorage?.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  window.appStorage?.setItem(key, JSON.stringify(value));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function createLocalId(prefix = "item") {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(String(value || ""));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

function readLocalAccounts() {
  return readJsonStorage(LOCAL_AUTH_ACCOUNTS_KEY, []);
}

function writeLocalAccounts(accounts) {
  writeJsonStorage(LOCAL_AUTH_ACCOUNTS_KEY, accounts);
}

function getLocalSessionObject() {
  return readJsonStorage(LOCAL_AUTH_SESSION_KEY, null);
}

function setLocalSession(user) {
  writeJsonStorage(LOCAL_AUTH_SESSION_KEY, {
    access_token: `local-${user.id}`,
    refresh_token: `local-refresh-${user.id}`,
    provider_token: null,
    token_type: "bearer",
    user
  });
}

function clearLocalSession() {
  window.appStorage?.removeItem(LOCAL_AUTH_SESSION_KEY);
}

function getLocalUser() {
  return getLocalSessionObject()?.user || null;
}

function getRemoteSessionObject() {
  return readJsonStorage(REMOTE_AUTH_SESSION_KEY, null);
}

function setRemoteSession(session) {
  if (!session?.user) {
    return;
  }

  writeJsonStorage(REMOTE_AUTH_SESSION_KEY, session);
}

function clearRemoteSession() {
  window.appStorage?.removeItem(REMOTE_AUTH_SESSION_KEY);
}

function getRemoteCachedUser() {
  return getRemoteSessionObject()?.user || null;
}

export function cacheRemoteSession(session) {
  setRemoteSession(session);
}

function readLocalDb() {
  const db = readJsonStorage(LOCAL_DB_KEY, {});
  return {
    profiles: Array.isArray(db.profiles) ? db.profiles : [],
    projects: Array.isArray(db.projects) ? db.projects : [],
    tasks: Array.isArray(db.tasks) ? db.tasks : [],
    daily_checkins: Array.isArray(db.daily_checkins) ? db.daily_checkins : []
  };
}

function writeLocalDb(db) {
  writeJsonStorage(LOCAL_DB_KEY, db);
}

function ensureLocalProfileRecord(user) {
  const db = readLocalDb();
  const existingIndex = db.profiles.findIndex((item) => item.id === user.id);
  const timestamp = nowIso();
  const payload = {
    id: user.id,
    email: user.email || null,
    full_name: db.profiles[existingIndex]?.full_name || null,
    locale: db.profiles[existingIndex]?.locale || DEFAULT_LOCALE,
    timezone: db.profiles[existingIndex]?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    created_at: db.profiles[existingIndex]?.created_at || timestamp,
    updated_at: timestamp
  };

  if (existingIndex >= 0) {
    db.profiles[existingIndex] = payload;
  } else {
    db.profiles.push(payload);
  }

  writeLocalDb(db);
  return payload;
}

function projectFields(row, fields) {
  if (!fields || fields === "*") {
    return clone(row);
  }

  const requested = String(fields)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!requested.length || requested.includes("*")) {
    return clone(row);
  }

  const projected = {};
  requested.forEach((field) => {
    const fieldName = field.split(/\s+/)[0];
    projected[fieldName] = row[fieldName];
  });
  return projected;
}

function applyFilters(rows, filters) {
  return rows.filter((row) => filters.every((filter) => {
    const value = row[filter.column];

    if (filter.type === "eq") {
      return value === filter.value;
    }

    if (filter.type === "gte") {
      return value >= filter.value;
    }

    if (filter.type === "lte") {
      return value <= filter.value;
    }

    if (filter.type === "is") {
      return value === filter.value;
    }

    return true;
  }));
}

class LocalQueryBuilder {
  constructor(table) {
    this.table = table;
    this.mode = "select";
    this.filters = [];
    this.selectedFields = "*";
    this.ordering = null;
    this.rowLimit = null;
    this.singleMode = null;
    this.payload = null;
    this.upsertConflict = null;
    this.shouldReturnSelection = false;
  }

  select(fields = "*") {
    this.selectedFields = fields;
    this.shouldReturnSelection = true;
    return this;
  }

  insert(payload) {
    this.mode = "insert";
    this.payload = Array.isArray(payload) ? payload : [payload];
    return this;
  }

  upsert(payload, options = {}) {
    this.mode = "upsert";
    this.payload = Array.isArray(payload) ? payload : [payload];
    this.upsertConflict = options.onConflict || null;
    return this;
  }

  update(payload) {
    this.mode = "update";
    this.payload = payload || {};
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  eq(column, value) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  gte(column, value) {
    this.filters.push({ type: "gte", column, value });
    return this;
  }

  lte(column, value) {
    this.filters.push({ type: "lte", column, value });
    return this;
  }

  is(column, value) {
    this.filters.push({ type: "is", column, value });
    return this;
  }

  order(column, options = {}) {
    this.ordering = { column, ascending: options.ascending !== false };
    return this;
  }

  limit(count) {
    this.rowLimit = Number(count);
    return this;
  }

  maybeSingle() {
    this.singleMode = "maybe";
    return this;
  }

  single() {
    this.singleMode = "single";
    return this;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    const db = readLocalDb();
    const rows = Array.isArray(db[this.table]) ? db[this.table] : [];

    if (this.mode === "select") {
      let result = applyFilters(rows, this.filters).map((row) => projectFields(row, this.selectedFields));

      if (this.ordering) {
        const { column, ascending } = this.ordering;
        result = result.sort((left, right) => {
          if (left[column] === right[column]) {
            return 0;
          }

          if (left[column] == null) return ascending ? 1 : -1;
          if (right[column] == null) return ascending ? -1 : 1;
          return left[column] > right[column] ? (ascending ? 1 : -1) : (ascending ? -1 : 1);
        });
      }

      if (Number.isFinite(this.rowLimit)) {
        result = result.slice(0, this.rowLimit);
      }

      if (this.singleMode === "maybe") {
        return { data: result[0] || null, error: null };
      }

      if (this.singleMode === "single") {
        if (result.length !== 1) {
          return { data: null, error: new Error("Expected exactly one row.") };
        }

        return { data: result[0], error: null };
      }

      return { data: result, error: null };
    }

    if (this.mode === "insert") {
      const inserted = this.payload.map((item) => ({
        id: item.id || createLocalId(this.table.slice(0, -1) || "row"),
        created_at: item.created_at || nowIso(),
        updated_at: item.updated_at || nowIso(),
        ...clone(item)
      }));

      db[this.table] = rows.concat(inserted);
      writeLocalDb(db);

      const data = this.shouldReturnSelection
        ? inserted.map((row) => projectFields(row, this.selectedFields))
        : inserted;

      return this.finishMutationResult(data);
    }

    if (this.mode === "upsert") {
      const conflictColumns = String(this.upsertConflict || "id")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const upserted = [];

      this.payload.forEach((item) => {
        const nextRow = {
          id: item.id || createLocalId(this.table.slice(0, -1) || "row"),
          created_at: item.created_at || nowIso(),
          updated_at: item.updated_at || nowIso(),
          ...clone(item)
        };

        const existingIndex = rows.findIndex((row) => conflictColumns.every((column) => row[column] === nextRow[column]));

        if (existingIndex >= 0) {
          rows[existingIndex] = {
            ...rows[existingIndex],
            ...nextRow,
            created_at: rows[existingIndex].created_at || nextRow.created_at
          };
          upserted.push(rows[existingIndex]);
        } else {
          rows.push(nextRow);
          upserted.push(nextRow);
        }
      });

      db[this.table] = rows;
      writeLocalDb(db);

      const data = this.shouldReturnSelection
        ? upserted.map((row) => projectFields(row, this.selectedFields))
        : upserted;

      return this.finishMutationResult(data);
    }

    if (this.mode === "update") {
      const updated = [];
      db[this.table] = rows.map((row) => {
        const matches = applyFilters([row], this.filters).length > 0;
        if (!matches) {
          return row;
        }

        const nextRow = {
          ...row,
          ...clone(this.payload),
          updated_at: this.payload?.updated_at || nowIso()
        };
        updated.push(nextRow);
        return nextRow;
      });

      writeLocalDb(db);
      const data = this.shouldReturnSelection
        ? updated.map((row) => projectFields(row, this.selectedFields))
        : updated;

      return this.finishMutationResult(data);
    }

    if (this.mode === "delete") {
      const kept = [];
      const removed = [];

      rows.forEach((row) => {
        const matches = applyFilters([row], this.filters).length > 0;
        if (matches) {
          removed.push(row);
        } else {
          kept.push(row);
        }
      });

      db[this.table] = kept;
      writeLocalDb(db);

      const data = this.shouldReturnSelection
        ? removed.map((row) => projectFields(row, this.selectedFields))
        : removed;

      return this.finishMutationResult(data);
    }

    return { data: null, error: null };
  }

  finishMutationResult(rows) {
    if (this.singleMode === "maybe") {
      return { data: rows[0] || null, error: null };
    }

    if (this.singleMode === "single") {
      if (rows.length !== 1) {
        return { data: null, error: new Error("Expected exactly one row.") };
      }

      return { data: rows[0], error: null };
    }

    return { data: rows, error: null };
  }
}

function createLocalSupabaseClient() {
  return {
    auth: {
      async getUser() {
        return { data: { user: getLocalUser() }, error: null };
      },
      async getSession() {
        return { data: { session: getLocalSessionObject() }, error: null };
      },
      async signOut() {
        clearLocalSession();
        return { error: null };
      },
      async signUp({ email, password }) {
        const result = await createLocalAccount(email, password);
        return { data: result, error: null };
      },
      async signInWithPassword({ email, password }) {
        const result = await signInLocalAccount(email, password);
        return { data: result, error: null };
      }
    },
    from(table) {
      return new LocalQueryBuilder(table);
    }
  };
}

async function getRemoteSupabase() {
  if (!remoteSupabasePromise) {
    remoteSupabasePromise = createRemoteBrowserClient();
  }

  return remoteSupabasePromise;
}

async function getLocalSupabase() {
  if (!localSupabasePromise) {
    localSupabasePromise = Promise.resolve(createLocalSupabaseClient());
  }

  return localSupabasePromise;
}

export async function getSupabase() {
  if (canUseLocalAuthFallback() && getLocalUser()) {
    return getLocalSupabase();
  }

  return getRemoteSupabase();
}

async function createRemoteBrowserClient() {
  let url = PUBLIC_SUPABASE_URL;
  let anonKey = PUBLIC_SUPABASE_ANON_KEY;

  if (!isFilePreview()) {
    try {
      const response = await fetch("/api/config/supabase");
      const data = await response.json();

      if (response.ok && data.ok) {
        url = data.url;
        anonKey = data.anonKey;
      }
    } catch {
      // Fallback to public config.
    }
  }

  if (!url || !anonKey) {
    throw new Error("Не удалось получить настройки Supabase.");
  }

  return createClient(url, anonKey, {
    auth: {
      storage: getSupabaseStorage(),
      storageKey: "focusflow-supabase-auth",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

export async function createLocalAccount(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const accounts = readLocalAccounts();

  if (accounts.some((item) => item.email === normalizedEmail)) {
    throw new Error("Такой email уже зарегистрирован локально. Попробуйте войти.");
  }

  const user = {
    id: createLocalId("user"),
    email: normalizedEmail,
    aud: "authenticated",
    app_metadata: { provider: "local" },
    user_metadata: { auth_mode: "local" }
  };

  accounts.push({
    id: user.id,
    email: normalizedEmail,
    password_hash: await sha256(password),
    created_at: nowIso()
  });
  writeLocalAccounts(accounts);

  ensureLocalProfileRecord(user);
  setLocalSession(user);
  rememberLegacyAuthUser(user);
  return { user, session: getLocalSessionObject() };
}

export async function signInLocalAccount(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const accounts = readLocalAccounts();
  const account = accounts.find((item) => item.email === normalizedEmail);

  if (!account) {
    throw new Error("INVALID_LOGIN_CREDENTIALS");
  }

  const passwordHash = await sha256(password);
  if (account.password_hash !== passwordHash) {
    throw new Error("INVALID_LOGIN_CREDENTIALS");
  }

  const user = {
    id: account.id,
    email: account.email,
    aud: "authenticated",
    app_metadata: { provider: "local" },
    user_metadata: { auth_mode: "local" }
  };

  ensureLocalProfileRecord(user);
  setLocalSession(user);
  rememberLegacyAuthUser(user);
  return { user, session: getLocalSessionObject() };
}

export function isLocalAuthUser(user = getLocalUser()) {
  return Boolean(user?.app_metadata?.provider === "local" || user?.user_metadata?.auth_mode === "local");
}

export async function getCurrentUser() {
  if (canUseLocalAuthFallback()) {
    const localUser = getLocalUser();
    if (localUser) {
      return localUser;
    }
  }

  const cachedRemoteUser = getRemoteCachedUser();
  if (cachedRemoteUser) {
    return cachedRemoteUser;
  }

  try {
    const supabase = await getRemoteSupabase();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session?.user) {
        setRemoteSession(session);
      } else {
        setRemoteSession({ user });
      }
    }

    return user || null;
  } catch {
    return null;
  }
}

export async function getCurrentSession() {
  if (canUseLocalAuthFallback()) {
    const localSession = getLocalSessionObject();
    if (localSession?.user) {
      return localSession;
    }
  }

  const cachedRemoteSession = getRemoteSessionObject();
  if (cachedRemoteSession?.user) {
    return cachedRemoteSession;
  }

  try {
    const supabase = await getRemoteSupabase();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session?.user) {
      setRemoteSession(session);
    }

    return session || null;
  } catch {
    return null;
  }
}

export async function waitForSessionPersistence({ attempts = 12, delayMs = 150 } = {}) {
  if (canUseLocalAuthFallback()) {
    const localSession = getLocalSessionObject();
    if (localSession?.user) {
      return localSession;
    }
  }

  const cachedRemoteSession = getRemoteSessionObject();
  if (cachedRemoteSession?.user) {
    return cachedRemoteSession;
  }

  try {
    const supabase = await getRemoteSupabase();

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session?.user) {
        setRemoteSession(session);
        return session;
      }

      if (attempt < attempts - 1) {
        await wait(delayMs);
      }
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const userOnlySession = { user };
      setRemoteSession(userOnlySession);
      return userOnlySession;
    }
  } catch {
    // Ignore and let the caller decide what to do next.
  }

  return null;
}

export async function ensureProfile() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  if (isLocalAuthUser(user)) {
    return ensureLocalProfileRecord(user);
  }

  const supabase = await getRemoteSupabase();
  const payload = {
    id: user.id,
    email: user.email || null,
    locale: DEFAULT_LOCALE,
    updated_at: nowIso()
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw error;
  }

  return payload;
}

export function rememberLegacyAuthUser(user) {
  if (!user) {
    return;
  }

  window.appStorage?.setItem(LEGACY_AUTH_KEY, user.email || user.id || "");
}

export function clearLegacyAuthUser() {
  window.appStorage?.removeItem(LEGACY_AUTH_KEY);
}

export async function signOutCurrentUser() {
  clearLocalSession();
  clearRemoteSession();

  try {
    const supabase = await getRemoteSupabase();
    await supabase.auth.signOut();
  } catch {
    // Ignore remote sign-out failures for local mode.
  }

  clearLegacyAuthUser();
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  if (isLocalAuthUser(user)) {
    const db = readLocalDb();
    return db.profiles.find((item) => item.id === user.id) || ensureLocalProfileRecord(user);
  }

  const supabase = await getRemoteSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, locale, timezone, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveCurrentProfile(updates) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Пользователь не авторизован.");
  }

  if (isLocalAuthUser(user)) {
    const db = readLocalDb();
    const existingIndex = db.profiles.findIndex((item) => item.id === user.id);
    const nextProfile = {
      ...(existingIndex >= 0 ? db.profiles[existingIndex] : ensureLocalProfileRecord(user)),
      id: user.id,
      email: user.email || null,
      full_name: updates.full_name ?? (existingIndex >= 0 ? db.profiles[existingIndex]?.full_name : null),
      locale: updates.locale ?? (existingIndex >= 0 ? db.profiles[existingIndex]?.locale : DEFAULT_LOCALE),
      timezone: updates.timezone ?? (existingIndex >= 0 ? db.profiles[existingIndex]?.timezone : null),
      updated_at: nowIso()
    };

    if (existingIndex >= 0) {
      db.profiles[existingIndex] = nextProfile;
    } else {
      db.profiles.push(nextProfile);
    }

    writeLocalDb(db);
    return nextProfile;
  }

  const supabase = await getRemoteSupabase();
  const payload = {
    id: user.id,
    email: user.email || null,
    full_name: updates.full_name ?? null,
    locale: updates.locale ?? DEFAULT_LOCALE,
    timezone: updates.timezone ?? null,
    updated_at: nowIso()
  };

  let data;
  let error;

  ({
    data,
    error
  } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id, email, full_name, locale, timezone, created_at, updated_at")
    .single());

  if (error && String(error.message || "").toLowerCase().includes("locale")) {
    const fallbackPayload = {
      id: user.id,
      email: user.email || null,
      full_name: updates.full_name ?? null,
      timezone: updates.timezone ?? null,
      updated_at: nowIso()
    };

    ({
      data,
      error
    } = await supabase
      .from("profiles")
      .upsert(fallbackPayload, { onConflict: "id" })
      .select("id, email, full_name, timezone, created_at, updated_at")
      .single());

    if (!error && data) {
      data.locale = updates.locale ?? DEFAULT_LOCALE;
    }
  }

  if (error) {
    throw error;
  }

  return data;
}

export async function saveProfileLocale(locale) {
  const normalizedLocale = String(locale || DEFAULT_LOCALE).toLowerCase() === "en" ? "en" : "ru";
  return saveCurrentProfile({ locale: normalizedLocale });
}
