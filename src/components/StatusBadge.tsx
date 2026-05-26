import type { HealthStatus, RiskLevel } from "../types";

const healthConfig: Record<HealthStatus, { label: string; className: string }> = {
  ok: { label: "в норме", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  warning: { label: "зона внимания", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  critical: { label: "критично", className: "bg-red-50 text-red-700 ring-red-200" },
};

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  низкий: { label: "низкий", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  средний: { label: "средний", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  высокий: { label: "высокий", className: "bg-red-50 text-red-700 ring-red-200" },
};

interface StatusBadgeProps {
  status?: HealthStatus;
  risk?: RiskLevel;
  label?: string;
}

export function StatusBadge({ status, risk, label }: StatusBadgeProps) {
  if (status === "critical") return null;

  const config = status ? healthConfig[status] : risk ? riskConfig[risk] : undefined;

  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset ${
        config?.className ?? "bg-slate-50 text-slate-700 ring-slate-200"
      }`}
    >
      {label ?? config?.label}
    </span>
  );
}
