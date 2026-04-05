"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  Booking,
  BookingPaymentMethod,
  BookingPaymentStatus,
  BookingStatus,
  EffectOption,
  NailType,
  PolishStyle,
  SetType,
} from "@/src/domain/booking/types";
import type { Staff } from "@/src/domain/staff/types";

const LATE_SHOW_THRESHOLD_MINUTES = 15;
const NO_SHOW_THRESHOLD_MINUTES = 30;
const BANGKOK_TIME_ZONE = "Asia/Bangkok";

type TechnicianFilter = "all" | "upcoming" | "checked_in" | "late";
type BookingAction = "check_in" | "complete" | "no_show";
type AlertState = "none" | "late_show" | "no_show";

type TechnicianItem = {
  booking: Booking;
  assignedStaffName: string | null;
  staffGroupKey: string;
  staffGroupLabel: string;
};

type TechnicianPayload = {
  source: "database" | "memory_fallback";
  date: string;
  staffOptions: Staff[];
  items: TechnicianItem[];
};

type DecoratedBookingItem = TechnicianItem & {
  alertState: AlertState;
  alertMinutes: number | null;
};

export function TechnicianOpsScreen({
  initialDate,
  initialData,
}: {
  initialDate: string;
  initialData: TechnicianPayload;
}) {
  const [date, setDate] = useState(initialDate);
  const [staffId, setStaffId] = useState("all");
  const [runtimeSource, setRuntimeSource] = useState(initialData.source);
  const [staffOptions, setStaffOptions] = useState(initialData.staffOptions);
  const [items, setItems] = useState<TechnicianItem[]>(initialData.items);
  const [filter, setFilter] = useState<TechnicianFilter>("all");
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (date === initialDate && staffId === "all") {
      return;
    }

    void refreshBookings(date, staffId);
  }, [date, initialDate, staffId]);

  const decoratedItems = useMemo<DecoratedBookingItem[]>(() => {
    return items
      .map((item) => ({
        ...item,
        ...deriveAlertState(item.booking, date),
      }))
      .sort((left, right) => {
        if (left.alertState !== right.alertState) {
          return getAlertRank(left.alertState) - getAlertRank(right.alertState);
        }

        return left.booking.startTime.localeCompare(right.booking.startTime);
      });
  }, [date, items]);

  const urgentItems = decoratedItems.filter((item) => {
    return (
      item.alertState !== "none" &&
      !["checked_in", "completed", "cancelled"].includes(item.booking.status)
    );
  });

  const listItems = useMemo(() => {
    switch (filter) {
      case "upcoming":
        return decoratedItems.filter(
          (item) =>
            item.alertState === "none" &&
            !["checked_in", "completed", "cancelled", "no_show"].includes(
              item.booking.status,
            ),
        );
      case "checked_in":
        return decoratedItems.filter((item) => item.booking.status === "checked_in");
      case "late":
        return decoratedItems.filter((item) => item.alertState !== "none");
      default:
        return decoratedItems;
    }
  }, [decoratedItems, filter]);

  const detailItem =
    decoratedItems.find((item) => item.booking.id === detailBookingId) ?? null;
  const desktopDetailItem = detailItem ?? decoratedItems[0] ?? null;

  async function refreshBookings(nextDate: string, nextStaffId: string) {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/internal/bookings?date=${encodeURIComponent(nextDate)}&staffId=${encodeURIComponent(nextStaffId)}&status=all`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as TechnicianPayload & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Khong tai duoc lich ky thuat vien.");
      }

      setRuntimeSource(payload.source);
      setStaffOptions(payload.staffOptions);
      setItems(payload.items);
      setDetailBookingId((current) => {
        if (current && payload.items.some((item) => item.booking.id === current)) {
          return current;
        }

        return null;
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Khong tai duoc lich ky thuat vien.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(bookingId: string, action: BookingAction) {
    setActing(`${bookingId}:${action}`);
    setMessage(null);

    try {
      const response = await fetch(`/api/internal/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason:
            action === "no_show"
              ? "Danh dau no-show tu man technician."
              : undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Khong cap nhat duoc trang thai booking.");
      }

      await refreshBookings(date, staffId);
      setMessage("Da cap nhat trang thai booking.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Khong cap nhat duoc trang thai booking.",
      );
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#fdf9f6] text-[#2d2926]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#d8ccc5]/60 bg-[#fdf9f6]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#b57e7e]/20 bg-white text-[11px] font-bold text-[#b57e7e]">
              19
            </div>
            <div>
              <p className="font-serif text-lg font-black uppercase tracking-tight text-[#b57e7e]">
                19NAIL.STUDIO
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9d8a84]">
                Tho van hanh nhanh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/noi-bo/lich"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#b57e7e] transition hover:bg-[#f2ebe6]"
              aria-label="Mo lich dat noi bo"
            >
              <span className="text-lg leading-none">≣</span>
            </Link>
            <Link
              href="/noi-bo"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#b57e7e] transition hover:bg-[#f2ebe6]"
              aria-label="Ve khu quan ly noi bo"
            >
              <span className="text-lg leading-none">⌂</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 pb-28 pt-24 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h1 className="font-serif text-[2.7rem] font-bold leading-[0.95] text-[#2d2926] md:text-[3rem]">
                  Lich hom nay
                </h1>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#b08d60]">
                  {formatHeaderDate(date)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1e6de] text-[#c39b59]">
                <span className="text-xl leading-none">☷</span>
              </div>
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {[
                { id: "all", label: "Tat ca" },
                { id: "upcoming", label: "Sap toi" },
                { id: "checked_in", label: "Dang lam" },
                { id: "late", label: "Late" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id as TechnicianFilter)}
                  className={[
                    "whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-bold transition",
                    filter === item.id
                      ? "border-[#b57e7e] bg-[#b57e7e] text-white shadow-[0_10px_24px_rgba(181,126,126,0.22)]"
                      : "border-[#e6dcd6] bg-white text-[#7b6c66]",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mb-4 grid gap-2 md:grid-cols-[180px_minmax(0,220px)_1fr]">
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-full border border-[#e6dcd6] bg-white px-4 py-2.5 text-sm text-[#5a4d48]"
                aria-label="Ngay lam viec"
              />
              <select
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
                className="rounded-full border border-[#e6dcd6] bg-white px-4 py-2.5 text-sm text-[#5a4d48]"
                aria-label="Loc theo tho"
              >
                <option value="all">Tat ca tho</option>
                {staffOptions
                  .filter((staff) => staff.active)
                  .map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.displayName}
                    </option>
                  ))}
              </select>

              <div className="flex items-center justify-between rounded-full border border-[#eadfd8] bg-[#f7f3f0] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-[#8a7770]">
                <span>{runtimeSource === "database" ? "Shared database" : "Memory fallback"}</span>
                <span>{items.length} booking</span>
              </div>
            </div>

            {message ? (
              <div className="mb-4 rounded-2xl bg-[#fff4ef] px-4 py-3 text-sm text-[#a94d45]">
                {message}
              </div>
            ) : null}

            {!loading && urgentItems.length > 0 ? (
              <section className="mb-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-[2rem] font-bold text-[#2d2926]">
                    Can xu ly ngay
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1ec] px-3 py-1 text-xs font-bold text-[#d24d42]">
                    <span className="text-sm leading-none">!</span>
                    {urgentItems.length} booking tre
                  </span>
                </div>

                {urgentItems.map((item) => (
                  <AlertCard
                    key={item.booking.id}
                    item={item}
                    acting={acting}
                    onOpenDetails={() => setDetailBookingId(item.booking.id)}
                    onCheckIn={() => void handleAction(item.booking.id, "check_in")}
                    onNoShow={() => void handleAction(item.booking.id, "no_show")}
                  />
                ))}
              </section>
            ) : null}

            <section className="space-y-4">
              <h2 className="font-serif text-[2rem] font-bold text-[#2d2926]">
                {filter === "upcoming"
                  ? "Sap toi"
                  : filter === "checked_in"
                    ? "Dang lam"
                    : filter === "late"
                      ? "Canh bao"
                      : "Lich hom nay"}
              </h2>

              {loading ? (
                <div className="rounded-[1.6rem] border border-[#eadfd8] bg-white px-5 py-8 text-sm text-[#7d6d66] shadow-[0_12px_30px_rgba(45,41,38,0.05)]">
                  Dang tai lich ky thuat vien...
                </div>
              ) : null}

              {!loading && listItems.length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-[#eadfd8] bg-white px-5 py-8 text-sm leading-7 text-[#7d6d66]">
                  Khong co lich hen phu hop voi bo loc hien tai.
                </div>
              ) : null}

              {!loading && listItems.length > 0 ? (
                <div className="space-y-5">
                  {listItems.map((item) => (
                    <BookingCard
                      key={item.booking.id}
                      item={item}
                      acting={acting}
                      onPrimaryAction={() => {
                        const action =
                          item.booking.status === "checked_in"
                            ? "complete"
                            : "check_in";
                        return handleAction(item.booking.id, action);
                      }}
                      onNoShow={() => void handleAction(item.booking.id, "no_show")}
                      onOpenDetails={() => setDetailBookingId(item.booking.id)}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          </section>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <DesktopDetailPanel
                item={desktopDetailItem}
                acting={acting}
                onCheckIn={
                  desktopDetailItem
                    ? () => void handleAction(desktopDetailItem.booking.id, "check_in")
                    : undefined
                }
                onComplete={
                  desktopDetailItem
                    ? () => void handleAction(desktopDetailItem.booking.id, "complete")
                    : undefined
                }
                onNoShow={
                  desktopDetailItem
                    ? () => void handleAction(desktopDetailItem.booking.id, "no_show")
                    : undefined
                }
              />
            </div>
          </aside>
        </div>
      </main>

      <MobileDetailSheet
        item={detailItem}
        acting={acting}
        onClose={() => setDetailBookingId(null)}
        onCheckIn={
          detailItem ? () => void handleAction(detailItem.booking.id, "check_in") : undefined
        }
        onComplete={
          detailItem ? () => void handleAction(detailItem.booking.id, "complete") : undefined
        }
        onNoShow={
          detailItem ? () => void handleAction(detailItem.booking.id, "no_show") : undefined
        }
      />

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d8ccc5]/60 bg-[#fdf9f6]/96 px-3 py-3 shadow-[0_-10px_30px_rgba(45,41,38,0.08)] backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {[
            { href: "/noi-bo/tho", label: "Lich hen", active: true },
            { href: "/noi-bo/lich", label: "Lich dat", active: false },
            { href: "/noi-bo/nhan-su", label: "Nhan su", active: false },
            { href: "/noi-bo", label: "Quan ly", active: false },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-2xl px-2 py-2 text-center text-[11px] font-bold uppercase tracking-[0.08em]",
                item.active ? "bg-[#f1dcdc] text-[#b57e7e]" : "text-[#9a847c]",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function AlertCard({
  item,
  acting,
  onOpenDetails,
  onCheckIn,
  onNoShow,
}: {
  item: DecoratedBookingItem;
  acting: string | null;
  onOpenDetails: () => void;
  onCheckIn: () => void;
  onNoShow: () => void;
}) {
  const alertIsNoShow = item.alertState === "no_show" || item.booking.status === "no_show";
  const isCheckingIn = acting === `${item.booking.id}:check_in`;
  const isNoShowing = acting === `${item.booking.id}:no_show`;

  return (
    <article
      className={[
        "overflow-hidden rounded-xl border shadow-sm",
        alertIsNoShow
          ? "border-[#efc1bb] bg-[#fff0ec]"
          : "border-[#ead8b4] bg-[#fff7e8]",
      ].join(" ")}
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <span
              className={[
                "mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]",
                alertIsNoShow ? "text-[#ba1a1a]" : "text-[#775a19]",
              ].join(" ")}
            >
              {alertIsNoShow
                ? `No-show${item.alertMinutes ? ` (${item.alertMinutes} phut)` : ""}`
                : `Late-show${item.alertMinutes ? ` (${item.alertMinutes} phut)` : ""}`}
            </span>
            <h3 className="text-lg font-bold leading-tight text-[#2d2926]">
              {item.booking.customerSnapshot.fullName}
            </h3>
            <p className="mt-1 text-sm text-[#6d5b54]">{buildServiceSummary(item.booking)}</p>
          </div>
          <div className="text-right">
            <p
              className={[
                "text-sm font-bold",
                alertIsNoShow ? "text-[#ba1a1a]" : "text-[#775a19]",
              ].join(" ")}
            >
              {item.booking.startTime} - {item.booking.estimatedEndTime}
            </p>
            <p className="text-xs italic text-[#7a6c66]">
              {item.alertMinutes ? `Tre ${item.alertMinutes} phut` : getStatusLabel(item.booking.status)}
            </p>
          </div>
        </div>

        <div
          className={[
            "mb-4 rounded-lg p-3",
            alertIsNoShow ? "bg-[#fff7f5]" : "bg-white/80",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-3 text-sm text-[#5c4c46]">
            <span>{item.booking.customerSnapshot.phoneDisplay ?? item.booking.customerSnapshot.phoneE164}</span>
            <span>{getPaymentMethodLabel(item.booking.paymentSummary?.method)}</span>
          </div>
        </div>

        <div className={`grid gap-2 ${alertIsNoShow ? "grid-cols-3" : "grid-cols-2"}`}>
          <a
            href={`tel:${item.booking.customerSnapshot.phoneE164}`}
            className="flex flex-col items-center justify-center gap-1 rounded-lg border border-current/10 bg-white px-3 py-3 text-[#775a19] transition active:scale-[0.98]"
          >
            <span className="text-lg leading-none">☏</span>
            <span className="text-[10px] font-bold">Goi khach</span>
          </a>
          <button
            type="button"
            onClick={onCheckIn}
            disabled={isCheckingIn || item.booking.status === "checked_in" || item.booking.status === "completed"}
            className={[
              "flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-bold transition active:scale-[0.98]",
              alertIsNoShow
                ? "bg-[#3b2d2f] text-white"
                : "bg-[#775a19] text-white shadow-sm",
            ].join(" ")}
          >
            <span>{isCheckingIn ? "..." : "Check-in ngay"}</span>
          </button>
          {alertIsNoShow ? (
            <button
              type="button"
              onClick={onNoShow}
              disabled={isNoShowing || item.booking.status === "no_show"}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#ba1a1a] px-3 py-3 text-xs font-bold text-white transition active:scale-[0.98]"
            >
              <span>{isNoShowing ? "..." : "Danh dau no-show"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenDetails}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#775a19]/15 bg-white px-3 py-3 text-xs font-bold text-[#775a19] transition active:scale-[0.98]"
            >
              <span>Xem chi tiet</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function BookingCard({
  item,
  acting,
  onPrimaryAction,
  onNoShow,
  onOpenDetails,
}: {
  item: DecoratedBookingItem;
  acting: string | null;
  onPrimaryAction: () => Promise<void>;
  onNoShow: () => void;
  onOpenDetails: () => void;
}) {
  const statusTone = getCardTone(item);
  const primaryAction =
    item.booking.status === "checked_in"
      ? "Hoan thanh"
      : item.booking.status === "completed"
        ? null
        : "Check-in";

  return (
    <article
      className={[
        "relative overflow-hidden rounded-xl border-l-4 bg-white p-5 shadow-sm transition hover:shadow-md",
        statusTone.border,
      ].join(" ")}
    >
      <div className="absolute right-0 top-0 p-3">
        <span
          className={[
            "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
            statusTone.chip,
          ].join(" ")}
        >
          {getDisplayStatus(item)}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#b57e7e]">
            {item.booking.startTime} - {item.booking.estimatedEndTime}
          </span>
          {item.alertState !== "none" ? (
            <span
              className={[
                "rounded px-1.5 py-0.5 text-[10px] font-black uppercase italic",
                item.alertState === "no_show"
                  ? "bg-[#ffe1dd] text-[#ba1a1a]"
                  : "bg-[#fff0d3] text-[#775a19]",
              ].join(" ")}
            >
              {item.alertState === "no_show"
                ? `No-show ${item.alertMinutes ?? ""}`.trim()
                : `Tre ${item.alertMinutes ?? ""}'`.trim()}
            </span>
          ) : null}
        </div>
        <h3 className="mt-1 text-xl font-bold text-[#2d2926]">
          {item.booking.customerSnapshot.fullName}
        </h3>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9a8b84]">
          {item.booking.referenceCode} •{" "}
          {item.booking.customerSnapshot.phoneDisplay ?? item.booking.customerSnapshot.phoneE164}
        </p>
      </div>

      <div className="mb-5 rounded-lg bg-[#faf7f5] p-3">
        <div className="space-y-2.5 text-sm text-[#5f514c]">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{buildServiceSummary(item.booking)}</span>
            <span className="whitespace-nowrap text-xs font-semibold text-[#a38759]">
              {item.staffGroupLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[#7b6c66]">
            <span>{item.booking.guestCount} khach</span>
            <span>•</span>
            <span>{getNailTypeLabel(item.booking.nailType)}</span>
            <span>•</span>
            <span>{getPolishStyleLabel(item.booking.polishStyle)}</span>
            {getEffectSummary(item.booking.effects) ? (
              <>
                <span>•</span>
                <span>{getEffectSummary(item.booking.effects)}</span>
              </>
            ) : null}
          </div>
          <div className="flex items-center justify-between text-xs text-[#7b6c66]">
            <span>{getPaymentSummaryLabel(item.booking)}</span>
            <span>{item.booking.durationMinutes} phut</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {primaryAction ? (
          <button
            type="button"
            onClick={() => void onPrimaryAction()}
            disabled={acting === `${item.booking.id}:${item.booking.status === "checked_in" ? "complete" : "check_in"}`}
            className={[
              "flex-[2] rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-[0.98]",
              item.booking.status === "checked_in"
                ? "bg-[#b57e7e] shadow-[#b57e7e]/20"
                : "bg-[#2d2926] shadow-black/10",
            ].join(" ")}
          >
            {acting === `${item.booking.id}:${item.booking.status === "checked_in" ? "complete" : "check_in"}`
              ? "Dang xu ly..."
              : primaryAction}
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenDetails}
            className="flex-[2] rounded-xl border-2 border-[#eadfd8] bg-white py-3.5 text-sm font-bold text-[#6d5b54] transition active:scale-[0.98]"
          >
            Xem chi tiet
          </button>
        )}

        <a
          href={`tel:${item.booking.customerSnapshot.phoneE164}`}
          className="flex flex-1 items-center justify-center rounded-xl border-2 border-[#b57e7e]/15 bg-white py-3.5 text-[#b57e7e] transition active:scale-[0.98]"
          aria-label={`Goi ${item.booking.customerSnapshot.fullName}`}
        >
          <span className="text-xl leading-none">☏</span>
        </a>
        <button
          type="button"
          onClick={item.alertState === "none" ? onOpenDetails : onNoShow}
          className={[
            "flex flex-1 items-center justify-center rounded-xl py-3.5 transition active:scale-[0.98]",
            item.alertState === "none"
              ? "border-2 border-[#eadfd8] bg-white text-[#7b6c66]"
              : "bg-[#ba1a1a] text-white shadow-md shadow-[#ba1a1a]/20",
          ].join(" ")}
          aria-label={item.alertState === "none" ? "Xem chi tiet" : "Danh dau no-show"}
        >
          <span className="text-xl leading-none">{item.alertState === "none" ? "⋯" : "⊘"}</span>
        </button>
      </div>
    </article>
  );
}

function DesktopDetailPanel({
  item,
  acting,
  onCheckIn,
  onComplete,
  onNoShow,
}: {
  item: DecoratedBookingItem | null;
  acting: string | null;
  onCheckIn?: () => void;
  onComplete?: () => void;
  onNoShow?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] bg-[#fdf9f6] shadow-[0_0_40px_rgba(0,0,0,0.08)]">
      <div className="border border-[#eadfd8] bg-white p-6">
        <h2 className="font-serif text-3xl font-bold text-[#2d2926]">Chi tiet booking</h2>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-[#b08d60]">
          {item ? `Ma: ${item.booking.referenceCode}` : "Chon mot booking de xem"}
        </p>
      </div>
      <div className="max-h-[calc(100vh-240px)] overflow-y-auto bg-[#fdf9f6] p-6">
        {item ? (
          <DetailBody
            item={item}
            acting={acting}
            onCheckIn={onCheckIn}
            onComplete={onComplete}
            onNoShow={onNoShow}
          />
        ) : (
          <EmptyDetailState />
        )}
      </div>
    </div>
  );
}

function MobileDetailSheet({
  item,
  acting,
  onClose,
  onCheckIn,
  onComplete,
  onNoShow,
}: {
  item: DecoratedBookingItem | null;
  acting: string | null;
  onClose: () => void;
  onCheckIn?: () => void;
  onComplete?: () => void;
  onNoShow?: () => void;
}) {
  if (!item) {
    return null;
  }

  return (
    <div className="lg:hidden">
      <div
        className="fixed inset-0 z-40 bg-[#2d2926]/35 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-x-0 bottom-20 z-50 max-h-[78vh] overflow-hidden rounded-t-[2rem] bg-[#fdf9f6] shadow-[0_-10px_40px_rgba(0,0,0,0.16)]">
        <div className="flex items-start justify-between px-5 pt-6">
          <div>
            <h2 className="font-serif text-3xl font-bold text-[#2d2926]">Chi tiet booking</h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-[#b08d60]">
              Ma: {item.booking.referenceCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1edea] text-[#5a4d48]"
            aria-label="Dong chi tiet"
          >
            ×
          </button>
        </div>
        <div className="max-h-[calc(78vh-88px)] overflow-y-auto px-5 pb-6 pt-4">
          <DetailBody
            item={item}
            acting={acting}
            onCheckIn={onCheckIn}
            onComplete={onComplete}
            onNoShow={onNoShow}
          />
        </div>
      </div>
    </div>
  );
}

function DetailBody({
  item,
  acting,
  onCheckIn,
  onComplete,
  onNoShow,
}: {
  item: DecoratedBookingItem;
  acting: string | null;
  onCheckIn?: () => void;
  onComplete?: () => void;
  onNoShow?: () => void;
}) {
  const booking = item.booking;
  const effects = getEffectSummary(booking.effects) || "Khong co";
  const paymentSummary = getPaymentSummaryLabel(booking);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#f1e6de] text-center text-xl font-bold text-[#b57e7e]">
          {getCustomerInitials(booking.customerSnapshot.fullName)}
        </div>
        <div>
          <h3 className="font-serif text-2xl font-bold text-[#2d2926]">
            {booking.customerSnapshot.fullName}
          </h3>
          <p className="text-[#7b6c66]">
            {booking.customerSnapshot.phoneDisplay ?? booking.customerSnapshot.phoneE164}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded bg-[#f0ece8] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b6c66]">
              {getDisplayStatus(item)}
            </span>
            <span className="rounded bg-[#f7ebea] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b57e7e]">
              {booking.guestCount} khach
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DetailTimeCard label="Bat dau" value={booking.startTime} />
        <DetailTimeCard label="Ket thuc du kien" value={booking.estimatedEndTime} />
      </div>

      <div>
        <SectionLabel>Thong tin dich vu</SectionLabel>
        <div className="space-y-3">
          {[
            { label: "Tong hop", value: buildServiceSummary(booking) },
            { label: "Set", value: getSetTypeLabel(booking.setType) },
            { label: "Loai mong", value: getNailTypeLabel(booking.nailType) },
            { label: "Kieu son", value: getPolishStyleLabel(booking.polishStyle) },
            { label: "Effects", value: effects },
            { label: "Thoi luong", value: `${booking.durationMinutes} phut` },
            { label: "Tho", value: item.staffGroupLabel },
          ].map((row) => (
            <DetailRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Thanh toan</SectionLabel>
        <div className="space-y-3">
          <DetailRow
            label="Phuong thuc"
            value={getPaymentMethodLabel(booking.paymentSummary?.method)}
          />
          <DetailRow
            label="Trang thai"
            value={getPaymentStatusLabel(booking.paymentSummary?.status)}
          />
          <DetailRow label="Tom tat" value={paymentSummary} />
        </div>
      </div>

      {booking.notes ? (
        <div className="rounded-2xl border-l-4 border-[#775a19] bg-[#fff6e8] p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#775a19]">
            <span>i</span>
            <span>Ghi chu khach hang</span>
          </div>
          <p className="text-sm leading-7 text-[#5c4c46]">{booking.notes}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <ActionButton
          onClick={onCheckIn}
          disabled={!onCheckIn || acting === `${booking.id}:check_in` || booking.status === "checked_in" || booking.status === "completed"}
          tone="muted"
        >
          {acting === `${booking.id}:check_in` ? "Dang xu ly..." : "CHECK-IN"}
        </ActionButton>
        <ActionButton
          onClick={onComplete}
          disabled={!onComplete || acting === `${booking.id}:complete` || booking.status === "completed"}
          tone="primary"
        >
          {acting === `${booking.id}:complete` ? "Dang xu ly..." : "HOAN THANH"}
        </ActionButton>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={`tel:${booking.customerSnapshot.phoneE164}`}
          className="flex items-center justify-center rounded-xl border border-[#eadfd8] bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#5c4c46]"
        >
          Goi khach
        </a>
        <button
          type="button"
          onClick={onNoShow}
          disabled={!onNoShow || acting === `${booking.id}:no_show` || booking.status === "no_show"}
          className="rounded-xl bg-[#ba1a1a] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
        >
          {acting === `${booking.id}:no_show` ? "Dang xu ly..." : "Danh dau no-show"}
        </button>
      </div>
    </div>
  );
}

function EmptyDetailState() {
  return (
    <div className="rounded-[1.8rem] border border-dashed border-[#eadfd8] bg-white px-5 py-10 text-center text-sm leading-7 text-[#7d6d66]">
      Chon mot booking trong danh sach de xem chi tiet, thanh toan va thao tac nhanh.
    </div>
  );
}

function DetailTimeCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#f7f3f0] p-5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a8b84]">
        {label}
      </p>
      <p className="font-serif text-2xl font-bold text-[#2d2926]">{value}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h4 className="mb-4 flex items-center text-xs font-bold uppercase tracking-[0.2em] text-[#2d2926]">
      <span className="mr-3 h-px w-8 bg-[#c39b59]" />
      {children}
    </h4>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm">
      <span className="text-sm font-medium text-[#7d6d66]">{label}</span>
      <span className="text-right text-sm font-bold text-[#2d2926]">{value}</span>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: string;
  onClick?: () => void;
  disabled?: boolean;
  tone: "muted" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "h-20 rounded-2xl text-sm font-bold tracking-[0.12em] transition active:scale-[0.98] disabled:opacity-60",
        tone === "primary"
          ? "bg-gradient-to-tr from-[#7f5253] to-[#d9a2a2] text-white shadow-lg shadow-[#7f5253]/20"
          : "bg-[#e5e2df] text-[#2d2926]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function deriveAlertState(
  booking: Booking,
  selectedDate: string,
): { alertState: AlertState; alertMinutes: number | null } {
  if (booking.status === "completed" || booking.status === "cancelled") {
    return { alertState: "none", alertMinutes: null };
  }

  if (booking.status === "no_show") {
    const now = getBangkokNow();
    const minutesLate =
      selectedDate === now.date ? getElapsedMinutesSinceStart(booking.startTime, now.time) : null;
    return {
      alertState: "no_show",
      alertMinutes: minutesLate && minutesLate > 0 ? minutesLate : null,
    };
  }

  if (booking.status === "checked_in") {
    return { alertState: "none", alertMinutes: null };
  }

  const now = getBangkokNow();
  if (selectedDate !== now.date || booking.date !== now.date) {
    return { alertState: "none", alertMinutes: null };
  }

  const elapsedMinutes = getElapsedMinutesSinceStart(booking.startTime, now.time);
  if (elapsedMinutes >= NO_SHOW_THRESHOLD_MINUTES) {
    return { alertState: "no_show", alertMinutes: elapsedMinutes };
  }

  if (elapsedMinutes >= LATE_SHOW_THRESHOLD_MINUTES || booking.status === "late_show") {
    return { alertState: "late_show", alertMinutes: elapsedMinutes };
  }

  return { alertState: "none", alertMinutes: null };
}

function getAlertRank(state: AlertState) {
  switch (state) {
    case "no_show":
      return 0;
    case "late_show":
      return 1;
    default:
      return 2;
  }
}

function getCardTone(item: DecoratedBookingItem) {
  if (item.booking.status === "checked_in") {
    return {
      border: "border-[#c5a059]",
      chip: "border-[#c5a059]/20 bg-[#c5a059]/15 text-[#c5a059]",
    };
  }

  if (item.alertState === "no_show" || item.booking.status === "no_show") {
    return {
      border: "border-[#ba1a1a]",
      chip: "border-[#ba1a1a]/20 bg-[#ba1a1a]/10 text-[#ba1a1a]",
    };
  }

  if (item.alertState === "late_show" || item.booking.status === "late_show") {
    return {
      border: "border-[#ba7f1a]",
      chip: "border-[#ba7f1a]/20 bg-[#fff1d8] text-[#8c6218]",
    };
  }

  if (item.booking.status === "completed") {
    return {
      border: "border-[#4c9f70]",
      chip: "border-[#4c9f70]/20 bg-[#eaf7ef] text-[#2f7e54]",
    };
  }

  return {
    border: "border-[#b57e7e]",
    chip: "border-[#b57e7e]/20 bg-[#b57e7e]/10 text-[#b57e7e]",
  };
}

function getDisplayStatus(item: DecoratedBookingItem) {
  if (item.alertState === "no_show" || item.booking.status === "no_show") {
    return "No-show";
  }

  if (item.alertState === "late_show" || item.booking.status === "late_show") {
    return "Late-show";
  }

  return getStatusLabel(item.booking.status);
}

function getStatusLabel(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "Cho xac nhan";
    case "confirmed":
      return "Sap toi";
    case "checked_in":
      return "Dang lam";
    case "completed":
      return "Hoan thanh";
    case "cancelled":
      return "Da huy";
    case "no_show":
      return "No-show";
    case "late_show":
      return "Late-show";
    default:
      return status;
  }
}

function buildServiceSummary(booking: Booking) {
  return [
    getSetTypeLabel(booking.setType),
    getNailTypeLabel(booking.nailType),
    getPolishStyleLabel(booking.polishStyle),
    getEffectSummary(booking.effects),
  ]
    .filter(Boolean)
    .join(" • ");
}

function getSetTypeLabel(setType: SetType) {
  switch (setType) {
    case "hands":
      return "Tay";
    case "feet":
      return "Chan";
    case "both":
      return "Tay va chan";
    default:
      return setType;
  }
}

function getNailTypeLabel(nailType: NailType) {
  switch (nailType) {
    case "natural":
      return "Mong that";
    case "tip":
      return "Mong up";
    case "builder_gel":
      return "Dap gel";
    default:
      return nailType;
  }
}

function getPolishStyleLabel(polishStyle: PolishStyle) {
  switch (polishStyle) {
    case "gel_solid":
      return "Son tron gel";
    case "glitter":
      return "Son nhu";
    case "cat_eye":
      return "Mat meo";
    case "chrome":
      return "Trang guong";
    default:
      return polishStyle;
  }
}

function getEffectSummary(effects: EffectOption[]) {
  const labels = effects
    .filter((effect) => effect !== "none")
    .map((effect) => {
      switch (effect) {
        case "sticker":
          return "Sticker / da";
        case "design":
          return "Ve design";
        default:
          return effect;
      }
    });

  return labels.length > 0 ? labels.join(", ") : "";
}

function getPaymentMethodLabel(method?: BookingPaymentMethod | null) {
  switch (method) {
    case "pay_at_salon":
      return "Thanh toan tai salon";
    case "bank_transfer":
      return "Chuyen khoan";
    case "local_card":
      return "The noi dia";
    default:
      return "Chua chon thanh toan";
  }
}

function getPaymentStatusLabel(status?: BookingPaymentStatus | null) {
  switch (status) {
    case "payment_not_started":
      return "Chua bat dau";
    case "pay_at_salon":
      return "Thanh toan khi den lich";
    case "awaiting_bank_transfer":
      return "Cho chuyen khoan";
    case "card_details_captured":
      return "Da nhap thong tin the";
    case "paid":
      return "Da thanh toan";
    case "refunded":
      return "Da hoan tien";
    case "voided":
      return "Da huy";
    default:
      return "Chua cap nhat";
  }
}

function getPaymentSummaryLabel(booking: Booking) {
  const method = getPaymentMethodLabel(booking.paymentSummary?.method);
  const status = getPaymentStatusLabel(booking.paymentSummary?.status);
  const detail = booking.paymentSummary?.detailValue ?? booking.paymentSummary?.detailLabel;

  return [method, status, detail].filter(Boolean).join(" • ");
}

function getCustomerInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getElapsedMinutesSinceStart(startTime: string, nowTime: string) {
  return convertTimeToMinutes(nowTime) - convertTimeToMinutes(startTime);
}

function convertTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getBangkokNow() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BANGKOK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  const hour = parts.hour === "24" ? "00" : parts.hour;

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${hour}:${parts.minute}`,
  };
}

function formatHeaderDate(date: string) {
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    timeZone: BANGKOK_TIME_ZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return formatter.format(new Date(`${date}T12:00:00+07:00`));
}
