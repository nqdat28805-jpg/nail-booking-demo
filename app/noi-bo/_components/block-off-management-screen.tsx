"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { BlockOff, Staff } from "@/src/domain/staff/types";

type StaffApiResponse = {
  items: Staff[];
};

type BlockOffApiResponse = {
  source: "database" | "memory_fallback";
  items: BlockOff[];
};

type BlockOffFormState = {
  scope: "branch" | "staff";
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
};

const DEFAULT_FORM: BlockOffFormState = {
  scope: "branch",
  staffId: "",
  date: "",
  startTime: "12:00",
  endTime: "13:00",
  reason: "",
};

export function BlockOffManagementScreen() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [items, setItems] = useState<BlockOff[]>([]);
  const [runtimeSource, setRuntimeSource] =
    useState<BlockOffApiResponse["source"]>("memory_fallback");
  const [form, setForm] = useState<BlockOffFormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([loadStaff(), loadBlockOffs()]);
  }, []);

  async function loadStaff() {
    const response = await fetch("/api/internal/staff", { cache: "no-store" });
    const payload = (await response.json()) as StaffApiResponse;
    setStaff(payload.items);
  }

  async function loadBlockOffs() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/internal/block-off", { cache: "no-store" });
      const payload = (await response.json()) as BlockOffApiResponse;
      setItems(payload.items);
      setRuntimeSource(payload.source);
    } catch {
      setMessage("Không tải được block-off.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/internal/block-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: form.scope,
          staffId: form.scope === "staff" ? form.staffId : null,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          reason: form.reason,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Không tạo được block-off.");
      }

      setForm(DEFAULT_FORM);
      setMessage("Đã tạo block-off mới.");
      await loadBlockOffs();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tạo được block-off.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setMessage(null);

    try {
      const response = await fetch(`/api/internal/block-off/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Không xóa được block-off.");
      }

      setMessage("Đã xóa block-off.");
      await loadBlockOffs();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không xóa được block-off.");
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[2rem] border border-border/80 bg-white/88 p-6 shadow-[0_18px_36px_rgba(37,28,28,0.06)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
              Block-off
            </p>
            <h1 className="font-serif text-3xl text-foreground">Quản lý thời gian khóa</h1>
            <p className="text-sm leading-7 text-text-muted">
              Block-off salon-wide hoặc theo staff sẽ phản ánh trực tiếp sang customer availability.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm text-text-muted">
            Runtime: <span className="font-semibold text-primary">{runtimeSource}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleCreate}
          className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]"
        >
          <h2 className="font-serif text-2xl text-foreground">Tạo block-off</h2>
          <div className="mt-5 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Phạm vi</span>
              <select
                value={form.scope}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scope: event.target.value as BlockOffFormState["scope"],
                  }))
                }
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
              >
                <option value="branch">Salon-wide</option>
                <option value="staff">Theo staff</option>
              </select>
            </label>

            {form.scope === "staff" ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Nhân sự</span>
                <select
                  value={form.staffId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, staffId: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
                  required
                >
                  <option value="">Chọn staff</option>
                  {staff.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.displayName}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Ngày</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, date: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Lý do</span>
                <input
                  value={form.reason}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, reason: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
                  placeholder="Ví dụ: đào tạo / nghỉ trưa / bảo trì"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Bắt đầu</span>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, startTime: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Kết thúc</span>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, endTime: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
                  required
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Tạo block-off"}
          </button>

          {message ? (
            <p className="mt-4 text-sm leading-6 text-primary">{message}</p>
          ) : null}
        </form>

        <section className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-foreground">Block-off hiện có</h2>
            <button
              type="button"
              onClick={() => void loadBlockOffs()}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-muted"
            >
              Làm mới
            </button>
          </div>

          {loading ? (
            <p className="mt-5 text-sm text-text-muted">Đang tải dữ liệu...</p>
          ) : (
            <div className="mt-5 space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-text-muted">Chưa có block-off nào.</p>
              ) : (
                items.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-4 rounded-[1.35rem] border border-border/80 bg-surface px-5 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-primary">
                          {item.scope === "staff" ? "Theo staff" : "Salon-wide"}
                        </p>
                        {item.staffId ? (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-text-muted">
                            {staff.find((member) => member.id === item.staffId)?.displayName ??
                              item.staffId}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-foreground">
                        {formatDate(item.startAt)} · {formatTimeRange(item.startAt, item.endAt)}
                      </p>
                      <p className="text-sm leading-6 text-text-muted">
                        {item.reason ?? item.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      className="rounded-full border border-primary/25 px-4 py-2 text-sm font-semibold text-primary"
                    >
                      Xóa
                    </button>
                  </article>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function formatDate(isoDateTime: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(isoDateTime));
}

function formatTimeRange(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  return `${String(start.getHours()).padStart(2, "0")}:${String(
    start.getMinutes(),
  ).padStart(2, "0")} - ${String(end.getHours()).padStart(2, "0")}:${String(
    end.getMinutes(),
  ).padStart(2, "0")}`;
}
