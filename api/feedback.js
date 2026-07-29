import Busboy from "busboy";
import { createClient } from "@supabase/supabase-js";
import { extractBearerToken, getServerAuthContext, isMissingTableError } from "../lib/server-supabase.js";

export const config = {
  api: {
    bodyParser: false
  }
};

const FEEDBACK_TYPES = new Set(["suggestion", "bug", "feature_request", "question", "other"]);
const MAX_MESSAGE_LENGTH = 5000;
const MIN_MESSAGE_LENGTH = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const WINDOW_MS = 15 * 60 * 1000;
const LIMIT_PER_WINDOW = 5;
const rateLimitStore = new Map();

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing on the server.");
  }

  return { url, anonKey };
}

function createAnonClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function getRateLimitKey(req, fields, userId) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : String(forwarded || req.socket?.remoteAddress || "unknown").split(",")[0].trim();

  return userId || String(fields.contactEmail || "").trim().toLowerCase() || ip || "anonymous";
}

function enforceRateLimit(key) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);
  const recentHits = (existing || []).filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recentHits.length >= LIMIT_PER_WINDOW) {
    const error = new Error("Too many feedback attempts. Please wait a few minutes and try again.");
    error.statusCode = 429;
    throw error;
  }

  recentHits.push(now);
  rateLimitStore.set(key, recentHits);
}

function sanitizeText(value) {
  return String(value || "").replace(/\0/g, "").trim();
}

function validatePayload(fields) {
  const type = sanitizeText(fields.type);
  const message = sanitizeText(fields.message);
  const contactEmail = sanitizeText(fields.contactEmail);
  const locale = sanitizeText(fields.locale) || "ru";
  const pageUrl = sanitizeText(fields.pageUrl);
  const pageTitle = sanitizeText(fields.pageTitle);
  const appVersion = sanitizeText(fields.appVersion);
  const browserInfo = sanitizeText(fields.browserInfo);
  const canContact = String(fields.canContact) === "true";

  if (!FEEDBACK_TYPES.has(type)) {
    const error = new Error("Feedback type is required.");
    error.statusCode = 400;
    throw error;
  }

  if (message.length < MIN_MESSAGE_LENGTH) {
    const error = new Error("Please describe the feedback in a bit more detail.");
    error.statusCode = 400;
    throw error;
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    const error = new Error("The feedback message is too long.");
    error.statusCode = 400;
    throw error;
  }

  if (contactEmail) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(contactEmail)) {
      const error = new Error("Contact email has an invalid format.");
      error.statusCode = 400;
      throw error;
    }
  }

  if (canContact && !contactEmail) {
    const error = new Error("Contact email is required if we may reply.");
    error.statusCode = 400;
    throw error;
  }

  return {
    type,
    message,
    contactEmail,
    locale,
    pageUrl,
    pageTitle,
    appVersion,
    browserInfo,
    canContact,
    source: sanitizeText(fields.source) || "general"
  };
}

async function parseMultipart(req) {
  return await new Promise((resolve, reject) => {
    const fields = {};
    let attachment = null;
    let fileTooLarge = false;
    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: MAX_FILE_SIZE
      }
    });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (name, file, info) => {
      if (name !== "attachment") {
        file.resume();
        return;
      }

      const chunks = [];
      attachment = {
        filename: info?.filename || "attachment",
        mimeType: info?.mimeType || "application/octet-stream",
        encoding: info?.encoding || "7bit",
        buffer: null
      };

      file.on("limit", () => {
        fileTooLarge = true;
      });

      file.on("data", (chunk) => {
        chunks.push(chunk);
      });

      file.on("end", () => {
        attachment.buffer = Buffer.concat(chunks);
      });
    });

    busboy.on("error", reject);
    busboy.on("finish", () => {
      if (fileTooLarge) {
        const error = new Error("Screenshot is too large. The limit is 5 MB.");
        error.statusCode = 400;
        reject(error);
        return;
      }
      resolve({ fields, attachment });
    });

    req.pipe(busboy);
  });
}

async function parseRequest(req) {
  const contentType = String(req.headers["content-type"] || "");
  if (contentType.includes("multipart/form-data")) {
    return parseMultipart(req);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  const fields = raw ? JSON.parse(raw) : {};
  return { fields, attachment: null };
}

async function deliverFeedbackEmail(payload, attachment) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_EMAIL_TO || "filatovn90@gmail.com";
  const from = process.env.FEEDBACK_EMAIL_FROM || "MindPulse Feedback <onboarding@resend.dev>";

  if (!apiKey) {
    return { status: "skipped", reason: "RESEND_API_KEY is not configured." };
  }

  const typeLabels = {
    suggestion: payload.locale === "ru" ? "Предложение" : "Suggestion",
    bug: payload.locale === "ru" ? "Ошибка" : "Bug report",
    feature_request: payload.locale === "ru" ? "Идея функции" : "Feature idea",
    question: payload.locale === "ru" ? "Вопрос" : "Question",
    other: payload.locale === "ru" ? "Другое" : "Other"
  };

  const subject = `[MindPulse Feedback] ${typeLabels[payload.type] || payload.type} — ${payload.pageTitle || "MindPulse"}`;
  const browserInfo = (() => {
    try {
      return JSON.parse(payload.browserInfo || "{}");
    } catch {
      return {};
    }
  })();

  const lines = [
    payload.locale === "ru" ? "Новое обращение из MindPulse" : "New feedback from MindPulse",
    "",
    `${payload.locale === "ru" ? "Тип" : "Type"}: ${typeLabels[payload.type] || payload.type}`,
    `${payload.locale === "ru" ? "Источник" : "Source"}: ${payload.source || "general"}`,
    `${payload.locale === "ru" ? "Страница" : "Page"}: ${payload.pageTitle || "MindPulse"}`,
    `URL: ${payload.pageUrl || "-"}`,
    `${payload.locale === "ru" ? "Язык" : "Locale"}: ${payload.locale || "ru"}`,
    `${payload.locale === "ru" ? "Пользователь" : "User"}: ${payload.userId || "-"}`,
    `${payload.locale === "ru" ? "Email" : "Email"}: ${payload.contactEmail || "-"}`,
    `${payload.locale === "ru" ? "Можно ответить" : "Can contact"}: ${payload.canContact ? "yes" : "no"}`,
    `${payload.locale === "ru" ? "Версия" : "Version"}: ${payload.appVersion || "-"}`,
    `${payload.locale === "ru" ? "Браузер" : "Browser"}: ${browserInfo.userAgent || "-"}`,
    `${payload.locale === "ru" ? "ОС" : "OS"}: ${browserInfo.platform || "-"}`,
    `${payload.locale === "ru" ? "Экран" : "Viewport"}: ${browserInfo.viewport || "-"}`,
    "",
    `${payload.locale === "ru" ? "Сообщение" : "Message"}:`,
    payload.message
  ];

  if (attachment?.buffer?.length) {
    lines.push(
      "",
      `${payload.locale === "ru" ? "Скриншот" : "Screenshot"}: ${attachment.filename} (${attachment.mimeType}, ${attachment.buffer.length} bytes)`
    );
  }

  const emailPayload = {
    from,
    to: [to],
    subject,
    text: lines.join("\n")
  };

  if (attachment?.buffer?.length) {
    emailPayload.attachments = [
      {
        filename: attachment.filename,
        content: attachment.buffer.toString("base64")
      }
    ];
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(emailPayload)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown email error");
    throw new Error(`Email delivery failed: ${errorText}`);
  }

  return { status: "sent" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      ok: false,
      error: "Method not allowed."
    });
  }

  let authContext = null;
  try {
    if (extractBearerToken(req)) {
      authContext = await getServerAuthContext(req);
    }
  } catch (error) {
    console.error("[feedback] auth bootstrap failed", error);
    authContext = null;
  }

  const supabase = authContext?.supabase || createAnonClient();
  const user = authContext?.user || null;

  try {
    const { fields, attachment } = await parseRequest(req);
    const payload = validatePayload(fields);
    const userId = user?.id || null;

    enforceRateLimit(getRateLimitKey(req, payload, userId));

    const insertPayload = {
      user_id: userId,
      type: payload.type,
      message: payload.message,
      contact_email: payload.contactEmail || null,
      can_contact: payload.canContact,
      locale: payload.locale,
      page_url: payload.pageUrl || null,
      page_title: payload.pageTitle || null,
      app_version: payload.appVersion || null,
      browser_info: payload.browserInfo || null,
      status: "new",
      email_delivery_status: "pending"
    };

    const { data: feedbackRow, error: insertError } = await supabase
      .from("feedback")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError) {
      if (isMissingTableError(insertError, "feedback")) {
        return res.status(500).json({
          ok: false,
          error: "Supabase feedback table is missing. Run the feedback SQL migration first."
        });
      }
      throw insertError;
    }

    let emailStatus = "skipped";
    let emailMessage = "";

    try {
      const result = await deliverFeedbackEmail(
        {
          ...payload,
          userId
        },
        attachment
      );
      emailStatus = result.status;
      emailMessage = result.reason || "";
    } catch (error) {
      console.error("[feedback] email delivery failed", error);
      emailStatus = "failed";
      emailMessage = error?.message || "Unknown email error";
    }

    await supabase
      .from("feedback")
      .update({
        email_delivery_status: emailMessage ? `${emailStatus}: ${emailMessage}` : emailStatus
      })
      .eq("id", feedbackRow.id);

    return res.status(200).json({
      ok: true,
      id: feedbackRow.id,
      deliveryStatus: emailStatus
    });
  } catch (error) {
    console.error("[feedback] request failed", error);
    return res.status(error?.statusCode || 500).json({
      ok: false,
      error: error?.message || "Could not send feedback right now."
    });
  }
}
