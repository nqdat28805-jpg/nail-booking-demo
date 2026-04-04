"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScheduleBreakRange, Staff, StaffWorkingSchedule } from "@/src/domain/staff/types";

type StaffApiResponse = {
  source: "database" | "memory_fallback";
  items: Staff[];
};

type ScheduleApiResponse = {
  source: "database" | "memory_fallback";
  staff: Staff | null;
  scope: "default" | "week_override";
  weekStart: string | null;
  weekEnd: string | null;
  resolvedFrom: "default" | "override";
  items: StaffWorkingSchedule[];
};

type EditableScheduleRow = {
  dayOfWeek: number;
  label: string;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  breaksText: string;
};

const DAY_LABELS = [
  "Chu nhat",
  "Thu hai",
  "Thu ba",
  "Thu tu",
  "Thu nam",
  "Thu sau",
  "Thu bay",
];

export function ScheduleManagementScreen() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [runtimeSource, setRuntimeSource] =
    useState<StaffApiResponse["source"]>("memory_fallback");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [scheduleScope, setScheduleScope] =
    useState<ScheduleApiResponse["scope"]>("default");
  const [weekStart, setWeekStart] = useState(() => getWeekStartIso(new Date()));
  const [resolvedFrom, setResolvedFrom] =
    useState<ScheduleApiResponse["resolvedFrom"]>("default");
  const [rows, setRows] = useState<EditableScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadStaff();
  }, []);

  useEffect(() => {
    if (!selectedStaffId) {
      return;
    }

    void loadSchedules(selectedStaffId, scheduleScope, weekStart);
  }, [scheduleScope, selectedStaffId, weekStart]);

  const selectedStaff = useMemo(
    () => staff.find((item) => item.id === selectedStaffId) ?? null,
    [selectedStaffId, staff],
  );

  async function loadStaff() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/internal/staff", { cache: "no-store" });
      const payload = (await response.json()) as StaffApiResponse;
      setStaff(payload.items);
      setRuntimeSource(payload.source);
      setSelectedStaffId((current) => current || payload.items[0]?.id || "");
    } catch {
      setMessage("Khong tai duoc danh sach nhan su.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSchedules(
    staffId: string,
    scope: ScheduleApiResponse["scope"],
    nextWeekStart: string,
  ) {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/internal/staff-schedules?staffId=${encodeURIComponent(staffId)}&scope=${scope}&weekStart=${encodeURIComponent(nextWeekStart)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as ScheduleApiResponse;
      setRows(
        payload.items.map((item) => ({
          dayOfWeek: item.dayOfWeek,
          label: DAY_LABELS[item.dayOfWeek],
          isWorkingDay: item.isWorkingDay,
          startTime: item.startTime,
          endTime: item.endTime,
          breaksText: formatBreakRanges(item.breakRanges ?? []),
        })),
      );
      setRuntimeSource(payload.source);
      setResolvedFrom(payload.resolvedFrom);
      if (payload.weekStart) {
        setWeekStart(payload.weekStart);
      }
    } catch {
      setMessage("Khong tai duoc lich lam viec.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedStaffId) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/internal/staff-schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaffId,
          scope: scheduleScope,
          weekStart: scheduleScope === "week_override" ? weekStart : null,
          schedules: rows.map((row) => ({
            dayOfWeek: row.dayOfWeek,
            isWorkingDay: row.isWorkingDay,
            startTime: row.startTime,
            endTime: row.endTime,
            breakRanges: parseBreakRanges(row.breaksText),
          })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Khong luu duoc lich lam viec.");
      }

      setMessage(
        scheduleScope === "week_override"
          ? "Da luu override cho tuan duoc chon."
          : "Da cap nhat lich mac dinh.",
      );
      await loadSchedules(selectedStaffId, scheduleScope, weekStart);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Khong luu duoc lich lam viec.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[2rem] border border-border/80 bg-white/88 p-6 shadow-[0_18px_36px_rgba(37,28,28,0.06)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
              Working schedule
            </p>
            <h1 className="font-serif text-3xl text-foreground">Cau hinh lich lam viec</h1>
            <p className="text-sm leading-7 text-text-muted">
              Customer availability doc active staff, lich mac dinh, va override theo
              tuan tu cung shared data layer.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm text-text-muted">
            Runtime: <span className="font-semibold text-primary">{runtimeSource}</span>
          </div>
        </div>
      </header>

      <section className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-4 md:min-w-[34rem] md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Chon nhan su</span>
              <select
                value={selectedStaffId}
                onChange={(event) => setSelectedStaffId(event.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
              >
                {staff.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayName}
                    {item.active ? "" : " (an)"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Pham vi chinh sua</span>
              <select
                value={scheduleScope}
                onChange={(event) =>
                  setScheduleScope(event.target.value as ScheduleApiResponse["scope"])
                }
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
              >
                <option value="default">Lich mac dinh</option>
                <option value="week_override">Override theo tuan</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!selectedStaffId || saving}
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Dang luu..." : "Luu lich"}
          </button>
        </div>

        {selectedStaff ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-text-muted">
              Dang chinh lich cho{" "}
              <span className="font-semibold text-primary">
                {selectedStaff.displayName}
              </span>
              .
            </p>

            {scheduleScope === "week_override" ? (
              <div className="flex flex-col gap-3 rounded-[1.35rem] border border-border/80 bg-surface px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Tuan dang chon: {formatWeekRange(weekStart)}
                  </p>
                  <p className="text-sm text-text-muted">
                    {resolvedFrom === "override"
                      ? "Dang sua override rieng cho tuan nay."
                      : "Chua co override. Form dang fallback tu lich mac dinh."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setWeekStart((current) => shiftWeek(current, -1))}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-muted"
                  >
                    Tuan truoc
                  </button>
                  <input
                    type="date"
                    value={weekStart}
                    onChange={(event) => setWeekStart(getWeekStartIso(event.target.value))}
                    className="rounded-full border border-border bg-white px-4 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setWeekStart((current) => shiftWeek(current, 1))}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-muted"
                  >
                    Tuan sau
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-text-muted">
                Lich mac dinh duoc dung lam fallback khi chua co override theo tuan.
              </p>
            )}
          </div>
        ) : null}

        {message ? (
          <p className="mt-3 text-sm leading-6 text-primary">{message}</p>
        ) : null}

        {loading ? (
          <p className="mt-5 text-sm text-text-muted">Dang tai du lieu...</p>
        ) : (
          <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-border/80">
            <table className="min-w-full divide-y divide-border/80 text-left text-sm">
              <thead className="bg-surface text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Ngay</th>
                  <th className="px-4 py-3 font-medium">Lam viec</th>
                  <th className="px-4 py-3 font-medium">Bat dau</th>
                  <th className="px-4 py-3 font-medium">Ket thuc</th>
                  <th className="px-4 py-3 font-medium">Khoang nghi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 bg-white">
                {rows.map((row, index) => (
                  <tr key={`${scheduleScope}-${weekStart}-${row.dayOfWeek}`}>
                    <td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
                    <td className="px-4 py-3">
                      <label className="inline-flex items-center gap-2 text-text-muted">
                        <input
                          type="checkbox"
                          checked={row.isWorkingDay}
                          onChange={(event) =>
                            setRows((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, isWorkingDay: event.target.checked }
                                  : item,
                              ),
                            )
                          }
                        />
                        {row.isWorkingDay ? "Di lam" : "Nghi"}
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={row.startTime}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, startTime: event.target.value }
                                : item,
                            ),
                          )
                        }
                        disabled={!row.isWorkingDay}
                        className="rounded-xl border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={row.endTime}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, endTime: event.target.value }
                                : item,
                            ),
                          )
                        }
                        disabled={!row.isWorkingDay}
                        className="rounded-xl border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={row.breaksText}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, breaksText: event.target.value }
                                : item,
                            ),
                          )
                        }
                        disabled={!row.isWorkingDay}
                        placeholder="12:00-13:00"
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

function formatBreakRanges(breakRanges: ScheduleBreakRange[]) {
  return breakRanges.map((item) => `${item.startTime}-${item.endTime}`).join(", ");
}

function parseBreakRanges(rawValue: string) {
  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [startTime, endTime] = item.split("-").map((value) => value.trim());
      return startTime && endTime ? { startTime, endTime } : null;
    })
    .filter((item): item is ScheduleBreakRange => Boolean(item));
}

function getWeekStartIso(input: string | Date) {
  const date =
    typeof input === "string" ? new Date(`${input}T12:00:00`) : new Date(input);
  const weekday = date.getDay();
  const distanceToMonday = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + distanceToMonday);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftWeek(weekStart: string, deltaWeeks: number) {
  const date = new Date(`${weekStart}T12:00:00`);
  date.setDate(date.getDate() + deltaWeeks * 7);
  return getWeekStartIso(date);
}

function formatWeekRange(weekStart: string) {
  const start = new Date(`${weekStart}T12:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}
