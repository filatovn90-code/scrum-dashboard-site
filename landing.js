import { getCurrentSession } from "./auth-helpers.js";
import { applyTranslations, getLocale, onLocaleChange, t } from "./i18n.js";
import { productImages, getLocalizedAsset } from "./landing-assets.js";
import { appPath, signupPath } from "./route-paths.js";
import { mountPublicHeader } from "./navigation.js";

const metaMap = {
  title: {
    ru: "MindPulse — планирование работы с учетом энергии и нагрузки",
    en: "MindPulse — Plan work around your energy and capacity"
  },
  description: {
    ru: "MindPulse помогает knowledge workers составлять реалистичный план с учетом энергии, фокуса, стресса, когнитивной и эмоциональной нагрузки.",
    en: "MindPulse helps knowledge workers create realistic plans based on energy, focus, stress, cognitive load, and emotional load."
  }
};

async function initLanding() {
  await mountPublicHeader();
  applyTranslations(document);
  syncLocalizedImages();
  bindFaqAccordions();
  bindStickyHeader();
  await syncAuthCtas();
  syncMeta();
  onLocaleChange(() => {
    applyTranslations(document);
    syncLocalizedImages();
    bindFaqAccordions();
    syncMeta();
  });
}

async function syncAuthCtas() {
  const session = await getCurrentSession().catch(() => null);
  const isAuthed = Boolean(session?.user);
  const ctas = document.querySelectorAll("[data-auth-cta]");

  ctas.forEach((cta) => {
    cta.classList.remove("is-pending");
    if (!(cta instanceof HTMLAnchorElement)) {
      return;
    }

    if (isAuthed) {
      cta.href = appPath();
      cta.textContent = t("public.heroPrimaryCtaAuthed");
    } else {
      cta.href = signupPath();
      cta.textContent = t("public.heroPrimaryCtaGuest");
    }
  });
}

function bindFaqAccordions() {
  document.querySelectorAll("[data-faq-trigger]").forEach((summary) => {
    const details = summary.closest("details");
    if (!details) {
      return;
    }
    summary.setAttribute("aria-expanded", details.open ? "true" : "false");
  });
}

function bindStickyHeader() {
  const header = document.querySelector(".public-header");
  if (!header) {
    return;
  }

  const syncState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  syncState();
  window.addEventListener("scroll", syncState, { passive: true });
}

function syncMeta() {
  const locale = getLocale();
  const title = metaMap.title[locale] || metaMap.title.ru;
  const description = metaMap.description[locale] || metaMap.description.ru;

  document.title = title;
  setMetaContent('meta[name="description"]', description);
  setMetaContent('meta[property="og:title"]', title);
  setMetaContent('meta[property="og:description"]', description);
}

function syncLocalizedImages() {
  const locale = getLocale();
  const nodes = document.querySelectorAll("[data-localized-image]");

  nodes.forEach((node) => {
    if (!(node instanceof HTMLImageElement)) {
      return;
    }

    const imageKey = node.dataset.localizedImage;
    const altKey = node.dataset.altKey;
    const images = productImages[imageKey];
    const nextSrc = getLocalizedAsset(images, locale);

    if (!images || !nextSrc) {
      return;
    }

    if (!images[locale]) {
      console.warn(`[landing] Missing localized image for "${imageKey}" and locale "${locale}". Falling back to RU asset.`);
    }

    if (node.getAttribute("src") !== nextSrc) {
      node.setAttribute("src", nextSrc);
    }

    if (altKey) {
      node.setAttribute("alt", t(altKey, {}, locale));
    }
  });
}

function setMetaContent(selector, content) {
  const node = document.querySelector(selector);
  if (node) {
    node.setAttribute("content", content);
  }
}

initLanding();
