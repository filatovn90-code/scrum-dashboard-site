import { getCurrentProfile, getCurrentSession } from "./auth-helpers.js";
import { getLocale, onLocaleChange, t } from "./i18n.js";

const FEEDBACK_ENDPOINT = "/api/feedback";
const FALLBACK_EMAIL = "filatovn90@gmail.com";
const MAX_MESSAGE_LENGTH = 5000;
const MIN_MESSAGE_LENGTH = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

let feedbackRoot = null;
let localeBound = false;
let authBootstrapPromise = null;
let lastViewportMobile = false;

const state = {
  open: false,
  submitting: false,
  success: false,
  error: "",
  fileError: "",
  source: "general",
  type: "suggestion",
  message: "",
  contactEmail: "",
  canContact: false,
  attachment: null,
  attachmentUrl: "",
  attachmentName: "",
  attachmentSize: 0,
  userId: "",
  profileEmail: "",
  pageUrl: "",
  pageTitle: "",
  locale: "ru"
};

const typeOptions = ["suggestion", "bug", "feature_request", "question", "other"];

function isMobileViewport() {
  return window.matchMedia("(max-width: 760px)").matches;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function buildMailtoFallback() {
  const subject = `[MindPulse Feedback] ${state.type}`;
  const body = [
    state.message || "",
    "",
    `Page: ${state.pageTitle || document.title || "MindPulse"}`,
    `URL: ${state.pageUrl || window.location.href}`,
    `Locale: ${state.locale || getLocale()}`,
    state.contactEmail ? `Contact: ${state.contactEmail}` : ""
  ].filter(Boolean).join("\n");

  return `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function clearAttachment() {
  if (state.attachmentUrl) {
    URL.revokeObjectURL(state.attachmentUrl);
  }

  state.attachment = null;
  state.attachmentUrl = "";
  state.attachmentName = "";
  state.attachmentSize = 0;
  state.fileError = "";
}

function resetForm({ preserveEmail = true } = {}) {
  const email = preserveEmail ? state.contactEmail : "";
  const canContact = preserveEmail ? state.canContact : false;
  clearAttachment();
  state.type = "suggestion";
  state.message = "";
  state.contactEmail = email;
  state.canContact = canContact;
  state.error = "";
  state.success = false;
  state.submitting = false;
}

async function bootstrapUserContext() {
  if (authBootstrapPromise) {
    return authBootstrapPromise;
  }

  authBootstrapPromise = (async () => {
    const session = await getCurrentSession().catch(() => null);
    const profile = session?.user ? await getCurrentProfile().catch(() => null) : null;

    state.userId = session?.user?.id || "";
    state.profileEmail = profile?.email || session?.user?.email || "";

    if (!state.contactEmail) {
      state.contactEmail = state.profileEmail;
    }

    state.pageUrl = window.location.href;
    state.pageTitle = document.title;
    state.locale = getLocale();
  })();

  try {
    await authBootstrapPromise;
  } finally {
    authBootstrapPromise = null;
  }
}

function validateAttachment(file) {
  if (!file) {
    return "";
  }

  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return t("feedback.errors.attachmentType");
  }

  if (file.size > MAX_FILE_SIZE) {
    return t("feedback.errors.attachmentSize");
  }

  return "";
}

function validateForm() {
  const message = String(state.message || "").trim();
  const email = String(state.contactEmail || "").trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!typeOptions.includes(state.type)) {
    return t("feedback.errors.typeRequired");
  }

  if (message.length < MIN_MESSAGE_LENGTH) {
    return t("feedback.errors.messageTooShort");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return t("feedback.errors.messageTooLong");
  }

  if (state.canContact && !email) {
    return t("feedback.errors.contactRequired");
  }

  if (email && !emailPattern.test(email)) {
    return t("feedback.errors.emailInvalid");
  }

  if (state.fileError) {
    return state.fileError;
  }

  return "";
}

function collectSafeContext() {
  const ua = navigator.userAgent || "";
  const platform = navigator.userAgentData?.platform || navigator.platform || "";
  const language = navigator.language || state.locale || getLocale();

  return {
    pageUrl: window.location.href,
    pageTitle: document.title,
    locale: state.locale || getLocale(),
    submittedAt: new Date().toISOString(),
    appVersion: document.documentElement.dataset.appVersion || window.__MINDPULSE_APP_VERSION__ || "web-static",
    browserInfo: JSON.stringify({
      userAgent: ua,
      platform,
      language,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      source: state.source || "general"
    })
  };
}

function renderTypeOptions() {
  return typeOptions.map((value) => `
    <option value="${value}" ${state.type === value ? "selected" : ""}>${escapeHtml(t(`feedback.type.${value}`))}</option>
  `).join("");
}

function renderAttachmentPreview() {
  if (!state.attachment) {
    return "";
  }

  const preview = state.attachmentUrl
    ? `<img src="${state.attachmentUrl}" alt="${escapeHtml(state.attachmentName)}">`
    : `<div class="feedback-attachment-placeholder">${escapeHtml(state.attachmentName)}</div>`;

  return `
    <div class="feedback-attachment-preview">
      <div class="feedback-attachment-thumb">${preview}</div>
      <div class="feedback-attachment-meta">
        <strong>${escapeHtml(state.attachmentName)}</strong>
        <span>${escapeHtml(formatBytes(state.attachmentSize))}</span>
      </div>
      <button class="feedback-attachment-remove" type="button" data-feedback-remove-attachment>${escapeHtml(t("feedback.attachment.remove"))}</button>
    </div>
  `;
}

function renderSuccessState() {
  return `
    <div class="feedback-success">
      <div class="feedback-success-mark" aria-hidden="true">✓</div>
      <h2>${escapeHtml(t("feedback.success.title"))}</h2>
      <p>${escapeHtml(t("feedback.success.description"))}</p>
      <div class="feedback-success-actions">
        <button class="form-action-button" type="button" data-feedback-close>${escapeHtml(t("feedback.close"))}</button>
      </div>
    </div>
  `;
}

function renderForm() {
  const mobile = isMobileViewport();
  const counter = `${state.message.length} / ${MAX_MESSAGE_LENGTH}`;
  const modalClass = mobile ? "feedback-modal is-mobile" : "feedback-modal";

  return `
    <div class="feedback-overlay${state.open ? " is-open" : ""}" data-feedback-overlay ${state.open ? "" : "hidden"}>
      <div class="${modalClass}" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <button class="feedback-close" type="button" data-feedback-close aria-label="${escapeHtml(t("feedback.close"))}">×</button>
        ${state.success ? renderSuccessState() : `
          <div class="feedback-head">
            <p class="section-kicker">${escapeHtml(t("feedback.kicker"))}</p>
            <h2 id="feedback-title">${escapeHtml(t("feedback.title"))}</h2>
            <p>${escapeHtml(t("feedback.description"))}</p>
          </div>
          <form class="feedback-form" data-feedback-form novalidate>
            <label class="feedback-field">
              <span>${escapeHtml(t("feedback.type.label"))}</span>
              <select name="type">
                ${renderTypeOptions()}
              </select>
            </label>

            <label class="feedback-field">
              <div class="feedback-field-head">
                <span>${escapeHtml(t("feedback.message.label"))}</span>
                <small>${escapeHtml(counter)}</small>
              </div>
              <textarea
                name="message"
                rows="${mobile ? "6" : "8"}"
                maxlength="${MAX_MESSAGE_LENGTH}"
                placeholder="${escapeHtml(t("feedback.message.placeholder"))}"
              >${escapeHtml(state.message)}</textarea>
            </label>

            <label class="feedback-field">
              <span>${escapeHtml(t("feedback.email.label"))}</span>
              <input
                type="email"
                name="contactEmail"
                value="${escapeHtml(state.contactEmail)}"
                placeholder="${escapeHtml(t("feedback.email.hint"))}"
                autocomplete="email"
              >
            </label>

            <label class="feedback-checkbox">
              <input type="checkbox" name="canContact" ${state.canContact ? "checked" : ""}>
              <span>${escapeHtml(t("feedback.canContact"))}</span>
            </label>

            <div class="feedback-field">
              <span>${escapeHtml(t("feedback.attachment.label"))}</span>
              <label class="feedback-upload">
                <input type="file" name="attachment" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp">
                <span>${escapeHtml(t("feedback.attachment.action"))}</span>
                <small>${escapeHtml(t("feedback.attachment.hint"))}</small>
              </label>
              ${renderAttachmentPreview()}
            </div>

            <p class="feedback-privacy">${escapeHtml(t("feedback.privacy"))}</p>
            ${state.error ? `<div class="feedback-banner is-error">${escapeHtml(state.error)}</div>` : ""}
            ${state.fileError ? `<div class="feedback-banner is-error">${escapeHtml(state.fileError)}</div>` : ""}
            <div class="feedback-actions">
              <button class="ghost-button" type="button" data-feedback-close>${escapeHtml(t("common.cancel"))}</button>
              <button class="form-action-button" type="submit" ${state.submitting ? "disabled" : ""}>
                ${escapeHtml(state.submitting ? t("feedback.sending") : t("feedback.submit"))}
              </button>
            </div>
            <p class="feedback-fallback">
              <a href="${buildMailtoFallback()}">${escapeHtml(t("feedback.emailFallback"))}</a>
            </p>
          </form>
        `}
      </div>
    </div>
  `;
}

function syncBodyScrollLock() {
  document.body.classList.toggle("feedback-open", state.open);
}

function rerender() {
  if (!feedbackRoot) {
    return;
  }

  const wasOpen = feedbackRoot.querySelector("[data-feedback-overlay]")?.hidden === false;
  feedbackRoot.innerHTML = renderForm();

  if (state.open && (!wasOpen || lastViewportMobile !== isMobileViewport())) {
    feedbackRoot.querySelector("textarea, select, input[name='message'], input[name='contactEmail']")?.focus();
  }

  lastViewportMobile = isMobileViewport();
  syncBodyScrollLock();
}

function closeFeedback() {
  state.open = false;
  state.success = false;
  state.error = "";
  state.fileError = "";
  clearAttachment();
  rerender();
}

async function submitFeedback() {
  const validationError = validateForm();
  if (validationError) {
    state.error = validationError;
    rerender();
    return;
  }

  if (window.location.protocol === "file:") {
    state.error = t("feedback.errors.filePreview");
    rerender();
    return;
  }

  state.submitting = true;
  state.error = "";
  rerender();

  const context = collectSafeContext();
  const formData = new FormData();
  formData.set("type", state.type);
  formData.set("message", state.message.trim());
  formData.set("contactEmail", state.contactEmail.trim());
  formData.set("canContact", state.canContact ? "true" : "false");
  formData.set("locale", state.locale || getLocale());
  formData.set("pageUrl", context.pageUrl);
  formData.set("pageTitle", context.pageTitle);
  formData.set("userId", state.userId || "");
  formData.set("appVersion", context.appVersion);
  formData.set("browserInfo", context.browserInfo);
  formData.set("source", state.source || "general");

  if (state.attachment) {
    formData.set("attachment", state.attachment, state.attachment.name);
  }

  const session = await getCurrentSession().catch(() => null);
  const headers = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  try {
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      body: formData,
      headers
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || t("feedback.error.description"));
    }

    state.submitting = false;
    state.success = true;
    state.error = "";
    clearAttachment();
    rerender();
  } catch (error) {
    state.submitting = false;
    state.error = error?.message || t("feedback.error.description");
    rerender();
  }
}

function bindEvents() {
  if (!feedbackRoot) {
    return;
  }

  feedbackRoot.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.matches("[data-feedback-close]")) {
      closeFeedback();
      return;
    }

    if (target.matches("[data-feedback-overlay]")) {
      closeFeedback();
      return;
    }

    if (target.matches("[data-feedback-remove-attachment]")) {
      clearAttachment();
      rerender();
    }
  });

  feedbackRoot.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return;
    }

    if (target.name === "message") {
      state.message = target.value.slice(0, MAX_MESSAGE_LENGTH);
      state.error = "";
      rerender();
      return;
    }

    if (target.name === "contactEmail") {
      state.contactEmail = target.value;
      state.error = "";
      return;
    }
  });

  feedbackRoot.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
      return;
    }

    if (target.name === "type") {
      state.type = target.value;
      state.error = "";
      return;
    }

    if (target.name === "canContact") {
      state.canContact = target.checked;
      state.error = "";
      rerender();
      return;
    }

    if (target.name === "attachment") {
      clearAttachment();
      const file = target.files?.[0] || null;
      const error = validateAttachment(file);
      if (error) {
        state.fileError = error;
        target.value = "";
      } else if (file) {
        state.attachment = file;
        state.attachmentName = file.name;
        state.attachmentSize = file.size;
        state.attachmentUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
      }
      rerender();
    }
  });

  feedbackRoot.addEventListener("submit", (event) => {
    if (!(event.target instanceof HTMLFormElement)) {
      return;
    }
    event.preventDefault();
    submitFeedback();
  });

  document.addEventListener("click", async (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest("[data-feedback-open]") : null;
    if (!target) {
      return;
    }

    event.preventDefault();
    await openFeedbackDialog({
      source: target.getAttribute("data-feedback-source") || "general",
      initialType: target.getAttribute("data-feedback-type") || "suggestion"
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.open) {
      closeFeedback();
    }
  });

  window.addEventListener("resize", () => {
    if (!state.open) {
      return;
    }

    const mobile = isMobileViewport();
    if (mobile !== lastViewportMobile) {
      rerender();
    }
  });
}

export function ensureFeedbackUi() {
  if (feedbackRoot) {
    return feedbackRoot;
  }

  feedbackRoot = document.createElement("div");
  feedbackRoot.className = "feedback-root";
  document.body.appendChild(feedbackRoot);

  if (!localeBound) {
    onLocaleChange(() => {
      state.locale = getLocale();
      rerender();
    });
    localeBound = true;
  }

  bindEvents();
  rerender();
  return feedbackRoot;
}

export async function openFeedbackDialog(options = {}) {
  ensureFeedbackUi();
  await bootstrapUserContext();
  state.source = options.source || "general";
  state.type = typeOptions.includes(options.initialType) ? options.initialType : "suggestion";
  state.pageUrl = window.location.href;
  state.pageTitle = document.title;
  state.locale = getLocale();
  state.open = true;
  state.success = false;
  state.error = "";
  state.fileError = "";

  if (!state.message && options.initialMessage) {
    state.message = options.initialMessage;
  }

  rerender();
}
