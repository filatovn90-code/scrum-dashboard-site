import { getCurrentUser, getSupabase } from "./auth-helpers.js";

export const FREE_PLAN = "free";
export const PRO_PLAN = "pro";
export const PREMIUM_PLAN = "premium";

const PLAN_KEY_PREFIX = "mindpulse-plan";

function keyForUser(userId) {
  return `${PLAN_KEY_PREFIX}:${userId || "guest"}`;
}

function isLocalUser(user) {
  return Boolean(user?.app_metadata?.provider === "local" || user?.user_metadata?.auth_mode === "local");
}

function normalizePlan(plan) {
  const normalized = String(plan || FREE_PLAN).trim().toLowerCase();
  if (normalized === PREMIUM_PLAN) return PREMIUM_PLAN;
  if (normalized === PRO_PLAN) return PRO_PLAN;
  return FREE_PLAN;
}

export async function getCurrentPlan() {
  const user = await getCurrentUser().catch(() => null);
  const override = normalizePlan(window.appStorage?.getItem(keyForUser(user?.id)));

  if (!user) {
    return override;
  }

  if (isLocalUser(user)) {
    return override;
  }

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (String(error.message || "").toLowerCase().includes("subscriptions")) {
        return override;
      }
      throw error;
    }

    if (!data) {
      return override;
    }

    return normalizePlan(data.plan);
  } catch {
    return override;
  }
}

export function isProPlan(plan) {
  const normalized = normalizePlan(plan);
  return normalized === PRO_PLAN || normalized === PREMIUM_PLAN;
}

export function planLabel(plan) {
  const normalized = normalizePlan(plan);
  if (normalized === PREMIUM_PLAN) return "Premium";
  if (normalized === PRO_PLAN) return "Pro";
  return "Free";
}

export function buildLockedMarkup({
  kicker = "Pro feature",
  title = "Доступно в Pro",
  copy = "Эта возможность появится после подключения платного тарифа.",
  ctaLabel = "Смотреть тарифы",
  href = "pricing.html"
} = {}) {
  return `
    <div class="pricing-lock-card">
      <p class="section-kicker">${escapeHtml(kicker)}</p>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(copy)}</p>
      <a class="form-action-button pricing-lock-link" href="${escapeHtml(href)}">${escapeHtml(ctaLabel)}</a>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
