"use client";

import { useEffect, useMemo, useState } from "react";
import type { Booking, BookingPaymentMethod, BookingStatus } from "@/src/domain/booking/types";
import type { Staff } from "@/src/domain/staff/types";

type CalendarBookingItem = {
  booking: Booking;
  effectiveStatus: BookingStatus;
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
    const grouped = new Map<
      string,
      {
        label: string;
        activeItems: CalendarBookingItem[];
        cancelledItems: CalendarBookingItem[];
      }
    >();

    for (const item of items) {
      const current =
        grouped.get(item.staffGroupKey) ??
        {
          label: item.staffGroupLabel,
          activeItems: [],
          cancelledItems: [],
        };

      if (item.effectiveStatus === "cancelled") {
        current.cancelledItems.push(item);
      } else {
        current.activeItems.push(item);
      }

      grouped.set(item.staffGroupKey, current);
    }

    return Array.from(grouped.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      activeItems: value.activeItems,
      cancelledItems: value.cancelledItems,
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
      const payload = (await response.json()) as CalendarApiResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Không tải được lịch làm việc.");
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
      setMessage(
        error instanceof Error ? error.message : "Không tải được lịch làm việc.",
      );
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
                ? "Huỷ lịch từ màn lịch làm việc nội bộ."
                : undefined,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Không cập nhật được lịch hẹn.");
      }

      setMessage("Đã cập nhật trạng thái lịch hẹn.");
      await loadBookings();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không cập nhật được lịch hẹn.",
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
              Lịch vận hành
            </p>
            <h1 className="font-serif text-3xl text-foreground">Lịch đặt theo thợ</h1>
            <p className="text-sm leading-7 text-text-muted">
              Lịch trên màn này dùng chung nguồn dữ liệu với khách hàng, kỹ thuật
              viên và các màn quản lý nội bộ.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm text-text-muted">
            Nguồn dữ liệu:{" "}
            <span className="font-semibold text-primary">
              {formatRuntimeSource(runtimeSource)}
            </span>
          </div>
        </div>
      </header>

      <section className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_auto]">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Ngày</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Thợ</span>
            <select
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
            >
              <option value="all">Tất cả</option>
              {staffOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Trạng thái</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as BookingStatus | "all")}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="late_show">Trễ lịch</option>
              <option value="no_show">Vắng mặt</option>
              <option value="checked_in">Đang làm</option>
              <option value="completed">Hoàn tất</option>
              <option value="cancelled">Đã huỷ</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void loadBookings()}
              className="w-full rounded-full border border-border px-4 py-3 text-sm font-semibold text-text-muted"
            >
              Làm mới
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
            <p className="mt-5 text-sm text-text-muted">Đang tải lịch hẹn...</p>
          ) : groupedItems.length === 0 ? (
            <div className="mt-5 rounded-[1.4rem] border border-dashed border-border/80 bg-surface px-5 py-8 text-sm leading-7 text-text-muted">
              Chưa có lịch hẹn nào trong ngày này với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {groupedItems.map((group) => (
                <article key={group.key} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-primary">{group.label}</h3>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  {group.activeItems.length > 0 ? (
                    <div className="grid gap-3">
                      {group.activeItems.map((item) => (
                        <AgendaBookingCard
                          key={item.booking.id}
                          item={item}
                          selected={selectedItem?.booking.id === item.booking.id}
                          onSelect={() => setSelectedBookingId(item.booking.id)}
                        />
                      ))}
                    </div>
                  ) : null}

                  {group.cancelledItems.length > 0 ? (
                    <div className="space-y-3 rounded-[1.4rem] border border-[#eadfd8] bg-[#faf6f3] p-4">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-[#efe5df] px-3 py-1 text-xs font-semibold text-[#8d6962]">
                          Đã huỷ
                        </span>
                        <span className="text-sm text-text-muted">
                          {group.cancelledItems.length} lịch
                        </span>
                      </div>
                      <div className="grid gap-3">
                        {group.cancelledItems.map((item) => (
                          <AgendaBookingCard
                            key={item.booking.id}
                            item={item}
                            selected={selectedItem?.booking.id === item.booking.id}
                            onSelect={() => setSelectedBookingId(item.booking.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]">
          <h2 className="font-serif text-2xl text-foreground">Chi tiết lịch hẹn</h2>

          {!selectedItem ? (
            <p className="mt-5 text-sm leading-7 text-text-muted">
              Chọn một lịch hẹn ở agenda bên trái để xem chi tiết và thao tác.
            </p>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="rounded-[1.35rem] border border-border/80 bg-surface px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-primary">
                    {selectedItem.booking.referenceCode}
                  </p>
                  <StatusBadge status={selectedItem.effectiveStatus} />
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  <InfoRow
                    label="Khách hàng"
                    value={formatDisplayCopy(selectedItem.booking.customerSnapshot.fullName)}
                  />
                  <InfoRow
                    label="Số điện thoại"
                    value={
                      selectedItem.booking.customerSnapshot.phoneDisplay ??
                      selectedItem.booking.customerSnapshot.phoneE164
                    }
                  />
                  <InfoRow
                    label="Dịch vụ"
                    value={buildServiceLabel(selectedItem.booking)}
                  />
                  <InfoRow label="Ngày" value={formatDateLabel(selectedItem.booking.date)} />
                  <InfoRow
                    label="Khung giờ"
                    value={`${selectedItem.booking.startTime} - ${selectedItem.booking.estimatedEndTime}`}
                  />
                  <InfoRow
                    label="Thợ"
                    value={selectedItem.assignedStaffName ?? "Pool / chưa chỉ định"}
                  />
                  <InfoRow
                    label="Thanh toán"
                    value={formatPaymentMethod(selectedItem.booking.paymentSummary?.method)}
                  />
                  <InfoRow
                    label="Nguồn"
                    value={`${selectedItem.booking.source} / ${selectedItem.booking.channel}`}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  Cập nhật trạng thái
                </p>
                <div className="grid gap-2">
                  {getAvailableActions(selectedItem.booking.status).length === 0 ? (
                    <div className="rounded-[1.1rem] border border-dashed border-border/80 bg-surface px-4 py-4 text-sm text-text-muted">
                      Lịch hẹn này không còn thao tác trạng thái phù hợp trên màn này.
                    </div>
                  ) : (
                    getAvailableActions(selectedItem.booking.status).map((action) => (
                      <button
                        key={action}
                        type="button"
                        disabled={acting !== null}
                        onClick={() => void handleAction(action)}
                        className="rounded-full border border-primary/20 bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
                      >
                        {acting === action ? "Đang xử lý..." : actionLabelMap[action]}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function AgendaBookingCard({
  item,
  selected,
  onSelect,
}: {
  item: CalendarBookingItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const isCancelled = item.effectiveStatus === "cancelled";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "rounded-[1.35rem] border px-5 py-4 text-left transition",
        isCancelled
          ? "border-[#eadfd8] bg-[#f7f2ef] text-[#7b6660] hover:border-[#d9c2bb]"
          : selected
            ? "border-primary bg-primary/6 shadow-[0_12px_24px_rgba(138,90,93,0.12)]"
            : "border-border/80 bg-surface hover:border-primary/30",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={isCancelled ? "font-semibold text-[#6e5b56]" : "font-semibold text-foreground"}>
              {item.booking.startTime} - {item.booking.estimatedEndTime}
            </span>
            <StatusBadge status={item.effectiveStatus} />
          </div>
          <p className={isCancelled ? "text-sm font-medium text-[#6f5d57]" : "text-sm font-medium text-primary"}>
            {formatDisplayCopy(item.booking.customerSnapshot.fullName)}
          </p>
          <p className="text-sm leading-6 text-text-muted">{buildServiceLabel(item.booking)}</p>
        </div>
        <div className="space-y-1 text-sm text-text-muted md:text-right">
          <p>{item.booking.referenceCode}</p>
          <p>{formatPaymentMethod(item.booking.paymentSummary?.method)}</p>
        </div>
      </div>
    </button>
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
        getStatusTone(status),
      ].join(" ")}
    >
      {getStatusLabel(status)}
    </span>
  );
}

const actionLabelMap: Record<BookingAction, string> = {
  confirm: "Xác nhận lịch hẹn",
  check_in: "Nhận khách",
  complete: "Hoàn tất",
  cancel: "Huỷ lịch hẹn",
};

function getAvailableActions(status: BookingStatus) {
  const actions: BookingAction[] = [];

  if (status === "pending") {
    actions.push("confirm", "cancel");
  }

  if (status === "confirmed" || status === "late_show") {
    actions.push("check_in", "cancel");
  }

  if (status === "checked_in") {
    actions.push("complete", "cancel");
  }

  if (status === "no_show") {
    actions.push("cancel");
  }

  return actions;
}

function buildServiceLabel(booking: Booking) {
  const effectLabel = getEffectLabel(booking.effects);
  return [
    getSetTypeLabel(booking.setType),
    getNailTypeLabel(booking.nailType),
    getPolishStyleLabel(booking.polishStyle),
    effectLabel,
  ]
    .filter(Boolean)
    .join(" • ");
}

function getStatusLabel(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "Chờ xác nhận";
    case "confirmed":
      return "Đã xác nhận";
    case "late_show":
      return "Trễ lịch";
    case "no_show":
      return "Vắng mặt";
    case "checked_in":
      return "Đang làm";
    case "completed":
      return "Hoàn tất";
    case "cancelled":
      return "Đã huỷ";
    default:
      return status;
  }
}

function getStatusTone(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "bg-[#f6ead5] text-[#9c6a26]";
    case "confirmed":
      return "bg-[#e3f0fb] text-[#245c8f]";
    case "late_show":
      return "bg-[#fff1dc] text-[#9a6b10]";
    case "no_show":
      return "bg-[#fde8e5] text-[#b04c43]";
    case "checked_in":
      return "bg-[#e4f5e8] text-[#28753c]";
    case "completed":
      return "bg-[#ece8f8] text-[#5f4d8d]";
    case "cancelled":
      return "bg-[#efe5df] text-[#8d6962]";
    default:
      return "bg-[#f4e7e2] text-[#8b5b4d]";
  }
}

function getSetTypeLabel(setType: Booking["setType"]) {
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

function getNailTypeLabel(nailType: Booking["nailType"]) {
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

function getPolishStyleLabel(polishStyle: Booking["polishStyle"]) {
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

function getEffectLabel(effects: Booking["effects"]) {
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

function formatPaymentMethod(method?: BookingPaymentMethod | null) {
  switch (method) {
    case "bank_transfer":
      return "Chuyển khoản";
    case "local_card":
      return "Thẻ nội địa";
    case "pay_at_salon":
      return "Thanh toán tại salon";
    default:
      return "Chưa có";
  }
}

function formatRuntimeSource(source: CalendarApiResponse["source"]) {
  return source === "database" ? "Cơ sở dữ liệu" : "Bộ nhớ tạm";
}

function formatDisplayCopy(value: string) {
  const exactMap: Record<string, string> = {
    "Nguyen Minh Anh": "Nguyễn Minh Anh",
    "Tran Vy": "Trần Vy",
    "Le Tu Anh": "Lê Tú Anh",
  };

  return exactMap[value] ?? value;
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
