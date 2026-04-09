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
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
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
      setMessage("Không tải được danh sách nhân sự.");
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
      setMessage("Không tải được lịch làm việc.");
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
        throw new Error(payload.message ?? "Không lưu được lịch làm việc.");
      }

      setMessage(
        scheduleScope === "week_override"
          ? "Đã lưu lịch thay đổi cho tuần đã chọn."
          : "Đã cập nhật lịch mặc định.",
      );
      await loadSchedules(selectedStaffId, scheduleScope, weekStart);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không lưu được lịch làm việc.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[2rem] border border-border/80 bg-white/88 p-6 shadow-[0_18px_36px_rgba(37,28,28,0.06)]">
        <h1 className="font-serif text-3xl text-foreground">Cấu hình lịch làm việc</h1>
      </header>

      <section className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-4 md:min-w-[34rem] md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Chọn nhân sự</span>
              <select
                value={selectedStaffId}
                onChange={(event) => setSelectedStaffId(event.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
              >
                {staff.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayName}
                    {item.active ? "" : " (ẩn)"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Phạm vi chỉnh sửa</span>
              <select
                value={scheduleScope}
                onChange={(event) =>
                  setScheduleScope(event.target.value as ScheduleApiResponse["scope"])
                }
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
              >
                <option value="default">Lịch mặc định</option>
                <option value="week_override">Theo tuần</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!selectedStaffId || saving}
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu lịch"}
          </button>
        </div>

        {selectedStaff ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-text-muted">
              Đang chỉnh lịch cho{" "}
              <span className="font-semibold text-primary">
                {selectedStaff.displayName}
              </span>
              .
            </p>

            {scheduleScope === "week_override" ? (
              <div className="flex flex-col gap-3 rounded-[1.35rem] border border-border/80 bg-surface px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Tuần đang chọn: {formatWeekRange(weekStart)}
                  </p>
                  <p className="text-sm text-text-muted">
                    {resolvedFrom === "override"
                      ? "Đang chỉnh lịch riêng cho tuần này."
                      : "Chưa có lịch riêng cho tuần này."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setWeekStart((current) => shiftWeek(current, -1))}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-muted"
                  >
                    Tuần trước
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
                    Tuần sau
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-text-muted">
                Lịch mặc định được dùng khi chưa có lịch riêng theo tuần.
              </p>
            )}
          </div>
        ) : null}

        {message ? (
          <p className="mt-3 text-sm leading-6 text-primary">{message}</p>
        ) : null}

        {loading ? (
          <p className="mt-5 text-sm text-text-muted">Đang tải dữ liệu...</p>
        ) : (
          <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-border/80">
            <table className="min-w-full divide-y divide-border/80 text-left text-sm">
              <thead className="bg-surface text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Ngày</th>
                  <th className="px-4 py-3 font-medium">Làm việc</th>
                  <th className="px-4 py-3 font-medium">Bắt đầu</th>
                  <th className="px-4 py-3 font-medium">Kết thúc</th>
                  <th className="px-4 py-3 font-medium">Khoảng nghỉ</th>
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
                    {row.isWorkingDay ? "Đi làm" : "Nghỉ"}
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
