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

type CompactCardAction =
  | {
      kind: "check_in";
      label: string;
    }
  | {
      kind: "complete";
      label: string;
    }
  | {
      kind: "contact";
      label: string;
      href: string;
    }
  | {
      kind: "detail";
      label: string;
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
        if (left.booking.startTime !== right.booking.startTime) {
          return left.booking.startTime.localeCompare(right.booking.startTime);
        }

        return left.booking.referenceCode.localeCompare(right.booking.referenceCode);
      });
  }, [date, items]);

  const urgentItems = useMemo(() => {
    return decoratedItems.filter(
      (item) =>
        item.alertState !== "none" &&
        !["checked_in", "completed", "cancelled"].includes(item.booking.status),
    );
  }, [decoratedItems]);

  const checkedInItems = useMemo(() => {
    return decoratedItems.filter((item) => item.booking.status === "checked_in");
  }, [decoratedItems]);

  const nextUpcomingItem = useMemo(() => {
    return (
      decoratedItems.find((item) => {
        if (!["pending", "confirmed"].includes(item.booking.status)) {
          return false;
        }

        if (item.alertState !== "none") {
          return false;
        }

        return isUpcomingBooking(item.booking, date);
      }) ?? null
    );
  }, [date, decoratedItems]);

  const regularItems = useMemo(() => {
    const excludedIds = new Set<string>(urgentItems.map((item) => item.booking.id));

    if (nextUpcomingItem) {
      excludedIds.add(nextUpcomingItem.booking.id);
    }

    return decoratedItems.filter((item) => {
      if (excludedIds.has(item.booking.id)) {
        return false;
      }

      if (["completed", "cancelled"].includes(item.booking.status)) {
        return false;
      }

      return true;
    });
  }, [decoratedItems, nextUpcomingItem, urgentItems]);

  const visibleTimelineItems = useMemo(() => {
    switch (filter) {
      case "checked_in":
        return checkedInItems;
      case "late":
        return urgentItems;
      case "upcoming":
        return regularItems.filter(
          (item) =>
            ["pending", "confirmed"].includes(item.booking.status) &&
            item.alertState === "none",
        );
      default:
        return regularItems;
    }
  }, [checkedInItems, filter, regularItems, urgentItems]);

  const selectedItem =
    decoratedItems.find((item) => item.booking.id === detailBookingId) ?? null;

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
        throw new Error(payload.message ?? "Không tải được lịch kỹ thuật viên.");
      }

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
        error instanceof Error ? error.message : "Không tải được lịch kỹ thuật viên.",
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
              ? "Đánh dấu vắng mặt từ màn kỹ thuật viên."
              : undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Không cập nhật được trạng thái lịch hẹn.");
      }

      await refreshBookings(date, staffId);
      setMessage("Đã cập nhật trạng thái lịch hẹn.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không cập nhật được trạng thái lịch hẹn.",
      );
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#fdf9f6] text-[#1c1b1a]">
      <header className="sticky top-0 z-40 border-b border-[#e8dfd9] bg-[#f8f3ef]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4 md:max-w-lg">
          <div className="flex items-center gap-2.5">
            <div
              aria-hidden="true"
              className="h-8 w-8 rounded-full border border-[#d8c2bf] bg-white"
            />
            <span className="font-serif text-[1.35rem] font-bold tracking-tight text-[#7f5253]">
              19NAIL.STUDIO
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/noi-bo/lich"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#8a6a63] transition hover:bg-white"
              aria-label="Mở lịch nội bộ"
            >
              <span className="text-lg leading-none">⌕</span>
            </Link>
            <Link
              href="/noi-bo"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#8a6a63] transition hover:bg-white"
              aria-label="Mở khu quản lý nội bộ"
            >
              <span className="text-lg leading-none">☰</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-28 pt-5 md:max-w-lg">
        <section className="space-y-1">
          <h1 className="font-serif text-[2.2rem] font-bold leading-[0.95] text-[#2d2926]">
            Lịch hôm nay
          </h1>
          <p className="text-base text-[#8a7770]">{formatHeaderDate(date)}</p>
        </section>

        <section className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {[
            { id: "all", label: "Tất cả" },
            { id: "upcoming", label: "Sắp tới" },
            { id: "checked_in", label: "Đang làm" },
            { id: "late", label: "Trễ" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as TechnicianFilter)}
              className={[
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                filter === item.id
                  ? "bg-[#c99292] text-white shadow-[0_10px_24px_rgba(201,146,146,0.22)]"
                  : "border border-[#eadfd8] bg-white text-[#7c6a65]",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </section>

        <section className="mt-4 grid grid-cols-[1fr_1fr] gap-2">
          <label className="flex items-center gap-2 rounded-2xl border border-[#eadfd8] bg-white px-4 py-3 text-sm text-[#6d5b54]">
            <span className="text-[#b08d60]">📅</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
              aria-label="Ngày làm việc"
            />
          </label>

          <label className="flex items-center gap-2 rounded-2xl border border-[#eadfd8] bg-white px-4 py-3 text-sm text-[#6d5b54]">
            <span className="text-[#b08d60]">🧑</span>
            <select
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
              aria-label="Lọc theo thợ"
            >
              <option value="all">Tất cả thợ</option>
              {staffOptions
                .filter((staff) => staff.active)
                .map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.displayName}
                  </option>
                ))}
            </select>
          </label>
        </section>

        {message ? (
          <div className="mt-4 rounded-2xl bg-[#fff2ed] px-4 py-3 text-sm text-[#9d4d46]">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-[1.75rem] bg-white px-5 py-8 text-sm text-[#7c6a65] shadow-[0_8px_30px_rgba(28,27,26,0.05)]">
            Đang tải lịch kỹ thuật viên...
          </div>
        ) : null}

        {!loading && filter !== "checked_in" && urgentItems.length > 0 ? (
          <section className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[1.75rem] font-bold text-[#2d2926]">
                Cần xử lý ngay
              </h2>
              <span className="rounded-full bg-[#fff1ee] px-3 py-1 text-xs font-semibold text-[#d24d42]">
                {urgentItems.length} lịch trễ
              </span>
            </div>

            {urgentItems.map((item) => (
              <UrgentBookingCard
                key={item.booking.id}
                item={item}
                acting={acting}
                onOpen={() => setDetailBookingId(item.booking.id)}
                onAction={(action) => {
                  if (action === "check_in") {
                    void handleAction(item.booking.id, "check_in");
                  }
                }}
              />
            ))}
          </section>
        ) : null}

        {!loading && filter !== "checked_in" && filter !== "late" && nextUpcomingItem ? (
          <section className="mt-8">
            <SpotlightCard
              item={nextUpcomingItem}
              acting={acting}
              onOpen={() => setDetailBookingId(nextUpcomingItem.booking.id)}
              onAction={(action) => {
                if (action === "check_in") {
                  void handleAction(nextUpcomingItem.booking.id, "check_in");
                }
              }}
            />
          </section>
        ) : null}

        <section className="mt-8 space-y-4">
          <h2 className="flex items-center gap-2 font-serif text-[1.6rem] font-bold text-[#2d2926]">
            <span className="text-[#8c6b1e]">◔</span>
            {getSectionHeading(filter)}
          </h2>

          {!loading && visibleTimelineItems.length === 0 ? (
            <div className="rounded-[1.75rem] bg-white px-5 py-8 text-sm leading-7 text-[#7c6a65] shadow-[0_8px_30px_rgba(28,27,26,0.05)]">
              Không có lịch hẹn phù hợp với bộ lọc hiện tại.
            </div>
          ) : null}

          {!loading && visibleTimelineItems.length > 0 ? (
            <div className="relative space-y-4 before:absolute before:bottom-6 before:left-[1.25rem] before:top-3 before:w-px before:bg-[#eadfd8]">
              {visibleTimelineItems.map((item) => (
                <TimelineBookingItem
                  key={item.booking.id}
                  item={item}
                  isNextUpcoming={nextUpcomingItem?.booking.id === item.booking.id}
                  acting={acting}
                  onOpen={() => setDetailBookingId(item.booking.id)}
                  onAction={(action) => {
                    if (action === "check_in") {
                      void handleAction(item.booking.id, "check_in");
                    } else if (action === "complete") {
                      void handleAction(item.booking.id, "complete");
                    }
                  }}
                />
              ))}
            </div>
          ) : null}
        </section>
      </main>

      <BookingDetailOverlay
        item={selectedItem}
        acting={acting}
        onClose={() => setDetailBookingId(null)}
        onCheckIn={
          selectedItem ? () => void handleAction(selectedItem.booking.id, "check_in") : undefined
        }
        onComplete={
          selectedItem ? () => void handleAction(selectedItem.booking.id, "complete") : undefined
        }
        onNoShow={
          selectedItem ? () => void handleAction(selectedItem.booking.id, "no_show") : undefined
        }
      />

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e8dfd9] bg-[#fffdfa]/96 px-4 py-2.5 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 text-center text-[11px] md:max-w-lg">
          {[
            { href: "/noi-bo/tho", label: "Lịch hẹn", icon: "🗓", active: true },
            { href: "/noi-bo/lich", label: "Lịch nội bộ", icon: "⌂", active: false },
            { href: "/noi-bo/nhan-su", label: "Nhân sự", icon: "👥", active: false },
            { href: "/noi-bo", label: "Quản lý", icon: "⚙", active: false },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-2xl px-2 py-2 text-[#9a847c] transition",
                item.active ? "bg-[#f5e7e4] text-[#b57e7e]" : "hover:bg-white",
              ].join(" ")}
            >
              <span className="block text-base leading-none">{item.icon}</span>
              <span className="mt-1 block font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function SpotlightCard({
  item,
  acting,
  onOpen,
  onAction,
}: {
  item: DecoratedBookingItem;
  acting: string | null;
  onOpen: () => void;
  onAction: (action: "check_in" | "complete") => void;
}) {
  const primaryAction = getPrimaryAction(item, true);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="rounded-[2rem] bg-white px-6 py-6 shadow-[0_14px_36px_rgba(28,27,26,0.06)]"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-full bg-[#ffe3ab] px-4 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#785a1a]">
          Tiếp theo
        </span>
        <span className="font-serif text-xl italic text-[#9f7475]">
          {item.booking.startTime} - {item.booking.estimatedEndTime}
        </span>
      </div>

      <div className="mt-5 space-y-2">
        <h3 className="font-serif text-[2rem] font-bold leading-tight text-[#2d2926]">
          {getDisplayCustomerName(item.booking.customerSnapshot.fullName)}
        </h3>
        <p className="text-base text-[#7c6a65]">{getCompactServiceSummary(item.booking)}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <CompactMetaChip>{getNailTypeLabel(item.booking.nailType)}</CompactMetaChip>
        <CompactMetaChip>{getPolishStyleLabel(item.booking.polishStyle)}</CompactMetaChip>
      </div>

      <div className="mt-6">
        <PrimaryActionButton
          action={primaryAction}
          acting={acting}
          bookingId={item.booking.id}
          onAction={onAction}
          onOpen={onOpen}
        />
      </div>
    </article>
  );
}

function UrgentBookingCard({
  item,
  acting,
  onOpen,
  onAction,
}: {
  item: DecoratedBookingItem;
  acting: string | null;
  onOpen: () => void;
  onAction: (action: "check_in" | "complete") => void;
}) {
  const isNoShow = item.alertState === "no_show" || item.booking.status === "no_show";
  const primaryAction = getPrimaryAction(item, false);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={[
        "rounded-[1.6rem] px-5 py-5 shadow-[0_10px_24px_rgba(28,27,26,0.04)]",
        isNoShow ? "bg-[#fff1ed]" : "bg-[#fff4de]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={[
              "text-[11px] font-bold uppercase tracking-[0.16em]",
              isNoShow ? "text-[#c4392d]" : "text-[#8c6b1e]",
            ].join(" ")}
          >
            {isNoShow
              ? `Vắng mặt${item.alertMinutes ? ` • trễ ${item.alertMinutes} phút` : ""}`
              : `Trễ lịch${item.alertMinutes ? ` • ${item.alertMinutes} phút` : ""}`}
          </p>
          <h3 className="mt-2 font-serif text-[1.9rem] font-bold leading-tight text-[#2d2926]">
            {getDisplayCustomerName(item.booking.customerSnapshot.fullName)}
          </h3>
          <p className="mt-1 text-base text-[#7c6a65]">{getCompactServiceSummary(item.booking)}</p>
        </div>

        <div className="text-right">
          <p
            className={[
              "text-lg font-bold",
              isNoShow ? "text-[#c4392d]" : "text-[#8c6b1e]",
            ].join(" ")}
          >
            {item.booking.startTime} - {item.booking.estimatedEndTime}
          </p>
          <p className="mt-1 text-sm text-[#8a7770]">
            {item.alertMinutes ? `Trễ ${item.alertMinutes} phút` : getDisplayStatus(item)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <PrimaryActionButton
          action={primaryAction}
          acting={acting}
          bookingId={item.booking.id}
          onAction={onAction}
          onOpen={onOpen}
        />
      </div>
    </article>
  );
}

function TimelineBookingItem({
  item,
  isNextUpcoming,
  acting,
  onOpen,
  onAction,
}: {
  item: DecoratedBookingItem;
  isNextUpcoming: boolean;
  acting: string | null;
  onOpen: () => void;
  onAction: (action: "check_in" | "complete") => void;
}) {
  const primaryAction = getPrimaryAction(item, isNextUpcoming);
  const tone = getCardTone(item);

  return (
    <div className="grid grid-cols-[3.2rem_minmax(0,1fr)] gap-3">
      <div className="pt-2 text-right text-[11px] font-bold tracking-[0.02em] text-[#8a7770]">
        {item.booking.startTime}
      </div>

      <div className="relative">
        <div
          className={[
            "absolute left-[-1.8rem] top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border-4 border-[#fdf9f6]",
            tone.dotBackground,
          ].join(" ")}
        >
          <span className="text-sm">{tone.dotIcon}</span>
        </div>

        <article
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpen();
            }
          }}
          className={["rounded-[1.5rem] px-4 py-4 shadow-[0_8px_24px_rgba(28,27,26,0.04)]", tone.card].join(
            " ",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={["text-[11px] font-bold uppercase tracking-[0.14em]", tone.status].join(" ")}>
                {getDisplayStatus(item)}
              </p>
              <h3 className="mt-1 text-[1.45rem] font-bold leading-tight text-[#2d2926]">
                {getDisplayCustomerName(item.booking.customerSnapshot.fullName)}
              </h3>
            </div>
            <p className="text-sm font-semibold text-[#8a7770]">
              {item.booking.startTime} - {item.booking.estimatedEndTime}
            </p>
          </div>

          <p className="mt-2 text-sm text-[#7c6a65]">{getCompactServiceSummary(item.booking)}</p>

          <div className="mt-4">
            <PrimaryActionButton
              action={primaryAction}
              acting={acting}
              bookingId={item.booking.id}
              onAction={onAction}
              onOpen={onOpen}
            />
          </div>
        </article>
      </div>
    </div>
  );
}

function PrimaryActionButton({
  action,
  acting,
  bookingId,
  onAction,
  onOpen,
}: {
  action: CompactCardAction;
  acting: string | null;
  bookingId: string;
  onAction: (action: "check_in" | "complete") => void;
  onOpen: () => void;
}) {
  if (action.kind === "contact") {
    return (
      <a
        href={action.href}
        onClick={(event) => event.stopPropagation()}
        className="flex h-12 items-center justify-center rounded-xl bg-[#efe8e3] text-sm font-bold uppercase tracking-[0.12em] text-[#6d5b54]"
      >
        {action.label}
      </a>
    );
  }

  if (action.kind === "detail") {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
        className="h-12 w-full rounded-xl bg-[#efe8e3] text-sm font-bold uppercase tracking-[0.12em] text-[#6d5b54]"
      >
        {action.label}
      </button>
    );
  }

  const isLoading = acting === `${bookingId}:${action.kind}`;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onAction(action.kind);
      }}
      disabled={isLoading}
      className={[
        "h-12 w-full rounded-xl text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_12px_30px_rgba(28,27,26,0.08)] transition active:scale-[0.98] disabled:opacity-60",
        action.kind === "complete"
          ? "bg-[linear-gradient(135deg,#7f5253_0%,#d9a2a2_100%)]"
          : "bg-[#1f1d1b]",
      ].join(" ")}
    >
      {isLoading ? "Đang xử lý..." : action.label}
    </button>
  );
}

function BookingDetailOverlay({
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

  const booking = item.booking;
  const paymentSummary = getPaymentSummaryLabel(booking);
  const effects = getEffectSummary(booking.effects) || "Không có";
  const canCheckIn = !["checked_in", "completed", "cancelled", "no_show"].includes(
    booking.status,
  );
  const canComplete = booking.status === "checked_in";
  const canNoShow = !["checked_in", "completed", "cancelled", "no_show"].includes(
    booking.status,
  );

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-[#2d2926]/28 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 bottom-0 h-[82vh] rounded-t-[2rem] bg-[#fdf9f6] shadow-[0_-14px_40px_rgba(28,27,26,0.16)] md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-[28rem] md:rounded-none md:rounded-l-[2rem]">
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between border-b border-[#eadfd8] bg-white px-5 py-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b08d60]">
                Chi tiết lịch hẹn
              </p>
              <h2 className="mt-1 font-serif text-[2rem] font-bold text-[#2d2926]">
                {getDisplayCustomerName(booking.customerSnapshot.fullName)}
              </h2>
              <p className="mt-1 text-sm text-[#8a7770]">
                Mã lịch hẹn: {booking.referenceCode}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3ede8] text-[#6d5b54]"
              aria-label="Đóng chi tiết lịch hẹn"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-6">
              <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_8px_24px_rgba(28,27,26,0.05)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-[#f3e7df] text-lg font-bold text-[#7f5253]">
                    {getCustomerInitials(getDisplayCustomerName(booking.customerSnapshot.fullName))}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-[#2d2926]">
                      {getDisplayCustomerName(booking.customerSnapshot.fullName)}
                    </p>
                    <p className="mt-1 text-sm text-[#8a7770]">
                      {booking.customerSnapshot.phoneDisplay ?? booking.customerSnapshot.phoneE164}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <DetailBadge>{getDisplayStatus(item)}</DetailBadge>
                      <DetailBadge>{`${booking.guestCount} khách`}</DetailBadge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TimeStatCard label="Bắt đầu" value={booking.startTime} />
                <TimeStatCard label="Kết thúc dự kiến" value={booking.estimatedEndTime} />
              </div>

              <DetailSection title="Thông tin dịch vụ">
                <DetailRow label="Tóm tắt" value={getLongServiceSummary(booking)} />
                <DetailRow label="Loại set" value={getSetTypeLabel(booking.setType)} />
                <DetailRow label="Loại móng" value={getNailTypeLabel(booking.nailType)} />
                <DetailRow label="Kiểu sơn" value={getPolishStyleLabel(booking.polishStyle)} />
                <DetailRow label="Hiệu ứng" value={effects} />
                <DetailRow label="Thợ phụ trách" value={item.staffGroupLabel} />
                <DetailRow label="Thời lượng dự kiến" value={`${booking.durationMinutes} phút`} />
              </DetailSection>

              <DetailSection title="Thanh toán">
                <DetailRow
                  label="Phương thức"
                  value={getPaymentMethodLabel(booking.paymentSummary?.method)}
                />
                <DetailRow
                  label="Trạng thái"
                  value={getPaymentStatusLabel(booking.paymentSummary?.status)}
                />
                <DetailRow label="Tóm tắt" value={paymentSummary} />
              </DetailSection>

              {booking.notes ? (
                <div className="rounded-[1.4rem] bg-[#fff7e6] px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8c6b1e]">
                    Ghi chú khách hàng
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#5d4e47]">
                    {getDisplayLocalizedCopy(booking.notes)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-[#eadfd8] bg-white px-5 py-4">
            <div className="grid gap-3">
              {canCheckIn ? (
                <button
                  type="button"
                  onClick={onCheckIn}
                  disabled={!onCheckIn || acting === `${booking.id}:check_in`}
                  className="h-12 rounded-xl bg-[#1f1d1b] text-sm font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
                >
                  {acting === `${booking.id}:check_in` ? "Đang xử lý..." : "Nhận khách"}
                </button>
              ) : null}

              {canComplete ? (
                <button
                  type="button"
                  onClick={onComplete}
                  disabled={!onComplete || acting === `${booking.id}:complete`}
                  className="h-12 rounded-xl bg-[linear-gradient(135deg,#7f5253_0%,#d9a2a2_100%)] text-sm font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
                >
                  {acting === `${booking.id}:complete` ? "Đang xử lý..." : "Hoàn tất"}
                </button>
              ) : null}

              <a
                href={`tel:${booking.customerSnapshot.phoneE164}`}
                className="flex h-12 items-center justify-center rounded-xl bg-[#efe8e3] text-sm font-bold uppercase tracking-[0.12em] text-[#6d5b54]"
              >
                Gọi khách
              </a>

              {canNoShow ? (
                <button
                  type="button"
                  onClick={onNoShow}
                  disabled={!onNoShow || acting === `${booking.id}:no_show`}
                  className="h-12 rounded-xl bg-[#f7e9e7] text-sm font-bold uppercase tracking-[0.12em] text-[#b5453d] disabled:opacity-60"
                >
                  {acting === `${booking.id}:no_show`
                    ? "Đang xử lý..."
                    : "Đánh dấu vắng mặt"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a7770]">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(28,27,26,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9b8a83]">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-[#2d2926]">{value}</p>
    </div>
  );
}

function TimeStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(28,27,26,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9b8a83]">
        {label}
      </p>
      <p className="mt-1 font-serif text-[1.7rem] font-bold text-[#2d2926]">{value}</p>
    </div>
  );
}

function DetailBadge({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-[#f3ede8] px-2.5 py-1 text-[11px] font-semibold text-[#7c6a65]">
      {children}
    </span>
  );
}

function CompactMetaChip({ children }: { children: string }) {
  return (
    <span className="rounded-lg bg-[#f3ede8] px-3 py-1 text-xs font-medium text-[#7c6a65]">
      {children}
    </span>
  );
}

function getPrimaryAction(
  item: DecoratedBookingItem,
  isNextUpcoming: boolean,
): CompactCardAction {
  if (item.booking.status === "checked_in") {
    return { kind: "complete", label: "Hoàn tất" };
  }

  if (item.alertState === "late_show" || item.alertState === "no_show") {
    return {
      kind: "contact",
      label: "Liên hệ khách",
      href: `tel:${item.booking.customerSnapshot.phoneE164}`,
    };
  }

  if (isNextUpcoming) {
    return { kind: "check_in", label: "Nhận khách" };
  }

  return { kind: "detail", label: "Chi tiết" };
}

function getSectionHeading(filter: TechnicianFilter) {
  switch (filter) {
    case "checked_in":
      return "Đang làm";
    case "late":
      return "Cảnh báo";
    case "upcoming":
      return "Sắp tới";
    default:
      return "Lịch trình";
  }
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

function isUpcomingBooking(booking: Booking, selectedDate: string) {
  if (!["pending", "confirmed"].includes(booking.status)) {
    return false;
  }

  const now = getBangkokNow();
  if (selectedDate !== now.date || booking.date !== now.date) {
    return true;
  }

  return getElapsedMinutesSinceStart(booking.startTime, now.time) <= 0;
}

function getCardTone(item: DecoratedBookingItem) {
  if (item.booking.status === "checked_in") {
    return {
      card: "bg-[#eef6f0]",
      dotBackground: "bg-[#dff0e3]",
      dotIcon: "●",
      status: "text-[#2c694e]",
    };
  }

  if (item.alertState === "no_show" || item.booking.status === "no_show") {
    return {
      card: "bg-[#fff1ed]",
      dotBackground: "bg-[#ffe0da]",
      dotIcon: "●",
      status: "text-[#c4392d]",
    };
  }

  if (item.alertState === "late_show" || item.booking.status === "late_show") {
    return {
      card: "bg-[#fff4de]",
      dotBackground: "bg-[#ffe3ab]",
      dotIcon: "▲",
      status: "text-[#8c6b1e]",
    };
  }

  return {
    card: "bg-white",
    dotBackground: "bg-[#f3ede8]",
    dotIcon: "•",
    status: "text-[#8a7770]",
  };
}

function getDisplayStatus(item: DecoratedBookingItem) {
  if (item.alertState === "no_show" || item.booking.status === "no_show") {
    return "Vắng mặt";
  }

  if (item.alertState === "late_show" || item.booking.status === "late_show") {
    return "Trễ lịch";
  }

  return getStatusLabel(item.booking.status);
}

function getStatusLabel(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "Chờ xác nhận";
    case "confirmed":
      return "Sắp tới";
    case "checked_in":
      return "Đang làm";
    case "completed":
      return "Hoàn tất";
    case "cancelled":
      return "Đã hủy";
    case "no_show":
      return "Vắng mặt";
    case "late_show":
      return "Trễ lịch";
    default:
      return status;
  }
}

function getLongServiceSummary(booking: Booking) {
  return [
    getSetTypeLabel(booking.setType),
    getNailTypeLabel(booking.nailType),
    getPolishStyleLabel(booking.polishStyle),
    getEffectSummary(booking.effects),
  ]
    .filter(Boolean)
    .join(" • ");
}

function getCompactServiceSummary(booking: Booking) {
  return [
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
      return "Chân";
    case "both":
      return "Tay và chân";
    default:
      return setType;
  }
}

function getNailTypeLabel(nailType: NailType) {
  switch (nailType) {
    case "natural":
      return "Móng thật";
    case "tip":
      return "Móng úp";
    case "builder_gel":
      return "Đắp gel";
    default:
      return nailType;
  }
}

function getPolishStyleLabel(polishStyle: PolishStyle) {
  switch (polishStyle) {
    case "gel_solid":
      return "Sơn trơn gel";
    case "glitter":
      return "Sơn nhũ";
    case "cat_eye":
      return "Mắt mèo";
    case "chrome":
      return "Tráng gương";
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
          return "Đính đá";
        case "design":
          return "Vẽ mẫu";
        default:
          return effect;
      }
    });

  return labels.length > 0 ? labels.join(", ") : "";
}

function getPaymentMethodLabel(method?: BookingPaymentMethod | null) {
  switch (method) {
    case "pay_at_salon":
      return "Thanh toán tại salon";
    case "bank_transfer":
      return "Chuyển khoản";
    case "local_card":
      return "Thẻ nội địa";
    default:
      return "Chưa chọn thanh toán";
  }
}

function getPaymentStatusLabel(status?: BookingPaymentStatus | null) {
  switch (status) {
    case "payment_not_started":
      return "Chưa bắt đầu";
    case "pay_at_salon":
      return "Thanh toán khi đến lịch";
    case "awaiting_bank_transfer":
      return "Chờ chuyển khoản";
    case "card_details_captured":
      return "Đã nhập thông tin thẻ";
    case "paid":
      return "Đã thanh toán";
    case "refunded":
      return "Đã hoàn tiền";
    case "voided":
      return "Đã hủy";
    default:
      return "Chưa cập nhật";
  }
}

function getPaymentSummaryLabel(booking: Booking) {
  const method = getPaymentMethodLabel(booking.paymentSummary?.method);
  const status = getPaymentStatusLabel(booking.paymentSummary?.status);
  const detail = getDisplayLocalizedCopy(
    booking.paymentSummary?.detailValue ?? booking.paymentSummary?.detailLabel,
  );

  return [method, status, detail].filter(Boolean).join(" • ");
}

function getDisplayCustomerName(name: string) {
  return getDisplayLocalizedCopy(name);
}

function getDisplayLocalizedCopy(value?: string | null) {
  if (!value) {
    return "";
  }

  const exactMap: Record<string, string> = {
    "Nguyen Minh Anh": "Nguyễn Minh Anh",
    "Tran Vy": "Trần Vy",
    "Le Tu Anh": "Lê Tú Anh",
    "Khach quen, uu tien xu ly nhanh.": "Khách quen, ưu tiên xử lý nhanh.",
    "Theo doi sat vi da tre hon 15 phut.": "Theo dõi sát vì đã trễ hơn 15 phút.",
    "Danh dau no-show tu man technician.": "Đánh dấu vắng mặt từ màn kỹ thuật viên.",
    "Khach moi, can xac nhan mau French tip.": "Khách mới, cần xác nhận mẫu French tip.",
    "Cho chuyen khoan": "Chờ chuyển khoản",
    "Da nhap thong tin": "Đã nhập thông tin",
  };

  return exactMap[value] ?? value;
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
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return formatter.format(new Date(`${date}T12:00:00+07:00`));
}
