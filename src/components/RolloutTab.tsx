import { useEffect, useMemo, useState } from "react";
import type { BusinessStandardItem } from "../types";

interface RolloutTabProps {
  items: BusinessStandardItem[];
}

type InfluenceDraft = Record<string, { plannedImpact: string; actualImpact: string }>;

const storageKey = "ttm-rollout-metrics";

const readStoredInfluence = () => {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
};

const writeStoredInfluence = (value: InfluenceDraft) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // File-based previews in embedded browsers can block localStorage.
  }
};

const normalizeStoredInfluence = (raw: string | null): InfluenceDraft => {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, Partial<InfluenceDraft[string]> & { hypothesis?: string; fact?: string }>;

    return Object.fromEntries(
      Object.entries(parsed).map(([itemId, value]) => [
        itemId,
        {
          plannedImpact: value.plannedImpact ?? value.hypothesis ?? "",
          actualImpact: value.actualImpact ?? value.fact ?? "",
        },
      ]),
    );
  } catch {
    return {};
  }
};

export function RolloutTab({ items }: RolloutTabProps) {
  const quarters = useMemo(() => ["all", ...Array.from(new Set(items.map((item) => item.epicQuarter))).filter(Boolean).sort()], [items]);
  const products = useMemo(() => ["all", ...Array.from(new Set(items.map((item) => item.streamName))).filter(Boolean).sort()], [items]);
  const [quarter, setQuarter] = useState("all");
  const [product, setProduct] = useState("all");
  const [influence, setInfluence] = useState<InfluenceDraft>(() => normalizeStoredInfluence(readStoredInfluence()));

  useEffect(() => {
    writeStoredInfluence(influence);
  }, [influence]);

  const visibleItems = useMemo(
    () =>
      items
        .filter((item) => quarter === "all" || item.epicQuarter === quarter)
        .filter((item) => product === "all" || item.streamName === product)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.streamName.localeCompare(b.streamName)),
    [items, quarter, product],
  );

  const updateInfluence = (itemId: string, field: "plannedImpact" | "actualImpact", value: string) => {
    setInfluence((current) => ({
      ...current,
      [itemId]: {
        plannedImpact: current[itemId]?.plannedImpact ?? "",
        actualImpact: current[itemId]?.actualImpact ?? "",
        [field]: value,
      },
    }));
  };

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="label">Бизнес-стандарт</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-ink">
            Квартал эпика
            <select
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm lg:w-44"
              value={quarter}
              onChange={(event) => setQuarter(event.target.value)}
            >
              {quarters.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "Все кварталы" : item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-ink">
            Продукт
            <select
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm lg:w-44"
              value={product}
              onChange={(event) => setProduct(event.target.value)}
            >
              {products.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "Все продукты" : item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-5 overflow-hidden">
        <table className="w-full table-fixed border-separate border-spacing-0 text-left text-sm">
          <colgroup>
            <col className="w-[42%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[32%]" />
          </colgroup>
          <thead>
            <tr className="text-xs uppercase tracking-[0.08em] text-muted">
              <th className="border-b border-line py-3 pr-4">Эпик</th>
              <th className="border-b border-line px-4">Квартал</th>
              <th className="border-b border-line px-4">Продукт</th>
              <th className="border-b border-line px-4">Ключевой результат</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item.id}>
                <td className="border-b border-line py-3 pr-4 align-top">
                  <p className="break-words font-medium text-ink">{item.title}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      Планируемое влияние
                      <textarea
                        className="mt-1 min-h-20 w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-ink"
                        value={influence[item.id]?.plannedImpact ?? ""}
                        onChange={(event) => updateInfluence(item.id, "plannedImpact", event.target.value)}
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      Фактическое влияние
                      <textarea
                        className="mt-1 min-h-20 w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-ink"
                        value={influence[item.id]?.actualImpact ?? ""}
                        onChange={(event) => updateInfluence(item.id, "actualImpact", event.target.value)}
                      />
                    </label>
                  </div>
                </td>
                <td className="border-b border-line px-4 align-top">
                  <span className="inline-flex max-w-full rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-ink">{item.epicQuarter}</span>
                </td>
                <td className="break-words border-b border-line px-4 align-top font-medium text-ink">{item.streamName}</td>
                <td className="border-b border-line px-4 align-top text-muted">
                  <p className="break-words">{item.keyResult || "-"}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
