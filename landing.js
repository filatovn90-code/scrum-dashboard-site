import { getCurrentSession } from "./auth-helpers.js";
import { getLocale, onLocaleChange } from "./i18n.js";
import { productImages, getLocalizedAsset } from "./landing-assets.js";
import { appPath, signupPath } from "./route-paths.js";
import { mountPublicHeader } from "./navigation.js";

const FOUNDER_VIDEO = {
  src: "",
  poster: "",
  type: "video/mp4"
};

const FEEDBACK_EMAIL = "filatovn90@gmail.com";

const LANDING_COPY = {
  ru: {
    metaTitle: "MindPulse — планирование задач по энергии и нагрузке",
    metaDescription:
      "MindPulse помогает специалистам интеллектуального труда планировать работу с учетом энергии, когнитивной и эмоциональной нагрузки.",
    header: {
      login: "Войти",
      signup: "Начать бесплатно",
      openApp: "Открыть приложение"
    },
    hero: {
      kicker: "ИИ-платформа управления энергией для интеллектуальной работы",
      title: "MindPulse переосмысляет управление задачами",
      description:
        "Планируйте работу с учётом не только дедлайнов, но и вашей реальной энергии, когнитивной и эмоциональной нагрузки.",
      primaryGuest: "Попробовать бесплатно",
      primaryAuthed: "Открыть приложение",
      secondary: "Посмотреть, как работает",
      note: "Не медицинский сервис. Не ещё один список задач. Система для устойчивой продуктивности.",
      imageAlt: "Экран MindPulse с ежедневной оценкой состояния и готовностью дня"
    },
    how: {
      kicker: "Как работает",
      title: "Планируйте не только задачи, но и нагрузку",
      step1Title: "Оцените своё состояние",
      step1Body:
        "MindPulse учитывает энергию, восстановление и доступный ресурс на день.",
      step2Title: "Добавьте задачи",
      step2Body:
        "Для задачи достаточно указать её тип, когнитивную и эмоциональную нагрузку.",
      step3Title: "Получите реалистичный план",
      step3Body:
        "Система покажет перегрузку, объяснит её причины и предложит, что изменить.",
      imageAlt: "Экран недельного планирования MindPulse с пульсом дня и задачами"
    },
    value: {
      kicker: "Возможности",
      title:
        "Обычные трекеры спрашивают: «Что вы успели?» MindPulse спрашивает: «Какой ценой вам это далось?»",
      point1: "Замечает повторяющуюся перегрузку.",
      point2: "Объясняет, какие задачи создают основное давление.",
      point3:
        "Помогает скорректировать план до того, как накопится энергетический долг.",
      imageAlt: "Экран аналитики MindPulse с нагрузкой, состоянием и недельным обзором"
    },
    founder: {
      kicker: "Об основателе",
      title: "Почему я создаю MindPulse",
      body1:
        "Я много лет работаю с продуктовыми и IT-командами и вижу одну повторяющуюся проблему: традиционные инструменты помогают управлять задачами, но почти не учитывают состояние человека.",
      body2:
        "MindPulse появился как попытка соединить планирование, данные о нагрузке и психологически бережный подход к работе.",
      name: "Никита Филатов",
      role: "Создатель MindPulse",
      fallbackTitle: "Видео основателя скоро появится",
      fallbackBody:
        "Секция уже подготовлена под реальное видео: добавьте mp4 и постер в отдельную константу.",
      fallbackHint: "Рекомендуемый формат — горизонтальное видео 16:9",
      playLabel: "Воспроизвести видео об основателе",
      posterAlt: "Превью видео создателя MindPulse"
    },
    final: {
      kicker: "Готово к старту",
      title: "Работайте устойчиво, а не на пределе",
      body: "Начните с оценки своего пульса и соберите первый реалистичный план дня.",
      primaryGuest: "Создать бесплатный аккаунт",
      primaryAuthed: "Перейти в приложение",
      note: "Займёт около двух минут."
    },
    footer: {
      privacy: "Политика конфиденциальности",
      terms: "Условия использования"
    }
  },
  en: {
    metaTitle: "MindPulse — plan work around your energy and capacity",
    metaDescription:
      "MindPulse helps knowledge workers plan work around energy, cognitive load, and emotional load.",
    header: {
      login: "Log in",
      signup: "Start for free",
      openApp: "Open app"
    },
    hero: {
      kicker: "AI Energy OS for knowledge workers",
      title: "MindPulse rethinks task management",
      description:
        "Plan work around more than deadlines — around your real energy, cognitive load, and emotional pressure.",
      primaryGuest: "Try for free",
      primaryAuthed: "Open app",
      secondary: "See how it works",
      note: "Not a medical service. Not another task list. A system for sustainable productivity.",
      imageAlt: "MindPulse screen with daily state check-in and day readiness"
    },
    how: {
      kicker: "How it works",
      title: "Plan not only tasks, but the load behind them",
      step1Title: "Check your current state",
      step1Body:
        "MindPulse takes your energy, recovery, and available capacity for the day into account.",
      step2Title: "Add tasks",
      step2Body:
        "Each task only needs a type, a cognitive load, and an emotional load.",
      step3Title: "Get a realistic plan",
      step3Body:
        "The system shows overload early, explains the pressure, and suggests what to change.",
      imageAlt: "MindPulse weekly planning screen with day pulse and tasks"
    },
    value: {
      kicker: "Product value",
      title:
        "Regular trackers ask: “What got done?” MindPulse asks: “What did that cost you?”",
      point1: "Spots repeated overload patterns.",
      point2: "Shows which tasks create the main pressure.",
      point3: "Helps adjust the plan before energy debt starts to build up.",
      imageAlt: "MindPulse analytics screen with state, workload, and weekly review"
    },
    founder: {
      kicker: "About the founder",
      title: "Why I am building MindPulse",
      body1:
        "I have spent years working with product and IT teams and kept seeing the same issue: traditional tools manage tasks, but barely account for the human state behind the work.",
      body2:
        "MindPulse is my attempt to combine planning, workload awareness, and a psychologically sustainable way of working.",
      name: "Nikita Filatov",
      role: "Founder of MindPulse",
      fallbackTitle: "Founder video will be added here",
      fallbackBody:
        "This section is already prepared for a real video: just add an mp4 file and a poster path in one constant.",
      fallbackHint: "Recommended format — horizontal 16:9 video",
      playLabel: "Play founder video",
      posterAlt: "Preview of the MindPulse founder video"
    },
    final: {
      kicker: "Ready to start",
      title: "Work sustainably, not at the limit",
      body: "Start with your daily pulse and build your first realistic day plan.",
      primaryGuest: "Create a free account",
      primaryAuthed: "Go to app",
      note: "Takes about two minutes."
    },
    footer: {
      privacy: "Privacy policy",
      terms: "Terms of use"
    }
  }
};

async function initLanding() {
  await mountPublicHeader();
  applyLandingCopy();
  renderFounderVideo();
  syncLocalizedImages();
  bindStickyHeader();
  await syncAuthCtas();
  syncMeta();
  syncCurrentYear();

  onLocaleChange(async () => {
    await mountPublicHeader();
    applyLandingCopy();
    renderFounderVideo();
    syncLocalizedImages();
    bindStickyHeader();
    await syncAuthCtas();
    syncMeta();
    syncCurrentYear();
  });
}

function getCopy(locale = getLocale()) {
  return LANDING_COPY[locale] || LANDING_COPY.ru;
}

function applyLandingCopy() {
  const locale = getLocale();
  const copy = getCopy(locale);

  document.documentElement.lang = locale;

  document.querySelectorAll("[data-landing]").forEach((node) => {
    const path = node.getAttribute("data-landing");
    const value = readCopy(copy, path);
    if (typeof value === "string") {
      node.textContent = value;
    }
  });

  document.querySelectorAll("[data-landing-alt]").forEach((node) => {
    const path = node.getAttribute("data-landing-alt");
    const value = readCopy(copy, path);
    if (typeof value === "string") {
      node.setAttribute("alt", value);
    }
  });
}

async function syncAuthCtas() {
  const session = await getCurrentSession().catch(() => null);
  const isAuthed = Boolean(session?.user);
  const copy = getCopy();

  document.querySelectorAll("[data-auth-cta], [data-auth-cta-secondary]").forEach((cta) => {
    if (!(cta instanceof HTMLAnchorElement)) {
      return;
    }

    cta.classList.remove("is-pending");
    if (isAuthed) {
      cta.href = appPath();
      cta.textContent = cta.hasAttribute("data-auth-cta-secondary")
        ? copy.final.primaryAuthed
        : copy.hero.primaryAuthed;
    } else {
      cta.href = signupPath();
      cta.textContent = cta.hasAttribute("data-auth-cta-secondary")
        ? copy.final.primaryGuest
        : copy.hero.primaryGuest;
    }
  });
}

function bindStickyHeader() {
  const header = document.querySelector(".public-header");
  if (!header || header.dataset.stickyBound === "true") {
    return;
  }

  const syncState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  header.dataset.stickyBound = "true";
  syncState();
  window.addEventListener("scroll", syncState, { passive: true });
}

function syncMeta() {
  const copy = getCopy();
  document.title = copy.metaTitle;
  setMetaContent('meta[name="description"]', copy.metaDescription);
  setMetaContent('meta[property="og:title"]', copy.metaTitle);
  setMetaContent('meta[property="og:description"]', copy.metaDescription);
}

function syncLocalizedImages() {
  const locale = getLocale();

  document.querySelectorAll("[data-localized-image]").forEach((node) => {
    if (!(node instanceof HTMLImageElement)) {
      return;
    }

    const imageKey = node.dataset.localizedImage;
    const imageSet = productImages[imageKey];
    const nextSrc = getLocalizedAsset(imageSet, locale);
    if (nextSrc) {
      node.src = nextSrc;
    }
  });
}

function renderFounderVideo() {
  const mount = document.querySelector("[data-founder-video]");
  if (!mount) {
    return;
  }

  const copy = getCopy().founder;

  if (FOUNDER_VIDEO.src) {
    mount.innerHTML = `
      <div class="landing-founder-media-frame">
        <video
          class="landing-founder-video"
          controls
          preload="metadata"
          poster="${escapeHtml(FOUNDER_VIDEO.poster || "")}"
          aria-label="${escapeHtml(copy.playLabel)}"
        >
          <source src="${escapeHtml(FOUNDER_VIDEO.src)}" type="${escapeHtml(FOUNDER_VIDEO.type)}">
        </video>
      </div>
    `;
    return;
  }

  const poster = FOUNDER_VIDEO.poster
    ? `<img class="landing-founder-poster" src="${escapeHtml(FOUNDER_VIDEO.poster)}" alt="${escapeHtml(copy.posterAlt)}">`
    : `<div class="landing-founder-fallback-visual" aria-hidden="true">
         <span>MindPulse</span>
       </div>`;

  mount.innerHTML = `
    <div class="landing-founder-media-frame is-placeholder">
      ${poster}
      <button class="landing-founder-play" type="button" aria-label="${escapeHtml(copy.playLabel)}" disabled>
        <span class="landing-founder-play-icon" aria-hidden="true"></span>
      </button>
      <div class="landing-founder-fallback">
        <strong>${escapeHtml(copy.fallbackTitle)}</strong>
        <p>${escapeHtml(copy.fallbackBody)}</p>
        <span>${escapeHtml(copy.fallbackHint)}</span>
      </div>
    </div>
  `;
}

function syncCurrentYear() {
  const year = new Date().getFullYear();
  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(year);
  });
}

function readCopy(copy, path) {
  return String(path || "")
    .split(".")
    .reduce((value, key) => (value && typeof value === "object" ? value[key] : undefined), copy);
}

function setMetaContent(selector, content) {
  const node = document.querySelector(selector);
  if (node) {
    node.setAttribute("content", content);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

initLanding();
