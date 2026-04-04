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

const DAY_LABELS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

export function ScheduleManagementScreen() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [runtimeSource, setRuntimeSource] =
    useState<StaffApiResponse["source"]>("memory_fallback");
  const [selectedStaffId, setSelectedStaffId] = useState("");
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

    void loadSchedules(selectedStaffId);
  }, [selectedStaffId]);

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

  async function loadSchedules(staffId: string) {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/internal/staff-schedules?staffId=${encodeURIComponent(staffId)}`,
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

      setMessage("Đã cập nhật lịch tuần.");
      await loadSchedules(selectedStaffId);
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
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
              Working schedule
            </p>
            <h1 className="font-serif text-3xl text-foreground">Cấu hình lịch tuần</h1>
            <p className="text-sm leading-7 text-text-muted">
              Customer availability sẽ đọc trực tiếp active staff và khung giờ làm việc lưu ở đây.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm text-text-muted">
            Runtime: <span className="font-semibold text-primary">{runtimeSource}</span>
          </div>
        </div>
      </header>

      <section className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <label className="block space-y-2 md:min-w-80">
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

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!selectedStaffId || saving}
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu lịch tuần"}
          </button>
        </div>

        {selectedStaff ? (
          <p className="mt-4 text-sm text-text-muted">
            Đang chỉnh lịch cho <span className="font-semibold text-primary">{selectedStaff.displayName}</span>.
          </p>
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
                  <tr key={row.dayOfWeek}>
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
