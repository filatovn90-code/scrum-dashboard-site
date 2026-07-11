import {
  clearLegacyAuthUser,
  ensureProfile,
  getCurrentProfile,
  getCurrentSession,
  getCurrentUser,
  getSupabase,
  rememberLegacyAuthUser,
  saveCurrentProfile,
  signOutCurrentUser
} from "./supabase-client.js";
import { resolvePostAuthPath } from "./onboarding-helpers.js";

export {
  clearLegacyAuthUser,
  ensureProfile,
  getCurrentProfile,
  getCurrentSession,
  getCurrentUser,
  getSupabase,
  rememberLegacyAuthUser,
  saveCurrentProfile,
  signOutCurrentUser
};

export async function requireAuth({ redirectTo = "login.html" } = {}) {
  const session = await getCurrentSession();
  if (!session?.user) {
    window.location.replace(redirectTo);
    return null;
  }

  rememberLegacyAuthUser(session.user);
  await ensureProfile().catch(() => null);
  return session.user;
}

export async function redirectIfAuthenticated({ redirectTo = "app.html" } = {}) {
  const session = await getCurrentSession();
  if (session?.user) {
    rememberLegacyAuthUser(session.user);
    window.location.replace(resolvePostAuthPath(session.user) || redirectTo);
    return true;
  }

  return false;
}
