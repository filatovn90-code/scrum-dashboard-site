import { getCurrentProfile, getCurrentSession, signOutCurrentUser } from "./auth-helpers.js";
import { ensureFeedbackUi } from "./feedback.js";
import { saveProfileLocale } from "./supabase-client.js";
import { applyTranslations, getLocale, initI18n, localeLabels, onLocaleChange, setLocale, t } from "./i18n.js";
import {
  analyticsPath,
  appPath,
  backlogPath,
  billingPath,
  featuresPath,
  helpPath,
  howItWorksPath,
  landingPath,
  loginPath,
  pricingPath,
  profilePath,
  settingsPath,
  signupPath,
  todayPath
} from "./route-paths.js";
initI18n();
onLocaleChange(() => {
  applyTranslations(document);
});

function getPublicLinks() {
  return [
    { key: "features", label: t("navigation.features"), href: featuresPath() },
    { key: "how-it-works", label: t("navigation.howItWorks"), href: howItWorksPath() },
    { key: "pricing", label: t("navigation.pricing"), href: pricingPath() }
  ];
}

function getAppLinks() {
  return [
    { key: "pulse", label: t("navigation.pulse"), href: todayPath(), icon: "pulse" },
    { key: "plan", label: t("navigation.plan"), href: backlogPath(), icon: "plan" },
    { key: "analytics", label: t("navigation.analytics"), href: analyticsPath(), icon: "analytics" }
  ];
}

function getUserMenuLinks() {
  return [
    { key: "profile", label: t("navigation.profile"), href: profilePath(), icon: "profile" },
    { key: "settings", label: t("navigation.settings"), href: settingsPath(), icon: "settings" },
    { key: "billing", label: t("navigation.billing"), href: billingPath(), icon: "billing" },
    { key: "help", label: t("navigation.help"), href: helpPath(), icon: "help" }
  ];
}

export async function mountPublicHeader() {
  ensureFeedbackUi();
  const mount = document.querySelector("[data-public-header]");
  if (!mount) {
    return;
  }

  const active = document.body.dataset.publicActive || "";
  const session = await getCurrentSession().catch(() => null);
  const profile = session?.user ? await getCurrentProfile().catch(() => null) : null;

  mount.className = "site-header public-header";
  mount.innerHTML = `
    <a class="public-brand-link" href="${landingPath()}" aria-label="${t("brand.name")}">
      <strong class="public-brand-wordmark">${t("brand.name")}</strong>
    </a>
    <button
      class="public-menu-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="public-nav-panel"
      data-public-menu-toggle
      aria-label="${t("navigation.menu")}"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
    <div class="public-header-inner" id="public-nav-panel" data-public-menu-panel>
      <nav class="public-nav" aria-label="${t("navigation.publicNav")}">
        ${getPublicLinks().map((link) => renderPublicLink(link, active)).join("")}
      </nav>
      <div class="public-actions">
        ${session?.user ? renderPublicAuthedActions(profile) : renderPublicGuestActions(active)}
        ${renderLanguageSwitcher({ compact: true, menuId: "public", profileSync: Boolean(session?.user) })}
      </div>
    </div>
  `;
  bindLanguageMenus(mount, Boolean(session?.user));
  bindPublicHeader(mount);
}

export async function mountAppShell() {
  ensureFeedbackUi();
  const sidebarMount = document.querySelector("[data-app-sidebar]");
  const headerMount = document.querySelector("[data-app-page-header]");
  if (!sidebarMount || !headerMount) {
    return;
  }

  const active = document.body.dataset.appActive || "";
  const title = document.body.dataset.appTitle || "";
  const subtitle = document.body.dataset.appSubtitle || "";
  const session = await getCurrentSession().catch(() => null);
  const profile = session?.user ? await getCurrentProfile().catch(() => null) : null;

  document.body.classList.add("app-has-shell");

  sidebarMount.className = "app-sidebar";
  sidebarMount.innerHTML = `
    <div class="sidebar-brand">
      <a class="sidebar-logo-link" href="${todayPath()}" aria-label="${t("navigation.pulse")} ${t("brand.name")}">
        <span class="sidebar-logo">${t("brand.kicker")}</span>
        <span class="sidebar-caption">${t("brand.title")}</span>
      </a>
    </div>

    <nav class="app-nav" aria-label="${t("navigation.appNav")}">
      ${getAppLinks().map((link) => renderAppLink(link, active)).join("")}
    </nav>

    <div class="app-sidebar-secondary">
      <button class="app-nav-link is-utility app-feedback-trigger" type="button" data-feedback-open data-feedback-source="app-sidebar">
        <span class="app-nav-icon" aria-hidden="true">${icon("feedback")}</span>
        <span>${t("navigation.feedback")}</span>
      </button>
    </div>

    <div class="app-user-box">
      ${renderUserMenu(profile, session?.user, { compact: false, menuId: "sidebar" })}
    </div>
  `;

  headerMount.className = "app-page-header";
  headerMount.innerHTML = `
    <div class="app-page-header-copy">
      <p class="section-kicker">${t("brand.kicker")}</p>
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="app-page-subtitle">${escapeHtml(subtitle)}</p>` : ""}
    </div>
    <div class="app-page-header-actions">
      ${renderUserMenu(profile, session?.user, { compact: true, menuId: "header" })}
    </div>
  `;

  ensureMobileNav(active);
  bindAppShell(sidebarMount, headerMount);
  bindLanguageMenus(document, Boolean(session?.user));
}

function renderPublicLink(link, active) {
  const current = link.key === active ? " is-active" : "";
  return `<a class="nav-link public-nav-link${current}" href="${link.href}">${link.label}</a>`;
}

function renderPublicGuestActions(active) {
  return `
    <a class="ghost-button public-action-link${active === "login" ? " is-active" : ""}" href="${loginPath()}">${t("navigation.login")}</a>
    <a class="form-action-button public-action-link${active === "signup" ? " is-active" : ""}" href="${signupPath()}">${t("navigation.startFree")}</a>
  `;
}

function renderPublicAuthedActions(profile) {
  return `
    <a class="form-action-button public-action-link" href="${appPath()}">${t("navigation.openApp")}</a>
    ${renderUserMenu(profile, null, { compact: true, menuId: "public-user" })}
  `;
}

function renderAppLink(link, active) {
  const current = link.key === active ? " is-active" : "";
  return `
    <a class="app-nav-link${current}" href="${link.href}" ${link.key === active ? 'aria-current="page"' : ""}>
      <span class="app-nav-icon" aria-hidden="true">${icon(link.icon)}</span>
      <span>${link.label}</span>
    </a>
  `;
}

function renderUserMenuLink(link) {
  return `
    <a class="app-user-menu-link" href="${link.href}">
      <span class="app-user-menu-icon" aria-hidden="true">${icon(link.icon)}</span>
      <span>${link.label}</span>
    </a>
  `;
}

function renderFeedbackMenuButton(source = "user-menu") {
  return `
    <button class="app-user-menu-link" type="button" data-feedback-open data-feedback-source="${source}">
      <span class="app-user-menu-icon" aria-hidden="true">${icon("feedback")}</span>
      <span>${t("navigation.feedback")}</span>
    </button>
  `;
}

function renderLanguageSwitcher({ compact = false, menuId = "locale", profileSync = false } = {}) {
  const locale = getLocale();
  return `
    <div class="locale-switcher${compact ? " is-compact" : ""}" data-locale-root data-profile-sync="${profileSync ? "true" : "false"}">
      <button
        class="locale-toggle"
        type="button"
        aria-expanded="false"
        aria-haspopup="menu"
        aria-controls="locale-menu-${menuId}"
        data-locale-toggle
        aria-label="${t("common.language")}"
      >
        <span>${locale.toUpperCase()}</span>
        <span class="app-user-chevron" aria-hidden="true">${icon("chevron")}</span>
      </button>
      <div class="locale-dropdown" id="locale-menu-${menuId}" data-locale-dropdown hidden>
        ${supportedLocaleButtons(locale)}
      </div>
    </div>
  `;
}

function supportedLocaleButtons(activeLocale) {
  return Object.entries(localeLabels).map(([locale, label]) => `
    <button
      class="locale-option${locale === activeLocale ? " is-active" : ""}"
      type="button"
      data-locale-option="${locale}"
      aria-pressed="${locale === activeLocale ? "true" : "false"}"
    >
      <span>${label}</span>
      ${locale === activeLocale ? `<span class="locale-check" aria-hidden="true">✓</span>` : ""}
    </button>
  `).join("");
}

function renderUserMenu(profile, user, { compact = false, menuId = "user" } = {}) {
  const classes = compact ? "app-user-box is-compact" : "app-user-box";
  const toggleLabel = t("navigation.userMenu");

  return `
    <div class="${classes}" data-user-menu-root>
      <button
        class="app-user-toggle"
        data-user-menu-toggle
        type="button"
        aria-expanded="false"
        aria-haspopup="menu"
        aria-controls="app-user-menu-${menuId}"
        aria-label="${toggleLabel}"
      >
        <span class="app-user-avatar">${getInitials(profile, user)}</span>
        ${compact ? "" : `
          <span class="app-user-meta">
            <strong>${escapeHtml(getDisplayName(profile, user))}</strong>
            <span>${escapeHtml(getSecondaryLine(profile, user))}</span>
          </span>
        `}
        <span class="app-user-chevron" aria-hidden="true">${icon("chevron")}</span>
      </button>
      <div class="app-user-dropdown" id="app-user-menu-${menuId}" data-user-menu-dropdown hidden>
        ${getUserMenuLinks().map((link) => renderUserMenuLink(link)).join("")}
        ${renderFeedbackMenuButton(`user-menu-${menuId}`)}
        <div class="app-user-divider"></div>
        <div class="app-user-language-row">
          <span class="app-user-language-label">${t("common.language")}</span>
          ${renderLanguageSwitcher({ menuId: `app-${menuId}`, profileSync: Boolean(user) })}
        </div>
        <div class="app-user-divider"></div>
        <button class="app-user-menu-link is-danger" data-user-menu-logout type="button">
          <span class="app-user-menu-icon" aria-hidden="true">${icon("logout")}</span>
          <span>${t("navigation.logout")}</span>
        </button>
      </div>
    </div>
  `;
}

function ensureMobileNav(active) {
  const existing = document.querySelector("[data-app-mobile-nav]");
  if (existing) {
    existing.remove();
  }

  const nav = document.createElement("nav");
  nav.className = "app-mobile-nav";
  nav.setAttribute("data-app-mobile-nav", "");
  nav.setAttribute("aria-label", t("navigation.appNav"));
  nav.innerHTML = getAppLinks().map((link) => {
    const current = link.key === active ? " is-active" : "";
    return `
      <a class="app-mobile-nav-link${current}" href="${link.href}" ${link.key === active ? 'aria-current="page"' : ""}>
        <span class="app-mobile-nav-icon" aria-hidden="true">${icon(link.icon)}</span>
        <span>${link.label}</span>
      </a>
    `;
  }).join("");

  document.body.appendChild(nav);
}

function bindAppShell(...mounts) {
  const roots = mounts
    .flatMap((mount) => Array.from(mount.querySelectorAll("[data-user-menu-root]")))
    .filter(Boolean);

  const closeOthers = (exceptRoot = null) => {
    roots.forEach((root) => {
      if (exceptRoot && root === exceptRoot) {
        return;
      }

      const toggle = root.querySelector("[data-user-menu-toggle]");
      const dropdown = root.querySelector("[data-user-menu-dropdown]");
      if (!toggle || !dropdown) {
        return;
      }

      toggle.setAttribute("aria-expanded", "false");
      dropdown.hidden = true;
    });
  };

  roots.forEach((root) => {
    const toggle = root.querySelector("[data-user-menu-toggle]");
    const dropdown = root.querySelector("[data-user-menu-dropdown]");
    const logoutButton = root.querySelector("[data-user-menu-logout]");

    toggle?.addEventListener("click", () => {
      if (!dropdown) {
        return;
      }

      const expanded = toggle.getAttribute("aria-expanded") === "true";
      closeOthers(root);
      toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
      dropdown.hidden = expanded;
    });

    logoutButton?.addEventListener("click", async () => {
      await signOutCurrentUser().catch(() => null);
      window.location.replace(landingPath());
    });
  });

  document.addEventListener("click", (event) => {
    const clickedInsideMenu = roots.some((root) => root.contains(event.target));
    if (!clickedInsideMenu) {
      closeOthers();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeOthers();
    }
  });
}

function bindPublicHeader(root) {
  const toggle = root.querySelector("[data-public-menu-toggle]");
  const panel = root.querySelector("[data-public-menu-panel]");
  if (!toggle || !panel) {
    return;
  }

  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    root.classList.remove("is-open");
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
    root.classList.toggle("is-open", !expanded);
  });

  root.querySelectorAll(".public-nav-link, .public-action-link").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("click", (event) => {
    if (!root.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

function bindLanguageMenus(root = document, shouldSyncProfile = false) {
  const localeRoots = Array.from(root.querySelectorAll("[data-locale-root]"));

  localeRoots.forEach((localeRoot) => {
    const toggle = localeRoot.querySelector("[data-locale-toggle]");
    const dropdown = localeRoot.querySelector("[data-locale-dropdown]");
    if (!toggle || !dropdown) {
      return;
    }

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      closeAllLanguageMenus(root, localeRoot);
      toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
      dropdown.hidden = expanded;
    });

    dropdown.querySelectorAll("[data-locale-option]").forEach((button) => {
      button.addEventListener("click", async () => {
        const locale = button.dataset.localeOption || "ru";
        setLocale(locale);
        if (shouldSyncProfile || localeRoot.dataset.profileSync === "true") {
          await saveProfileLocale(locale).catch(() => null);
        }
        closeAllLanguageMenus(root);
        if (document.querySelector("[data-public-header]")) {
          mountPublicHeader();
        }
        if (document.querySelector("[data-app-sidebar]") && document.querySelector("[data-app-page-header]")) {
          mountAppShell();
        }
      });
    });
  });

  document.addEventListener("click", (event) => {
    const inside = localeRoots.some((localeRoot) => localeRoot.contains(event.target));
    if (!inside) {
      closeAllLanguageMenus(root);
    }
  });
}

function closeAllLanguageMenus(root = document, except = null) {
  Array.from(root.querySelectorAll("[data-locale-root]")).forEach((localeRoot) => {
    if (except && localeRoot === except) {
      return;
    }
    const toggle = localeRoot.querySelector("[data-locale-toggle]");
    const dropdown = localeRoot.querySelector("[data-locale-dropdown]");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }
    if (dropdown) {
      dropdown.hidden = true;
    }
  });
}

function getDisplayName(profile, user) {
  return profile?.full_name?.trim() || user?.email?.split("@")[0] || t("common.user");
}

function getSecondaryLine(profile, user) {
  return profile?.email || user?.email || t("common.appRhythm");
}

function getInitials(profile, user) {
  const raw = getDisplayName(profile, user);
  const parts = raw.split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) {
    return "MP";
  }
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function icon(name) {
  const icons = {
    pulse: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-5 4 10 2-5h6"/><path d="M3 12c0-5 4-9 9-9s9 4 9 9-4 9-9 9-9-4-9-9Z" opacity=".24"/></svg>`,
    plan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M8 14h3M8 18h8M15 14h1"/></svg>`,
    analytics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20v-11"/><path d="M2 20h20"/></svg>`,
    feedback: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10h10"/><path d="M7 14h7"/><path d="M21 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-5 3V11.5A7.5 7.5 0 0 1 10.5 4H13.5A7.5 7.5 0 0 1 21 11.5Z"/></svg>`,
    help: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 1 1 5.8 1c-.4.9-1.2 1.3-2 1.8-.7.4-1.4 1-1.4 2.2"/><path d="M12 17h.01"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3"/><path d="M12 18v3"/><path d="m4.9 4.9 2.1 2.1"/><path d="m17 17 2.1 2.1"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="m4.9 19.1 2.1-2.1"/><path d="m17 7 2.1-2.1"/><circle cx="12" cy="12" r="3.5"/></svg>`,
    profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>`,
    billing: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/><path d="M7 15h3"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>`,
    chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`
  };

  return icons[name] || icons.pulse;
}
