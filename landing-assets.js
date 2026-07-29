export const productImages = {
  weeklyPlan: {
    ru: "assets/landing/weekly-plan-ru.png",
    en: "assets/landing/weekly-plan-en.png"
  },
  dailyPulse: {
    ru: "assets/landing/daily-pulse-ru.png",
    en: "assets/landing/daily-pulse-en.png"
  },
  analytics: {
    ru: "assets/landing/analytics-ru.png",
    en: "assets/landing/analytics-en.png"
  }
};

export function getLocalizedAsset(assets, locale) {
  return assets?.[locale] ?? assets?.ru ?? "";
}
