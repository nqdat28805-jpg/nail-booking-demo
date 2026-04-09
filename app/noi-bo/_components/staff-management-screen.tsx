"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { Staff } from "@/src/domain/staff/types";

type StaffApiResponse = {
  source: "database" | "memory_fallback";
  items: Staff[];
};

type StaffFormState = {
  id: string | null;
  displayName: string;
  initials: string;
  sortOrder: string;
  active: boolean;
};

const DEFAULT_FORM: StaffFormState = {
  id: null,
  displayName: "",
  initials: "",
  sortOrder: "0",
  active: true,
};

export function StaffManagementScreen() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [, setRuntimeSource] =
    useState<StaffApiResponse["source"]>("memory_fallback");
  const [form, setForm] = useState<StaffFormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadStaff();
  }, []);

  async function loadStaff() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/internal/staff", { cache: "no-store" });
      const payload = (await response.json()) as StaffApiResponse;
      setStaff(payload.items);
      setRuntimeSource(payload.source);
    } catch {
      setMessage("Không tải được danh sách nhân sự.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        form.id ? `/api/internal/staff/${form.id}` : "/api/internal/staff",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: form.displayName,
            initials: form.initials,
            sortOrder: Number(form.sortOrder || 0),
            active: form.active,
          }),
        },
      );

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Không lưu được nhân sự.");
      }

      setForm(DEFAULT_FORM);
      setMessage(form.id ? "Đã cập nhật nhân sự." : "Đã thêm nhân sự mới.");
      await loadStaff();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lưu được nhân sự.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: Staff) {
    setMessage(null);

    try {
      const response = await fetch(`/api/internal/staff/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Không cập nhật được trạng thái.");
      }

      setMessage(`Đã ${item.active ? "ẩn" : "kích hoạt"} ${item.displayName}.`);
      await loadStaff();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không cập nhật được trạng thái.",
      );
    }
  }

  function startEditing(item: Staff) {
    setForm({
      id: item.id,
      displayName: item.displayName,
      initials: item.initials,
      sortOrder: String(item.sortOrder ?? 0),
      active: item.active,
    });
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[2rem] border border-border/80 bg-white/88 p-6 shadow-[0_18px_36px_rgba(37,28,28,0.06)]">
        <h1 className="font-serif text-3xl text-foreground">Quản lý nhân sự</h1>
      </header>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]"
        >
          <h2 className="font-serif text-2xl text-foreground">
            {form.id ? "Chỉnh sửa nhân sự" : "Thêm nhân sự"}
          </h2>
          <div className="mt-5 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Tên hiển thị</span>
              <input
                value={form.displayName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, displayName: event.target.value }))
                }
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
                placeholder="Ví dụ: Thảo"
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Ký hiệu avatar</span>
              <input
                value={form.initials}
                onChange={(event) =>
                  setForm((current) => ({ ...current, initials: event.target.value }))
                }
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm uppercase"
                placeholder="TH"
                maxLength={3}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Thứ tự hiển thị</span>
              <input
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sortOrder: event.target.value }))
                }
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
                inputMode="numeric"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-border/80 bg-surface px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm((current) => ({ ...current, active: event.target.checked }))
                }
              />
              Cho hiển thị và tham gia lịch đặt
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : form.id ? "Lưu thay đổi" : "Thêm nhân sự"}
            </button>
            {form.id ? (
              <button
                type="button"
                onClick={() => setForm(DEFAULT_FORM)}
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-text-muted"
              >
                Hủy sửa
              </button>
            ) : null}
          </div>

          {message ? (
            <p className="mt-4 text-sm leading-6 text-primary">{message}</p>
          ) : null}
        </form>

        <section className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-foreground">Danh sách nhân sự</h2>
            <button
              type="button"
              onClick={() => void loadStaff()}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-muted"
            >
              Làm mới
            </button>
          </div>

          {loading ? (
            <p className="mt-5 text-sm text-text-muted">Đang tải dữ liệu...</p>
          ) : (
            <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-border/80">
              <table className="min-w-full divide-y divide-border/80 text-left text-sm">
                <thead className="bg-surface text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tên</th>
                    <th className="px-4 py-3 font-medium">Avatar</th>
                    <th className="px-4 py-3 font-medium">Sắp xếp</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 bg-white">
                  {staff.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {item.displayName}
                      </td>
                      <td className="px-4 py-3 text-text-muted">{item.initials}</td>
                      <td className="px-4 py-3 text-text-muted">{item.sortOrder ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            item.active
                              ? "bg-[#e4f5e8] text-[#28753c]"
                              : "bg-[#f4e7e2] text-[#8b5b4d]",
                          ].join(" ")}
                        >
                          {item.active ? "Đang hoạt động" : "Đang ẩn"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-text-muted"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleActive(item)}
                            className="rounded-full border border-primary/25 px-3 py-1.5 text-xs font-semibold text-primary"
                          >
                            {item.active ? "Tắt" : "Bật"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
