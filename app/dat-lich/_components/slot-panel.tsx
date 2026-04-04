import type { AvailabilitySlot } from "@/src/domain/availability/types";
import type { BookingFlowNotice } from "../booking-mock";

type SlotPanelProps = {
  selectedDateLabel: string;
  slots: AvailabilitySlot[];
  selectedSlot: string | null;
  heldSlot: string | null;
  blockedDurationMinutes: number;
  holdCountdownLabel: string | null;
  occupiedSlotTimes: string[];
  notice: BookingFlowNotice | null;
  onSelectSlot: (time: string) => void;
};

export function SlotPanel({
  selectedDateLabel,
  slots,
  selectedSlot,
  heldSlot,
  blockedDurationMinutes,
  holdCountdownLabel,
  occupiedSlotTimes,
  notice,
  onSelectSlot,
}: SlotPanelProps) {
  const availableCount = slots.filter((slot) => slot.state === "available").length;
  const hasInsufficientDuration = slots.some(
    (slot) => slot.state === "insufficient_duration",
  );
  const showInsufficientWarning =
    notice?.type === "insufficient_duration" ||
    (availableCount === 0 && hasInsufficientDuration);
  const occupiedSlotCount = Math.max(1, Math.ceil(blockedDurationMinutes / 30));
  const anchorSlot = heldSlot ?? selectedSlot;
  const hasOccupiedRange = occupiedSlotTimes.length > 1;

  return (
    <section className="space-y-4 pb-28 sm:pb-32">
      <div className="space-y-1 px-2">
        <h2 className="font-serif text-lg text-primary">Chọn khung giờ</h2>
        <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
          {selectedDateLabel}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 px-2">
        <LegendPill label="Còn chọn được" className="bg-white text-[#5d4f4b]" />
        <LegendPill label="Đã đặt" className="bg-[#e7e2de] text-[#82756f]" />
        <LegendPill label="Giữ tạm" className="bg-[#7f5253] text-white" />
        <LegendPill
          label="Không đủ thời lượng"
          className="bg-[#f6e6cf] text-[#9a6a20]"
        />
        {hasOccupiedRange ? (
          <LegendPill
            label="Đang chiếm chỗ"
            className="bg-[#fbefef] text-[#8a5d5f]"
          />
        ) : null}
      </div>

      {heldSlot && holdCountdownLabel ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[1rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(217,162,162,0.12)_0%,rgba(255,255,255,0.92)_100%)] px-4 py-4 shadow-[0_8px_24px_rgba(127,82,83,0.04)]"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            Giữ chỗ tạm
          </p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <p className="text-sm leading-6 text-text-muted">
              Bắt đầu từ {heldSlot}, lịch hẹn của bạn đang giữ {occupiedSlotCount} ô
              liên tiếp cho {blockedDurationMinutes} phút dịch vụ.
            </p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary shadow-[0_6px_16px_rgba(127,82,83,0.06)]">
              {holdCountdownLabel}
            </span>
          </div>
        </div>
      ) : null}

      {notice && notice.type !== "insufficient_duration" ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[1rem] border border-border/60 bg-white/85 px-4 py-4 shadow-[0_8px_24px_rgba(127,82,83,0.04)]"
        >
          <p className="text-sm leading-6 text-text-muted">{notice.message}</p>
          {notice.alternativeSlots.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {notice.alternativeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className="rounded-full border border-primary/15 bg-[#fffaf7] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary transition hover:bg-primary/5 focus-visible:border-primary/40"
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {showInsufficientWarning ? (
        <div className="rounded-[1rem] border border-[#ebc98f] bg-[#fff7eb] px-4 py-4 shadow-[0_8px_24px_rgba(184,147,82,0.08)]">
          <p className="text-sm font-semibold text-[#8a5a13]">
            Khung giờ này chưa đủ dài cho dịch vụ đã chọn.
          </p>
          <p className="mt-2 text-sm leading-6 text-[#7f6b55]">
            Vui lòng điều chỉnh dịch vụ hoặc chọn khung giờ khác phù hợp hơn.
          </p>
          {notice?.type === "insufficient_duration" &&
          notice.alternativeSlots.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {notice.alternativeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className="rounded-full border border-[#d9b371] bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a5a13] transition hover:bg-white"
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {slots.map((slot) => {
          const isHeldStart = heldSlot === slot.startTime;
          const isSelectedStart = selectedSlot === slot.startTime && !heldSlot;
          const isOccupiedContinuation =
            occupiedSlotTimes.includes(slot.startTime) && anchorSlot !== slot.startTime;
          const isDisabled = slot.state !== "available" || isOccupiedContinuation;

          return (
            <button
              key={slot.startTime}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectSlot(slot.startTime)}
              aria-pressed={isHeldStart || isSelectedStart}
              title={slot.reason ?? undefined}
              className={[
                "relative min-h-16 rounded-[1rem] px-2 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                isHeldStart
                  ? "border border-primary/25 bg-[linear-gradient(135deg,#7f5253_0%,#d9a2a2_100%)] text-white shadow-[0_12px_24px_rgba(127,82,83,0.2)]"
                  : isSelectedStart
                    ? "border border-[#564948] bg-[#3b3736] text-[#f4f0ed] shadow-[0_12px_24px_rgba(49,48,47,0.16)]"
                    : isOccupiedContinuation
                      ? "border border-[#e8c9c9] bg-[#fbefef] text-[#8a5d5f] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]"
                      : slot.state === "booked"
                        ? "cursor-not-allowed border border-[#ddd5d0] bg-[#ece7e3] text-[#8f837d]"
                        : slot.state === "held"
                          ? "cursor-not-allowed border border-[#b87b7d] bg-[#edd6d7] text-[#7d4f51]"
                          : slot.state === "past"
                            ? "cursor-not-allowed border border-[#ddd6d1] bg-[#f3eeea] text-[#aea19b]"
                            : slot.state === "closed"
                              ? "cursor-not-allowed border border-[#d6d2cf] bg-[#ebe7e4] text-[#9b928e]"
                              : slot.state === "insufficient_duration"
                                ? "cursor-not-allowed border border-[#e0b56a] bg-[#f6e8cf] text-[#8a6424]"
                                : "border border-[#e4dbd4] bg-white text-foreground hover:border-primary hover:text-primary",
              ].join(" ")}
            >
              {isHeldStart ? (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary shadow-[0_4px_12px_rgba(127,82,83,0.08)]">
                  Bắt đầu
                </span>
              ) : null}
              <span className="flex h-full flex-col items-center justify-center gap-1">
                <span>{slot.startTime}</span>
                {isOccupiedContinuation ? (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                    Tiếp nối
                  </span>
                ) : slot.state === "insufficient_duration" ? (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                    Không đủ
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LegendPill({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] shadow-[0_4px_12px_rgba(127,82,83,0.04)]",
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
