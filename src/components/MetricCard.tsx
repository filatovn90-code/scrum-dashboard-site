interface MetricCardProps {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "neutral" | "green" | "yellow" | "red";
}

const toneClass = {
  neutral: "border-line",
  green: "border-emerald-200 bg-emerald-50/60",
  yellow: "border-amber-200 bg-amber-50/60",
  red: "border-red-200 bg-red-50/60",
};

export function MetricCard({ label, value, helper, tone = "neutral" }: MetricCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${toneClass[tone]}`}>
      <p className="label">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {helper ? <p className="mt-1 text-sm text-muted">{helper}</p> : null}
    </div>
  );
}
