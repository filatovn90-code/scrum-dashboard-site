const AUTH_KEY = "scrum-dashboard-auth-user";
const activeUser = window.appStorage.getItem(AUTH_KEY);

if (!activeUser) {
  window.location.replace("index.html");
}

const logoutButton = document.getElementById("logoutButton");
const uploadForm = document.getElementById("healthUploadForm");
const zipFileInput = document.getElementById("healthZipFile");
const uploadSubmit = document.getElementById("healthUploadSubmit");
const importStatus = document.getElementById("healthImportStatus");
const importMeta = document.getElementById("healthImportMeta");
const summaryGrid = document.getElementById("healthSummaryGrid");
const recordsBody = document.getElementById("healthRecordsBody");
const rangeSwitch = document.getElementById("healthRangeSwitch");

const chartTargets = {
  weight: document.getElementById("chartWeight"),
  bodyFat: document.getElementById("chartBodyFat"),
  muscle: document.getElementById("chartMuscle"),
  steps: document.getElementById("chartSteps"),
  sleep: document.getElementById("chartSleep"),
  heart: document.getElementById("chartHeart")
};

let activeRange = 30;

const charts = {
  weight: { label: "кг", type: "line" },
  bodyFat: { label: "%", type: "line" },
  muscle: { label: "кг", type: "line" },
  steps: { label: "шагов", type: "bar" },
  sleep: { label: "мин", type: "bar" },
  heart: { label: "bpm / ms", type: "line" }
};

logoutButton?.addEventListener("click", () => {
  window.appStorage.removeItem(AUTH_KEY);
  window.location.replace("index.html");
});

rangeSwitch?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-range]");
  if (!button) {
    return;
  }

  activeRange = Number(button.dataset.range);
  rangeSwitch.querySelectorAll("[data-range]").forEach((chip) => {
    chip.classList.toggle("is-active", chip === button);
  });

  loadHealthDashboard();
});

uploadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = zipFileInput.files?.[0];
  if (!file) {
    setImportStatus("Нужно выбрать ZIP-файл Apple Health.", true);
    return;
  }

  if (window.location.protocol === "file:") {
    setImportStatus("Импорт работает в опубликованной версии сайта на Vercel, а не при открытии файла напрямую.", true);
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    uploadSubmit.disabled = true;
    setImportStatus("Архив загружается и обрабатывается...");

    const response = await fetch("/api/health/import", {
      method: "POST",
      headers: {
        "x-user-id": activeUser
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Не удалось импортировать архив.");
    }

    setImportStatus(data.message || "Импорт завершён.");
    zipFileInput.value = "";
    await loadHealthDashboard();
  } catch (error) {
    setImportStatus(error.message || "Во время импорта произошла ошибка.", true);
  } finally {
    uploadSubmit.disabled = false;
  }
});

async function loadHealthDashboard() {
  if (window.location.protocol === "file:") {
    setImportStatus("Локально страница видна, но импорт и данные заработают после публикации на Vercel.");
    renderEmptyState();
    return;
  }

  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - activeRange + 1);

  try {
    const [summaryResponse, dailyResponse, recordsResponse] = await Promise.all([
      fetch("/api/health/summary", {
        headers: { "x-user-id": activeUser }
      }),
      fetch(`/api/health/daily?from=${formatDate(from)}&to=${formatDate(today)}`, {
        headers: { "x-user-id": activeUser }
      }),
      fetch("/api/health/records", {
        headers: { "x-user-id": activeUser }
      })
    ]);

    const summaryData = await summaryResponse.json();
    const dailyData = await dailyResponse.json();
    const recordsData = await recordsResponse.json();

    if (!summaryResponse.ok || !summaryData.ok) {
      throw new Error(summaryData.error || "Не удалось получить summary.");
    }

    if (!dailyResponse.ok || !dailyData.ok) {
      throw new Error(dailyData.error || "Не удалось получить дневные данные.");
    }

    if (!recordsResponse.ok || !recordsData.ok) {
      throw new Error(recordsData.error || "Не удалось получить последние записи.");
    }

    renderSummary(summaryData.summary, summaryData.latestImport);
    renderCharts(dailyData.items || []);
    renderRecords(recordsData.items || []);
  } catch (error) {
    setImportStatus(error.message || "Не удалось загрузить данные здоровья.", true);
    renderEmptyState();
  }
}

function renderSummary(summary, latestImport) {
  importMeta.innerHTML = latestImport
    ? `
        <div class="health-import-chip">Последний импорт: ${formatDateTime(latestImport.imported_at)}</div>
        <div class="health-import-chip">Записей: ${latestImport.records_created ?? 0} новых / ${latestImport.records_total ?? 0} всего</div>
      `
    : `<div class="health-import-chip">Импортов пока не было</div>`;

  const cards = [
    { label: "Текущий вес", value: formatMetric(summary.currentWeightKg, "кг") },
    { label: "Изменение веса за 30 дней", value: formatSignedMetric(summary.weightChange30dKg, "кг") },
    { label: "Процент жира", value: formatMetric(summary.bodyFatPercent, "%") },
    { label: "Мышцы / lean mass", value: formatMetric(summary.leanBodyMassKg, "кг") },
    { label: "Средний сон за 7 дней", value: formatMetric(summary.avgSleep7dMinutes, "мин") },
    { label: "Шаги за сегодня", value: formatMetric(summary.stepsToday, "") },
    { label: "Средний пульс в покое", value: formatMetric(summary.avgRestingHeartRate7d, "bpm") },
    { label: "HRV", value: formatMetric(summary.hrvMs, "ms") }
  ];

  summaryGrid.innerHTML = cards
    .map((card) => `
      <article class="health-summary-card">
        <p>${card.label}</p>
        <strong>${card.value}</strong>
      </article>
    `)
    .join("");
}

function renderCharts(items) {
  const weightSeries = items.map((item) => ({ x: item.date, y: item.weight_kg }));
  const bodyFatSeries = items.map((item) => ({ x: item.date, y: item.body_fat_percent }));
  const muscleSeries = items.map((item) => ({ x: item.date, y: item.muscle_mass_kg ?? item.lean_body_mass_kg }));
  const stepsSeries = items.map((item) => ({ x: item.date, y: item.steps }));
  const sleepSeries = items.map((item) => ({ x: item.date, y: item.sleep_minutes }));
  const heartSeries = items.map((item) => ({ x: item.date, y: item.resting_heart_rate, y2: item.hrv_ms }));

  drawMiniChart(chartTargets.weight, weightSeries, charts.weight);
  drawMiniChart(chartTargets.bodyFat, bodyFatSeries, charts.bodyFat);
  drawMiniChart(chartTargets.muscle, muscleSeries, charts.muscle);
  drawMiniChart(chartTargets.steps, stepsSeries, charts.steps);
  drawMiniChart(chartTargets.sleep, sleepSeries, charts.sleep);
  drawDualChart(chartTargets.heart, heartSeries, charts.heart);
}

function renderRecords(items) {
  if (!items.length) {
    recordsBody.innerHTML = `<tr><td colspan="8" class="health-empty-row">Пока нет импортированных измерений.</td></tr>`;
    return;
  }

  recordsBody.innerHTML = items
    .map((item) => `
      <tr>
        <td>${item.date}</td>
        <td>${formatMetric(item.weight_kg, "кг")}</td>
        <td>${formatMetric(item.body_fat_percent, "%")}</td>
        <td>${formatMetric(item.muscle_mass_kg ?? item.lean_body_mass_kg, "кг")}</td>
        <td>${formatMetric(item.bmi, "")}</td>
        <td>${formatMetric(item.steps, "")}</td>
        <td>${formatMetric(item.sleep_minutes, "мин")}</td>
        <td>${formatMetric(item.resting_heart_rate, "bpm")}</td>
      </tr>
    `)
    .join("");
}

function renderEmptyState() {
  summaryGrid.innerHTML = Array.from({ length: 8 })
    .map(() => `
      <article class="health-summary-card">
        <p>Нет данных</p>
        <strong>—</strong>
      </article>
    `)
    .join("");

  Object.values(chartTargets).forEach((element) => {
    if (element) {
      element.innerHTML = `<div class="health-chart-empty">Нет данных для графика</div>`;
    }
  });

  recordsBody.innerHTML = `<tr><td colspan="8" class="health-empty-row">Пока нет импортированных измерений.</td></tr>`;
}

function drawMiniChart(container, series, config) {
  if (!container) {
    return;
  }

  const values = series.filter((point) => Number.isFinite(point.y));
  if (!values.length) {
    container.innerHTML = `<div class="health-chart-empty">Нет данных</div>`;
    return;
  }

  const width = 520;
  const height = 220;
  const padding = 24;
  const min = Math.min(...values.map((point) => point.y));
  const max = Math.max(...values.map((point) => point.y));
  const spread = max - min || 1;

  const points = values.map((point, index) => {
    const x = padding + (index * (width - padding * 2) / Math.max(values.length - 1, 1));
    const y = height - padding - ((point.y - min) / spread) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  let content = `
    <svg viewBox="0 0 ${width} ${height}" class="health-chart-svg" preserveAspectRatio="none">
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="health-axis"></line>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" class="health-axis"></line>
  `;

  if (config.type === "bar") {
    const barWidth = Math.max(6, (width - padding * 2) / Math.max(values.length * 1.6, 1));
    content += values.map((point, index) => {
      const x = padding + (index * (width - padding * 2) / Math.max(values.length, 1)) + 8;
      const y = height - padding - ((point.y - min) / spread) * (height - padding * 2);
      const barHeight = height - padding - y;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="8" class="health-bar"></rect>`;
    }).join("");
  } else {
    content += `<polyline points="${points}" fill="none" class="health-line"></polyline>`;
    content += values.map((point, index) => {
      const [x, y] = points.split(" ")[index].split(",");
      return `<circle cx="${x}" cy="${y}" r="4" class="health-dot"></circle>`;
    }).join("");
  }

  const latest = values[values.length - 1];
  content += `
      <text x="${padding}" y="${padding - 6}" class="health-label">${formatMetric(max, config.label)}</text>
      <text x="${width - padding}" y="${height - 6}" text-anchor="end" class="health-label">${latest.x}</text>
    </svg>
  `;

  container.innerHTML = content;
}

function drawDualChart(container, series) {
  if (!container) {
    return;
  }

  const first = series.filter((point) => Number.isFinite(point.y));
  const second = series.filter((point) => Number.isFinite(point.y2));

  if (!first.length && !second.length) {
    container.innerHTML = `<div class="health-chart-empty">Нет данных</div>`;
    return;
  }

  const width = 520;
  const height = 220;
  const padding = 24;
  const combined = [...first.map((point) => point.y), ...second.map((point) => point.y2)];
  const min = Math.min(...combined);
  const max = Math.max(...combined);
  const spread = max - min || 1;

  const polyline = (points, key, className) => {
    const filtered = points.filter((point) => Number.isFinite(point[key]));
    if (!filtered.length) {
      return "";
    }

    const path = filtered.map((point, index) => {
      const x = padding + (index * (width - padding * 2) / Math.max(filtered.length - 1, 1));
      const y = height - padding - ((point[key] - min) / spread) * (height - padding * 2);
      return `${x},${y}`;
    }).join(" ");

    return `<polyline points="${path}" fill="none" class="${className}"></polyline>`;
  };

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="health-chart-svg" preserveAspectRatio="none">
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="health-axis"></line>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" class="health-axis"></line>
      ${polyline(series, "y", "health-line")}
      ${polyline(series, "y2", "health-line-secondary")}
      <text x="${padding}" y="${padding - 6}" class="health-label">${formatMetric(max, "")}</text>
      <text x="${width - padding}" y="${height - 6}" text-anchor="end" class="health-label">${series[series.length - 1]?.x || ""}</text>
    </svg>
    <div class="health-dual-legend">
      <span><i class="health-legend-dot"></i> Пульс в покое</span>
      <span><i class="health-legend-dot health-legend-dot-secondary"></i> HRV</span>
    </div>
  `;
}

function setImportStatus(message, isError = false) {
  importStatus.textContent = message;
  importStatus.classList.toggle("is-error", isError);
}

function formatMetric(value, unit) {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
    return "—";
  }

  const numeric = Number(value);
  const formatted = Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
  return unit ? `${formatted} ${unit}`.trim() : formatted;
}

function formatSignedMetric(value, unit) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  const numeric = Number(value);
  const prefix = numeric > 0 ? "+" : "";
  return `${prefix}${formatMetric(numeric, unit)}`;
}

function formatDate(value) {
  return value.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

loadHealthDashboard();
