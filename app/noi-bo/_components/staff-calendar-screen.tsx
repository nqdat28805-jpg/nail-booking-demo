"use client";

import { useEffect, useMemo, useState } from "react";
import type { Booking, BookingStatus } from "@/src/domain/booking/types";
import type { Staff } from "@/src/domain/staff/types";

type CalendarBookingItem = {
  booking: Booking;
  assignedStaffName: string | null;
  staffGroupKey: string;
  staffGroupLabel: string;
};

type CalendarApiResponse = {
  source: "database" | "memory_fallback";
  date: string;
  staffOptions: Staff[];
  items: CalendarBookingItem[];
};

type BookingAction = "confirm" | "check_in" | "complete" | "cancel";

export function StaffCalendarScreen() {
  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [staffId, setStaffId] = useState("all");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [runtimeSource, setRuntimeSource] =
    useState<CalendarApiResponse["source"]>("memory_fallback");
  const [staffOptions, setStaffOptions] = useState<Staff[]>([]);
  const [items, setItems] = useState<CalendarBookingItem[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<BookingAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadBookings();
  }, [date, staffId, status]);

  const groupedItems = useMemo(() => {
    const grouped = new Map<string, { label: string; items: CalendarBookingItem[] }>();

    for (const item of items) {
      const current = grouped.get(item.staffGroupKey);
      if (current) {
        current.items.push(item);
      } else {
        grouped.set(item.staffGroupKey, {
          label: item.staffGroupLabel,
          items: [item],
        });
      }
    }

    return Array.from(grouped.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      items: value.items,
    }));
  }, [items]);

  const selectedItem =
    items.find((item) => item.booking.id === selectedBookingId) ?? items[0] ?? null;

  async function loadBookings() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/internal/bookings?date=${encodeURIComponent(date)}&staffId=${encodeURIComponent(staffId)}&status=${encodeURIComponent(status)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as CalendarApiResponse;

      if (!response.ok) {
        throw new Error((payload as any).message ?? "Khong tai duoc bookings.");
      }

      setRuntimeSource(payload.source);
      setStaffOptions(payload.staffOptions);
      setItems(payload.items);
      setSelectedBookingId((current) =>
        payload.items.some((item) => item.booking.id === current)
          ? current
          : payload.items[0]?.booking.id ?? null,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Khong tai duoc bookings.");
      setItems([]);
      setSelectedBookingId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: BookingAction) {
    if (!selectedItem) {
      return;
    }

    setActing(action);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/internal/bookings/${selectedItem.booking.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reason:
              action === "cancel"
                ? "Cancelled from staff calendar MVP."
                : undefined,
          }),
        },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          (payload as { message?: string } | null)?.message ??
            "Khong cap nhat duoc booking.",
        );
      }

      setMessage("Da cap nhat trang thai booking.");
      await loadBookings();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Khong cap nhat duoc booking.",
      );
    } finally {
      setActing(null);
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[2rem] border border-border/80 bg-white/88 p-6 shadow-[0_18px_36px_rgba(37,28,28,0.06)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
              Staff calendar
            </p>
            <h1 className="font-serif text-3xl text-foreground">Lich dat cho staff</h1>
            <p className="text-sm leading-7 text-text-muted">
              Bookings o day duoc doc tu cung shared source of truth voi customer flow.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm text-text-muted">
            Runtime: <span className="font-semibold text-primary">{runtimeSource}</span>
          </div>
        </div>
      </header>

      <section className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_auto]">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Ngay</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Staff</span>
            <select
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
            >
              <option value="all">Tat ca</option>
              {staffOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Trang thai</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as BookingStatus | "all")}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
            >
              <option value="all">Tat ca</option>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="checked_in">checked_in</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
              <option value="no_show">no_show</option>
              <option value="late_show">late_show</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void loadBookings()}
              className="w-full rounded-full border border-border px-4 py-3 text-sm font-semibold text-text-muted"
            >
              Lam moi
            </button>
          </div>
        </div>

        {message ? (
          <p className="mt-4 text-sm leading-6 text-primary">{message}</p>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <section className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-foreground">Agenda theo staff</h2>
            <span className="text-sm text-text-muted">{formatDateLabel(date)}</span>
          </div>

          {loading ? (
            <p className="mt-5 text-sm text-text-muted">Dang tai bookings...</p>
          ) : groupedItems.length === 0 ? (
            <div className="mt-5 rounded-[1.4rem] border border-dashed border-border/80 bg-surface px-5 py-8 text-sm leading-7 text-text-muted">
              Chua co booking nao trong ngay nay voi bo loc hien tai.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {groupedItems.map((group) => (
                <article key={group.key} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-primary">{group.label}</h3>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid gap-3">
                    {group.items.map((item) => (
                      <button
                        key={item.booking.id}
                        type="button"
                        onClick={() => setSelectedBookingId(item.booking.id)}
                        className={[
                          "rounded-[1.35rem] border px-5 py-4 text-left transition",
                          selectedItem?.booking.id === item.booking.id
                            ? "border-primary bg-primary/6 shadow-[0_12px_24px_rgba(138,90,93,0.12)]"
                            : "border-border/80 bg-surface hover:border-primary/30",
                        ].join(" ")}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {item.booking.startTime} - {item.booking.estimatedEndTime}
                              </span>
                              <StatusBadge status={item.booking.status} />
                            </div>
                            <p className="text-sm font-medium text-primary">
                              {item.booking.customerSnapshot.fullName}
                            </p>
                            <p className="text-sm leading-6 text-text-muted">
                              {item.booking.pricingSummary?.serviceDisplayLabel ??
                                buildServiceLabel(item.booking)}
                            </p>
                          </div>
                          <div className="space-y-1 text-sm text-text-muted md:text-right">
                            <p>{item.booking.referenceCode}</p>
                            <p>{formatPaymentMethod(item.booking.paymentSummary?.method)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]">
          <h2 className="font-serif text-2xl text-foreground">Chi tiet booking</h2>

          {!selectedItem ? (
            <p className="mt-5 text-sm leading-7 text-text-muted">
              Chon mot booking o agenda ben trai de xem chi tiet va thao tac.
            </p>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="rounded-[1.35rem] border border-border/80 bg-surface px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-primary">
                    {selectedItem.booking.referenceCode}
                  </p>
                  <StatusBadge status={selectedItem.booking.status} />
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  <InfoRow label="Khach hang" value={selectedItem.booking.customerSnapshot.fullName} />
                  <InfoRow
                    label="So dien thoai"
                    value={selectedItem.booking.customerSnapshot.phoneDisplay ?? selectedItem.booking.customerSnapshot.phoneE164}
                  />
                  <InfoRow
                    label="Dich vu"
                    value={
                      selectedItem.booking.pricingSummary?.serviceDisplayLabel ??
                      buildServiceLabel(selectedItem.booking)
                    }
                  />
                  <InfoRow label="Ngay" value={formatDateLabel(selectedItem.booking.date)} />
                  <InfoRow
                    label="Khung gio"
                    value={`${selectedItem.booking.startTime} - ${selectedItem.booking.estimatedEndTime}`}
                  />
                  <InfoRow
                    label="Tho"
                    value={selectedItem.assignedStaffName ?? "Pool / chua chi dinh"}
                  />
                  <InfoRow
                    label="Thanh toan"
                    value={formatPaymentMethod(selectedItem.booking.paymentSummary?.method)}
                  />
                  <InfoRow label="Nguon" value={`${selectedItem.booking.source} / ${selectedItem.booking.channel}`} />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Cap nhat trang thai</p>
                <div className="grid gap-2">
                  {getAvailableActions(selectedItem.booking.status).map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={acting !== null}
                      onClick={() => void handleAction(action)}
                      className="rounded-full border border-primary/20 bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
                    >
                      {acting === action ? "Dang xu ly..." : actionLabelMap[action]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]",
        status === "pending"
          ? "bg-[#f6ead5] text-[#9c6a26]"
          : status === "confirmed"
            ? "bg-[#e3f0fb] text-[#245c8f]"
            : status === "checked_in"
              ? "bg-[#e4f5e8] text-[#28753c]"
              : status === "completed"
                ? "bg-[#ece8f8] text-[#5f4d8d]"
                : "bg-[#f4e7e2] text-[#8b5b4d]",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

const actionLabelMap: Record<BookingAction, string> = {
  confirm: "Xac nhan booking",
  check_in: "Check-in",
  complete: "Hoan thanh",
  cancel: "Huy booking",
};

function getAvailableActions(status: BookingStatus) {
  const actions: BookingAction[] = [];

  if (status === "pending") {
    actions.push("confirm", "cancel");
  }

  if (status === "confirmed") {
    actions.push("check_in", "cancel");
  }

  if (status === "checked_in") {
    actions.push("complete", "cancel");
  }

  return actions;
}

function buildServiceLabel(booking: Booking) {
  const effectLabel = booking.effects.filter((effect) => effect !== "none").join(", ");
  return [booking.setType, booking.nailType, booking.polishStyle, effectLabel]
    .filter(Boolean)
    .join(" · ");
}

function formatPaymentMethod(method?: Booking["paymentSummary"] extends infer T ? any : never) {
  switch (method) {
    case "bank_transfer":
      return "Chuyen khoan";
    case "local_card":
      return "The noi dia";
    case "pay_at_salon":
      return "Thanh toan tai salon";
    default:
      return "Chua co";
  }
}

function formatDateLabel(isoDate: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(`${isoDate}T12:00:00`));
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}
