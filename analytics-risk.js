export function getOverloadRisk(avgEnergy, avgStress) {
  if (avgEnergy == null || avgStress == null) return "unknown";
  if (avgStress >= 8 && avgEnergy <= 4) return "risk";
  if (avgStress >= 6 || avgEnergy <= 5) return "high";
  return "normal";
}
