import { getCurrentSession } from "./auth-helpers.js";
import { applyTranslations, onLocaleChange, t } from "./i18n.js";
import { getCurrentPlan, planLabel } from "./pricing-helpers.js";

const chip = document.getElementById("pricingCurrentPlanChip");

bootstrap();
onLocaleChange(() => {
  applyTranslations(document);
  void bootstrap();
});

async function bootstrap() {
  const [session, plan] = await Promise.all([
    getCurrentSession().catch(() => null),
    getCurrentPlan().catch(() => "free")
  ]);

  if (!chip) {
    return;
  }

  if (session?.user) {
    chip.textContent = `${t("pricing.currentPlan").replace(/:\s*Free$/, ":")} ${planLabel(plan)}`;
    return;
  }

  chip.textContent = t("pricing.currentGuestPlan");
}
