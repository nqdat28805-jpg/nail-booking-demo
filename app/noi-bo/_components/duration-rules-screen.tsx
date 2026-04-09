"use client";

import { useEffect, useState } from "react";
import type { ServiceDurationRule } from "@/src/domain/config/types";

type DurationRulesApiResponse = {
  source: "database" | "memory_fallback";
  items: ServiceDurationRule[];
};

export function DurationRulesScreen() {
  const [rules, setRules] = useState<ServiceDurationRule[]>([]);
  const [, setRuntimeSource] =
    useState<DurationRulesApiResponse["source"]>("memory_fallback");
  const [loading, setLoading] = useState(true);
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadRules();
  }, []);

  async function loadRules() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/internal/duration-rules", {
        cache: "no-store",
      });
      const payload = (await response.json()) as DurationRulesApiResponse;
      setRules(payload.items);
      setRuntimeSource(payload.source);
    } catch {
      setMessage("Không tải được quy tắc thời lượng.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(rule: ServiceDurationRule) {
    setSavingRuleId(rule.id);
    setMessage(null);

    try {
      const response = await fetch(`/api/internal/duration-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseDurationMinutes: rule.baseDurationMinutes,
          blockRoundToMinutes: rule.blockRoundToMinutes,
          guestCountStrategy: rule.guestCountStrategy,
          guestCountMultiplier: rule.guestCountMultiplier,
          active: rule.active,
          notes: rule.notes ?? "",
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Không cập nhật được quy tắc thời lượng.");
      }

      setMessage(`Đã cập nhật ${rule.code}.`);
      await loadRules();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không cập nhật được quy tắc thời lượng.",
      );
    } finally {
      setSavingRuleId(null);
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[2rem] border border-border/80 bg-white/88 p-6 shadow-[0_18px_36px_rgba(37,28,28,0.06)]">
        <h1 className="font-serif text-3xl text-foreground">Cấu hình thời lượng</h1>
      </header>

      <section className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-foreground">Quy tắc thời lượng dịch vụ</h2>
          <button
            type="button"
            onClick={() => void loadRules()}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-muted"
          >
            Làm mới
          </button>
        </div>

        {message ? (
          <p className="mt-4 text-sm leading-6 text-primary">{message}</p>
        ) : null}

        {loading ? (
          <p className="mt-5 text-sm text-text-muted">Đang tải dữ liệu...</p>
        ) : (
          <div className="mt-5 space-y-3">
            {rules.map((rule, index) => (
              <article
                key={rule.id}
                className="rounded-[1.35rem] border border-border/80 bg-surface px-5 py-4"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-primary">{rule.code}</p>
                    <p className="text-sm text-text-muted">
                      {rule.setType} · {rule.nailType} · {rule.polishStyle} ·{" "}
                      {rule.effectOption}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSave(rule)}
                    disabled={savingRuleId === rule.id}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {savingRuleId === rule.id ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Thời lượng gốc
                    </span>
                    <input
                      value={rule.baseDurationMinutes}
                      onChange={(event) =>
                        setRules((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  baseDurationMinutes: Number(event.target.value || 0),
                                }
                              : item,
                          ),
                        )
                      }
                      inputMode="numeric"
                      className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Làm tròn lịch
                    </span>
                    <input
                      value={rule.blockRoundToMinutes}
                      onChange={(event) =>
                        setRules((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  blockRoundToMinutes: Number(event.target.value || 0),
                                }
                              : item,
                          ),
                        )
                      }
                      inputMode="numeric"
                      className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Xử lý số khách
                    </span>
                    <select
                      value={rule.guestCountStrategy}
                      onChange={(event) =>
                        setRules((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  guestCountStrategy:
                                    event.target.value as ServiceDurationRule["guestCountStrategy"],
                                }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                    >
                      <option value="sequential">Tuần tự</option>
                      <option value="parallel">Song song</option>
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Hệ số
                    </span>
                    <input
                      value={rule.guestCountMultiplier}
                      onChange={(event) =>
                        setRules((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  guestCountMultiplier: Number(event.target.value || 0),
                                }
                              : item,
                          ),
                        )
                      }
                      inputMode="decimal"
                      className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={rule.active}
                      onChange={(event) =>
                        setRules((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, active: event.target.checked }
                              : item,
                          ),
                        )
                      }
                    />
                    Đang áp dụng
                  </label>
                </div>

                <label className="mt-4 block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Ghi chú
                  </span>
                  <input
                    value={rule.notes ?? ""}
                    onChange={(event) =>
                      setRules((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, notes: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                  />
                </label>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
