"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookingSummaryBar } from "./booking-summary-bar";
import { CalendarBlock } from "./calendar-block";
import { ServiceConfigurator } from "./service-configurator";
import { SlotPanel } from "./slot-panel";
import { StaffPicker } from "./staff-picker";
import {
  BOOKING_STORAGE_KEY,
  buildAvailabilityQuery,
  buildServiceSummaryLabel,
  DEFAULT_SERVICE_SELECTIONS,
  formatDateLabel,
  formatHoldCountdown,
  getCalendarMonth,
  getBlockedDurationMinutes,
  getDurationEstimate,
  getDurationMinutes,
  getHoldRemainingMs,
  getMonthCursorFromIso,
  getNearbyAlternativeSlots,
  getOccupiedSlotTimes,
  getSlotAvailabilityForDay,
  getStaffById,
  getTodayIso,
  notifyBookingStorageUpdated,
  normalizeServiceSelections,
  readStoredJson,
  shiftMonthCursor,
  TEMP_HOLD_DURATION_MS,
  type BookingFlowNotice,
  type PersistedBookingDraft,
  type ServiceSelections,
} from "../booking-mock";

function getDefaultBookingState() {
  const todayIso = getTodayIso();

  return {
    visibleMonth: getMonthCursorFromIso(todayIso),
    selectedStaffId: "any",
    serviceSelections: DEFAULT_SERVICE_SELECTIONS,
    selectedDate: null as string | null,
    selectedSlot: null as string | null,
    holdExpiresAt: null as number | null,
    notice: null as BookingFlowNotice | null,
  };
}

export function BookingExperience() {
  const router = useRouter();
  const [initialState] = useState(getDefaultBookingState);
  const [visibleMonth, setVisibleMonth] = useState(initialState.visibleMonth);
  const [selectedStaffId, setSelectedStaffId] = useState(initialState.selectedStaffId);
  const [serviceSelections, setServiceSelections] = useState<ServiceSelections>(
    initialState.serviceSelections,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    initialState.selectedDate,
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(
    initialState.selectedSlot,
  );
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(
    initialState.holdExpiresAt,
  );
  const [notice, setNotice] = useState<BookingFlowNotice | null>(initialState.notice);
  const [nowTs, setNowTs] = useState(0);
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);

  const selectedStaff = getStaffById(selectedStaffId);
  const durationMinutes = getDurationMinutes(selectedStaffId, serviceSelections);
  const blockedDurationMinutes = getBlockedDurationMinutes(durationMinutes);
  const holdRemainingMs =
    selectedSlot && holdExpiresAt
      ? Math.max(0, holdExpiresAt - nowTs)
      : 0;
  const hasActiveHold = Boolean(selectedSlot && holdExpiresAt && holdRemainingMs > 0);
  const effectiveSelectedSlot = hasActiveHold ? selectedSlot : null;
  const durationEstimate = getDurationEstimate(
    selectedStaffId,
    serviceSelections,
    effectiveSelectedSlot,
  );
  const endTime = durationEstimate.estimatedEndTime ?? null;
  const selectedDateLabel = selectedDate ? formatDateLabel(selectedDate) : null;
  const serviceSummaryLabel = buildServiceSummaryLabel(serviceSelections);
  const occupiedSlotTimes = useMemo(
    () => getOccupiedSlotTimes(effectiveSelectedSlot, blockedDurationMinutes),
    [blockedDurationMinutes, effectiveSelectedSlot],
  );
  const calendarMonth = useMemo(
    () =>
      getCalendarMonth(
        visibleMonth,
        selectedStaffId,
        serviceSelections,
        effectiveSelectedSlot,
      ),
    [effectiveSelectedSlot, selectedStaffId, serviceSelections, visibleMonth],
  );
  const slots = useMemo(
    () =>
      selectedDate
        ? getSlotAvailabilityForDay(
            selectedDate,
            selectedStaffId,
            serviceSelections,
            effectiveSelectedSlot,
          )
        : [],
    [effectiveSelectedSlot, selectedDate, selectedStaffId, serviceSelections],
  );
  const canContinue = Boolean(selectedDate && effectiveSelectedSlot);
  const holdCountdownLabel = hasActiveHold
    ? formatHoldCountdown(holdRemainingMs)
    : null;

  useEffect(() => {
    router.prefetch("/dat-lich/thong-tin");
  }, [router]);

  useEffect(() => {
    const storedDraft = readStoredJson<PersistedBookingDraft>(BOOKING_STORAGE_KEY);
    const timeout = window.setTimeout(() => {
      const restoredNowTs = Date.now();
      const todayIso = getTodayIso();

      setNowTs(restoredNowTs);

      if (!storedDraft) {
        setHasHydratedDraft(true);
        return;
      }

      const hasActiveHold = getHoldRemainingMs(storedDraft, restoredNowTs) > 0;
      const restoredDate =
        storedDraft.date && storedDraft.date >= todayIso ? storedDraft.date : null;

      setVisibleMonth(getMonthCursorFromIso(restoredDate ?? todayIso));
      setSelectedStaffId(storedDraft.staffId || "any");
      setServiceSelections(
        normalizeServiceSelections(
          storedDraft.serviceSelections ?? DEFAULT_SERVICE_SELECTIONS,
        ),
      );
      setSelectedDate(restoredDate);
      setSelectedSlot(restoredDate && hasActiveHold ? storedDraft.startTime : null);
      setHoldExpiresAt(restoredDate && hasActiveHold ? storedDraft.holdExpiresAt : null);
      setNotice(storedDraft.latestNotice);
      setHasHydratedDraft(true);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, []);

  const persistBookingDraft = useCallback(() => {
    const draft: PersistedBookingDraft = {
      date: selectedDate,
      dateLabel: selectedDateLabel,
      startTime: effectiveSelectedSlot,
      staffId: selectedStaff.id,
      staffName: selectedStaff.displayName,
      durationMinutes,
      durationEstimate,
      blockedDurationMinutes,
      endTime,
      slotIntervalMinutes: 30,
      holdSlot: hasActiveHold ? effectiveSelectedSlot : null,
      holdExpiresAt: hasActiveHold ? holdExpiresAt : null,
      status: "draft",
      latestNotice: notice,
      serviceSelections,
      serviceLabel: serviceSummaryLabel,
      source: "website",
      channel: "web_self_booking",
      branchId: null,
      availabilityMode: selectedStaffId === "any" ? "pool" : "specific_staff",
      availabilityQuery: buildAvailabilityQuery(
        selectedDate ?? getTodayIso(),
        selectedStaffId,
        serviceSelections,
      ),
    };

    window.sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(draft));
    notifyBookingStorageUpdated();
  }, [
    durationMinutes,
    durationEstimate,
    blockedDurationMinutes,
    effectiveSelectedSlot,
    endTime,
    hasActiveHold,
    holdExpiresAt,
    notice,
    selectedDate,
    selectedDateLabel,
    selectedStaff.id,
    selectedStaff.displayName,
    selectedStaffId,
    serviceSelections,
    serviceSummaryLabel,
  ]);

  useEffect(() => {
    if (!holdExpiresAt || !selectedSlot) {
      return;
    }

    const timer = window.setInterval(() => {
      const nextNowTs = Date.now();

      if (holdExpiresAt <= nextNowTs) {
        window.clearInterval(timer);
        setNowTs(nextNowTs);
        setSelectedSlot(null);
        setHoldExpiresAt(null);
        setNotice({
          type: "hold_expired",
          message:
            "Giữ chỗ tạm đã hết hạn. Vui lòng chọn lại một khung giờ nếu bạn vẫn muốn tiếp tục.",
          alternativeSlots: [],
        });
        return;
      }

      setNowTs(nextNowTs);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [holdExpiresAt, selectedSlot]);

  useEffect(() => {
    if (!hasHydratedDraft) {
      return;
    }

    persistBookingDraft();
  }, [
    durationMinutes,
    endTime,
    hasHydratedDraft,
    holdExpiresAt,
    hasActiveHold,
    effectiveSelectedSlot,
    notice,
    selectedDate,
    selectedDateLabel,
    selectedStaff.id,
    selectedStaff.displayName,
    persistBookingDraft,
  ]);

  useEffect(() => {
    if (!selectedDate || !selectedSlot) {
      return;
    }

    const slotOption = slots.find((slot) => slot.startTime === selectedSlot);

    if (!slotOption || slotOption.state === "available") {
      return;
    }

    const invalidationNotice: BookingFlowNotice = {
      type:
        slotOption.state === "insufficient_duration"
          ? "insufficient_duration"
          : "slot_invalidated",
      message:
        slotOption.state === "insufficient_duration"
          ? "Khung giờ bạn vừa chọn không còn đủ dài cho tổ hợp dịch vụ hiện tại. Vui lòng điều chỉnh dịch vụ hoặc chọn một giờ khác."
          : slotOption.reason ??
            "Khung giờ bạn vừa chọn không còn khả dụng. Vui lòng chọn lại.",
      alternativeSlots: getNearbyAlternativeSlots(
        selectedDate,
        selectedSlot,
        selectedStaffId,
        serviceSelections,
      ),
    };
    const timeout = window.setTimeout(() => {
      setSelectedSlot(null);
      setHoldExpiresAt(null);
      setNotice(invalidationNotice);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [selectedDate, selectedSlot, selectedStaffId, serviceSelections, slots]);

  function handleDateSelect(iso: string) {
    setNotice(null);
    setNowTs(Date.now());
    setSelectedDate(iso);
    setVisibleMonth(getMonthCursorFromIso(iso));

    if (!selectedSlot || selectedDate === iso) {
      return;
    }

    setSelectedSlot(null);
    setHoldExpiresAt(null);
  }

  function handleStaffSelect(staffId: string) {
    setNotice(null);
    setSelectedStaffId(staffId);
  }

  function handleServiceSelectionChange<K extends keyof ServiceSelections>(
    field: K,
    value: ServiceSelections[K],
  ) {
    setNotice(null);
    setServiceSelections((currentSelections) => ({
      ...currentSelections,
      [field]: value,
    }));
  }

  function handleSlotSelect(time: string) {
    const slotOption = slots.find((slot) => slot.startTime === time);
    if (!slotOption || slotOption.state !== "available") {
      return;
    }

    setNotice(null);
    setNowTs(Date.now());
    setSelectedSlot(time);
    setHoldExpiresAt(Date.now() + TEMP_HOLD_DURATION_MS);
  }

  function handleContinue() {
    if (!canContinue) {
      return;
    }

    persistBookingDraft();
    router.push("/dat-lich/thong-tin");
  }

  return (
    <div className="min-h-screen bg-background pb-56">
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fdf9f6]/80 px-6 py-4 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link
            href="/"
            className="text-xl leading-none text-primary transition hover:opacity-70"
          >
            ←
          </Link>
          <span className="font-serif text-xl tracking-[-0.02em] text-primary">
            19NAIL.STUDIO
          </span>
          <span className="w-4 text-right text-xs text-primary">•</span>
        </div>
      </header>

      <main className="mx-auto mt-14 max-w-lg space-y-8 px-4 py-5 sm:px-5 sm:py-7">
        <section className="space-y-2 px-1 sm:px-2">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl leading-tight text-foreground">
              Chọn lịch hẹn
            </h1>
            <p className="text-sm leading-7 text-text-muted">
              Chọn ngày, dịch vụ, thợ và khung giờ phù hợp với bạn.
            </p>
          </div>
        </section>

        <CalendarBlock
          monthLabel={calendarMonth.monthLabel}
          days={calendarMonth.days}
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          onPreviousMonth={() => setVisibleMonth((current) => shiftMonthCursor(current, -1))}
          onNextMonth={() => setVisibleMonth((current) => shiftMonthCursor(current, 1))}
        />

        <ServiceConfigurator
          selections={serviceSelections}
          durationMinutes={durationMinutes}
          serviceSummaryLabel={serviceSummaryLabel}
          onChange={handleServiceSelectionChange}
        />

        <StaffPicker
          selectedStaffId={selectedStaffId}
          onSelect={handleStaffSelect}
        />

        {selectedDate ? (
          <SlotPanel
            selectedDateLabel={selectedDateLabel ?? ""}
            slots={slots}
            selectedSlot={selectedSlot}
            heldSlot={effectiveSelectedSlot}
            blockedDurationMinutes={blockedDurationMinutes}
            holdCountdownLabel={holdCountdownLabel}
            occupiedSlotTimes={occupiedSlotTimes}
            notice={notice}
            onSelectSlot={handleSlotSelect}
          />
        ) : (
          <section className="rounded-[1.15rem] border border-border/70 bg-white/75 px-5 py-6 shadow-[0_8px_24px_rgba(127,82,83,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Khung giờ
            </p>
            <p className="mt-3 text-sm leading-7 text-text-muted">
              Chọn một ngày trong lịch để mở panel khung giờ và xem các điểm bắt
              đầu 30 phút hiện có.
            </p>
          </section>
        )}
      </main>

      <BookingSummaryBar
        selectedDateLabel={selectedDateLabel}
        selectedSlot={effectiveSelectedSlot}
        staffName={selectedStaff.displayName}
        serviceSummaryLabel={serviceSummaryLabel}
        durationMinutes={durationMinutes}
        endTime={endTime}
        holdCountdownLabel={holdCountdownLabel}
        canContinue={canContinue}
        onContinue={handleContinue}
      />
    </div>
  );
}
