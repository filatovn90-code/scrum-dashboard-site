import { getCurrentSession } from "./auth-helpers.js";
import { getCurrentPlan, planLabel } from "./pricing-helpers.js";

const chip = document.getElementById("pricingCurrentPlanChip");

bootstrap();

async function bootstrap() {
  const [session, plan] = await Promise.all([
    getCurrentSession().catch(() => null),
    getCurrentPlan().catch(() => "free")
  ]);

  if (!chip) {
    return;
  }

  if (session?.user) {
    chip.textContent = `Текущий план: ${planLabel(plan)}`;
    return;
  }

  chip.textContent = "Стартовый план: Free";
}
