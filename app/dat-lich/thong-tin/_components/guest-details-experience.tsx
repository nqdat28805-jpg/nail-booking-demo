"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BookingApiError, createSharedBooking } from "../../booking-api";
import {
  BOOKING_STORAGE_KEY,
  BOOKING_STORAGE_UPDATED_EVENT,
  buildServiceSummaryLabel,
  DEFAULT_PAYMENT_METHOD,
  DEFAULT_SERVICE_SELECTIONS,
  DEFAULT_WEB_BOOKING_STATUS,
  formatHoldCountdown,
  formatVietnamesePhone,
  GUEST_DETAILS_STORAGE_KEY,
  getHoldRemainingMs,
  getServiceSelectionPresentation,
  normalizeServiceSelections,
  normalizeVietnamesePhone,
  notifyBookingStorageUpdated,
  notifyGuestStorageUpdated,
  PAYMENT_METHOD_OPTIONS,
  readStoredJson,
  toVietnamE164,
  type BookingFlowNotice,
  type PaymentMethod,
  type PersistedBookingDraft,
  type PersistedGuestDetailsDraft,
  type PersistedPaymentDetails,
} from "../../booking-mock";
import { FieldShell } from "./field-shell";
import { GuestSummaryCard } from "./guest-summary-card";

type GuestFormValues = {
  fullName: string;
  phone: string;
  note: string;
};

type GuestFormErrors = Partial<Record<keyof GuestFormValues, string>>;

type PaymentFormValues = {
  method: PaymentMethod;
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
};

type PaymentFormErrors = Partial<
  Record<"cardNumber" | "cardholderName" | "expiry" | "cvv", string>
>;

const defaultFormValues: GuestFormValues = {
  fullName: "",
  phone: "",
  note: "",
};

const defaultPaymentValues: PaymentFormValues = {
  method: DEFAULT_PAYMENT_METHOD,
  cardNumber: "",
  cardholderName: "",
  expiry: "",
  cvv: "",
};

function getInitialGuestFormValues() {
  const storedGuestDraft =
    readStoredJson<PersistedGuestDetailsDraft>(GUEST_DETAILS_STORAGE_KEY);

  if (!storedGuestDraft) {
    return defaultFormValues;
  }

  return {
    fullName: storedGuestDraft.fullName,
    phone: storedGuestDraft.phone,
    note: storedGuestDraft.note,
  };
}

function getInitialPaymentValues() {
  const storedGuestDraft =
    readStoredJson<PersistedGuestDetailsDraft>(GUEST_DETAILS_STORAGE_KEY);

  if (!storedGuestDraft) {
    return defaultPaymentValues;
  }

  return {
    method: storedGuestDraft.paymentMethod ?? DEFAULT_PAYMENT_METHOD,
    cardNumber: storedGuestDraft.paymentDetails?.cardNumber ?? "",
    cardholderName: storedGuestDraft.paymentDetails?.cardholderName ?? "",
    expiry: storedGuestDraft.paymentDetails?.expiry ?? "",
    cvv: storedGuestDraft.paymentDetails?.cvv ?? "",
  };
}

function validateGuestForm(values: GuestFormValues) {
  const errors: GuestFormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Vui lòng nhập họ tên.";
  }

  const normalizedPhone = normalizeVietnamesePhone(values.phone);
  if (!normalizedPhone) {
    errors.phone = "Vui lòng nhập số điện thoại.";
  } else if (normalizedPhone.length < 10) {
    errors.phone = "Số điện thoại chưa đúng định dạng.";
  }

  return errors;
}

function validatePaymentForm(values: PaymentFormValues) {
  const errors: PaymentFormErrors = {};

  if (values.method !== "local_card") {
    return errors;
  }

  const cardDigits = values.cardNumber.replace(/\D/g, "");
  if (cardDigits.length < 12) {
    errors.cardNumber = "Vui lòng nhập số thẻ hợp lệ.";
  }

  if (!values.cardholderName.trim()) {
    errors.cardholderName = "Vui lòng nhập tên chủ thẻ.";
  }

  if (!/^\d{2}\/\d{2}$/.test(values.expiry)) {
    errors.expiry = "Vui lòng nhập hạn thẻ theo dạng MM/YY.";
  }

  if (!/^\d{3,4}$/.test(values.cvv)) {
    errors.cvv = "Vui lòng nhập mã bảo mật hợp lệ.";
  }

  return errors;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function buildTransferReference(phone: string) {
  const normalizedPhone = normalizeVietnamesePhone(phone);
  const suffix = normalizedPhone ? normalizedPhone.slice(-4) : "0000";
  return `19NAIL-${suffix}`;
}

function buildPersistedPaymentDetails(
  values: PaymentFormValues,
  phone: string,
): PersistedPaymentDetails | null {
  if (values.method === "pay_at_salon") {
    return null;
  }

  if (values.method === "bank_transfer") {
    return {
      transferReference: buildTransferReference(phone),
    };
  }

  return {
    cardNumber: formatCardNumber(values.cardNumber),
    cardholderName: values.cardholderName.trim(),
    expiry: values.expiry,
    cvv: values.cvv,
  };
}

export function GuestDetailsExperience() {
  const router = useRouter();
  const [bookingDraft, setBookingDraft] = useState<PersistedBookingDraft | null>(
    () => readStoredJson<PersistedBookingDraft>(BOOKING_STORAGE_KEY),
  );
  const [formValues, setFormValues] = useState(getInitialGuestFormValues);
  const [paymentValues, setPaymentValues] = useState(getInitialPaymentValues);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof GuestFormValues, boolean>>
  >({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [availabilityConflict, setAvailabilityConflict] =
    useState<BookingFlowNotice | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const guestErrors = validateGuestForm(formValues);
  const paymentErrors = validatePaymentForm(paymentValues);
  const canSubmit =
    Object.keys(guestErrors).length === 0 &&
    Object.keys(paymentErrors).length === 0;
  const normalizedSelections = normalizeServiceSelections(
    bookingDraft?.serviceSelections ?? DEFAULT_SERVICE_SELECTIONS,
  );
  const servicePresentation = getServiceSelectionPresentation(normalizedSelections);
  const serviceLabel =
    bookingDraft?.serviceLabel ?? buildServiceSummaryLabel(normalizedSelections);
  const holdRemainingMs = bookingDraft
    ? getHoldRemainingMs(bookingDraft, nowTs)
    : 0;
  const persistedNotice = bookingDraft?.latestNotice ?? null;
  const activeConflictNotice: BookingFlowNotice | null =
    availabilityConflict ??
    (persistedNotice?.type === "recheck_conflict" ? persistedNotice : null);
  const holdExpired =
    Boolean(bookingDraft?.holdExpiresAt) && holdRemainingMs <= 0;
  const shouldShowHoldExpired =
    holdExpired || persistedNotice?.type === "hold_expired";
  const holdCountdownLabel =
    holdRemainingMs > 0 ? formatHoldCountdown(holdRemainingMs) : null;
  const bookingContextMissing =
    !bookingDraft?.dateLabel ||
    !bookingDraft.startTime ||
    !bookingDraft.endTime ||
    !bookingDraft.staffName;
  const conflictAlternativeSlots = activeConflictNotice?.alternativeSlots ?? [];
  const transferReference = useMemo(
    () => buildTransferReference(formValues.phone),
    [formValues.phone],
  );

  useEffect(() => {
    router.prefetch("/dat-lich/xac-nhan");
  }, [router]);

  useEffect(() => {
    const syncBookingDraft = () => {
      setBookingDraft(readStoredJson<PersistedBookingDraft>(BOOKING_STORAGE_KEY));
      setFormValues(getInitialGuestFormValues());
      setPaymentValues(getInitialPaymentValues());
      setHasHydrated(true);
    };

    syncBookingDraft();

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.sessionStorage) {
        return;
      }

      if (event.key !== null && event.key !== BOOKING_STORAGE_KEY) {
        return;
      }

      syncBookingDraft();
    };

    window.addEventListener(BOOKING_STORAGE_UPDATED_EVENT, syncBookingDraft);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        BOOKING_STORAGE_UPDATED_EVENT,
        syncBookingDraft,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!bookingDraft?.holdExpiresAt) {
      return;
    }

    const timer = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [bookingDraft?.holdExpiresAt]);

  function updateField<K extends keyof GuestFormValues>(
    field: K,
    value: GuestFormValues[K],
  ) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function updatePaymentField<K extends keyof PaymentFormValues>(
    field: K,
    value: PaymentFormValues[K],
  ) {
    setPaymentValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function handleBlur(field: keyof GuestFormValues) {
    setTouchedFields((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function handlePhoneChange(value: string) {
    updateField("phone", formatVietnamesePhone(value));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasAttemptedSubmit(true);
    setAvailabilityConflict(null);
    setSubmitError(null);

    if (!canSubmit || bookingContextMissing || !bookingDraft) {
      return;
    }

    const persistedGuestDraft: PersistedGuestDetailsDraft = {
      ...formValues,
      phone: formatVietnamesePhone(formValues.phone),
      normalizedPhone: normalizeVietnamesePhone(formValues.phone),
      phoneE164: toVietnamE164(formValues.phone),
      guestCount: servicePresentation.guestLabel,
      setType: servicePresentation.setLabel,
      nailType: servicePresentation.nailLabel,
      polishStyle: servicePresentation.polishLabel,
      effect:
        servicePresentation.effectLabels.length > 0
          ? servicePresentation.effectLabels.join(", ")
          : "Không có",
      serviceLabel,
      paymentMethod: paymentValues.method,
      paymentDetails: buildPersistedPaymentDetails(paymentValues, formValues.phone),
    };

    window.sessionStorage.setItem(
      GUEST_DETAILS_STORAGE_KEY,
      JSON.stringify(persistedGuestDraft),
    );
    notifyGuestStorageUpdated();
    setIsSubmitting(true);

    try {
      const result = await createSharedBooking({
        bookingDraft,
        guestDraft: persistedGuestDraft,
      });

      window.sessionStorage.setItem(
        BOOKING_STORAGE_KEY,
        JSON.stringify({
          ...bookingDraft,
          date: result.booking.date,
          startTime: result.booking.startTime,
          endTime: result.booking.estimatedEndTime,
          durationMinutes: result.booking.durationMinutes,
          blockedDurationMinutes: result.booking.durationMinutes,
          status: result.booking.status ?? DEFAULT_WEB_BOOKING_STATUS,
          holdSlot: null,
          holdExpiresAt: null,
          latestNotice: null,
          persistedBookingId: result.booking.id,
          referenceCode: result.booking.referenceCode,
          runtimeSource: result.source,
        }),
      );
      notifyBookingStorageUpdated();

      router.push("/dat-lich/xac-nhan");
    } catch (error) {
      if (error instanceof BookingApiError && error.status === 409) {
        const payload = error.payload as
          | { message?: string; alternativeSlots?: string[] }
          | undefined;
        const conflictNotice: BookingFlowNotice = {
          type: "recheck_conflict",
          message:
            payload?.message ??
            "Khung giờ vừa không còn khả dụng. Vui lòng chọn lại.",
          alternativeSlots: payload?.alternativeSlots ?? [],
        };

        setAvailabilityConflict(conflictNotice);

        window.sessionStorage.setItem(
          BOOKING_STORAGE_KEY,
          JSON.stringify({
            ...bookingDraft,
            startTime: null,
            endTime: null,
            holdSlot: null,
            holdExpiresAt: null,
            status: "draft",
            latestNotice: conflictNotice,
          }),
        );
        notifyBookingStorageUpdated();
      } else {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Không thể tạo lịch hẹn từ lớp dữ liệu dùng chung.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fdf9f6]/80 px-6 py-4 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link
            href="/dat-lich"
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

      <main className="mx-auto max-w-lg px-4 pb-16 pt-24 sm:px-5">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl tracking-tight text-foreground">
            Thông tin khách
          </h1>
          <div className="mx-auto mt-4 h-px w-8 bg-primary/30" />
        </div>

        {!hasHydrated ? (
          <section className="rounded-[1rem] border border-border/40 bg-white p-6 shadow-[0_12px_40px_rgba(127,82,83,0.06)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Đang tải lịch hẹn
            </p>
            <h2 className="mt-3 font-serif text-2xl text-foreground">
              Đang khôi phục thông tin bạn vừa chọn.
            </h2>
            <p className="mt-4 text-sm leading-7 text-text-muted">
              Vui lòng đợi trong giây lát để salon giữ đúng khung giờ và dữ liệu
              khách trong cùng phiên đặt lịch.
            </p>
          </section>
        ) : shouldShowHoldExpired || bookingContextMissing || activeConflictNotice ? (
          <section className="rounded-[1rem] border border-border/40 bg-white p-6 shadow-[0_12px_40px_rgba(127,82,83,0.06)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              {activeConflictNotice
                ? "Khung giờ vừa thay đổi"
                : shouldShowHoldExpired
                ? "Giữ chỗ đã hết hạn"
                : "Thiếu dữ liệu lịch hẹn"}
            </p>
            <h2 className="mt-3 font-serif text-2xl text-foreground">
              {activeConflictNotice
                ? "Khung giờ bạn chọn vừa không còn khả dụng để tiếp tục bước thông tin khách."
                : shouldShowHoldExpired
                ? "Khung giờ bạn giữ tạm không còn hiệu lực để tiếp tục sang bước này."
                : "Bạn cần chọn ngày và giờ trước khi nhập thông tin khách."}
            </h2>
            <p className="mt-4 text-sm leading-7 text-text-muted">
              {activeConflictNotice
                ? activeConflictNotice.message
                : shouldShowHoldExpired
                ? "Vui lòng quay lại trang đặt lịch để chọn lại một khung giờ khả dụng rồi tiếp tục."
                : "Hãy quay lại trang đặt lịch để chọn ngày, khung giờ và thợ phù hợp, sau đó tiếp tục sang bước này."}
            </p>
            {activeConflictNotice?.alternativeSlots.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {activeConflictNotice.alternativeSlots.map((slot) => (
                  <span
                    key={slot}
                    className="rounded-full border border-primary/15 bg-[#fffaf7] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary"
                  >
                    {slot}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-8">
              <Link
                href="/dat-lich"
                className="inline-flex rounded-full bg-[linear-gradient(135deg,#7f5253_0%,#d9a2a2_100%)] px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_12px_32px_rgba(127,82,83,0.15)]"
              >
                Quay lại đặt lịch
              </Link>
            </div>
          </section>
        ) : (
          <>
            {holdCountdownLabel ? (
              <section
                role="status"
                aria-live="polite"
                className="mb-6 rounded-[1rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(217,162,162,0.12)_0%,rgba(255,255,255,0.9)_100%)] px-4 py-4 shadow-[0_8px_24px_rgba(127,82,83,0.04)]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Giữ chỗ tạm
                </p>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <p className="text-sm leading-6 text-text-muted">
                    Khung giờ bạn chọn vẫn đang được giữ tạm cho bước xác nhận cuối.
                  </p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary shadow-[0_6px_16px_rgba(127,82,83,0.06)]">
                    {holdCountdownLabel}
                  </span>
                </div>
              </section>
            ) : null}

            <GuestSummaryCard
              dateLabel={bookingDraft.dateLabel!}
              startTime={bookingDraft.startTime!}
              endTime={bookingDraft.endTime!}
              durationMinutes={bookingDraft.durationMinutes}
              staffName={bookingDraft.staffName}
              serviceLabel={serviceLabel}
            />

            <form className="space-y-8" onSubmit={handleSubmit}>
              <section className="space-y-5">
                <div>
                  <h2 className="font-serif text-xl text-foreground">
                    Thông tin liên hệ
                  </h2>
                </div>

                <FieldShell
                  label="Họ tên"
                  htmlFor="fullName"
                  error={
                    (hasAttemptedSubmit || touchedFields.fullName) &&
                    guestErrors.fullName
                      ? guestErrors.fullName
                      : undefined
                  }
                >
                  <input
                    id="fullName"
                    type="text"
                    value={formValues.fullName}
                    onChange={(event) =>
                      updateField("fullName", event.target.value)
                    }
                    onBlur={() => handleBlur("fullName")}
                    placeholder="Ví dụ: Nguyễn Minh Anh"
                    autoComplete="name"
                    className="w-full rounded-xl border border-transparent bg-[#f1edea] px-4 py-4 text-foreground outline-none transition placeholder:text-[#b9aaa3] focus:border-primary/15 focus:bg-white focus:ring-1 focus:ring-primary/30"
                  />
                </FieldShell>

                <FieldShell
                  label="Số điện thoại"
                  htmlFor="phone"
                  error={
                    (hasAttemptedSubmit || touchedFields.phone) && guestErrors.phone
                      ? guestErrors.phone
                      : undefined
                  }
                >
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8e807c]">
                      +84
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      value={formValues.phone}
                      onChange={(event) => handlePhoneChange(event.target.value)}
                      onBlur={() => handleBlur("phone")}
                      placeholder="0901 234 567"
                      autoComplete="tel"
                      className="w-full rounded-xl border border-transparent bg-[#f1edea] py-4 pl-14 pr-4 text-foreground outline-none transition placeholder:text-[#b9aaa3] focus:border-primary/15 focus:bg-white focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </FieldShell>

                <FieldShell label="Ghi chú" htmlFor="note">
                  <textarea
                    id="note"
                    rows={4}
                    value={formValues.note}
                    onChange={(event) => updateField("note", event.target.value)}
                    placeholder="Ví dụ: muốn tone nude, ưu tiên làm nhanh, cần giữ form ngắn..."
                    className="w-full resize-none rounded-xl border border-transparent bg-[#f1edea] px-4 py-4 text-foreground outline-none transition placeholder:text-[#b9aaa3] focus:border-primary/15 focus:bg-white focus:ring-1 focus:ring-primary/30"
                  />
                </FieldShell>
              </section>

              <section className="space-y-5">
                <div>
                  <h2 className="font-serif text-xl text-foreground">
                    Thanh toán
                  </h2>
                </div>

                <div className="grid gap-3">
                  {PAYMENT_METHOD_OPTIONS.map((option) => {
                    const isSelected = option.value === paymentValues.method;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updatePaymentField("method", option.value)}
                        aria-pressed={isSelected}
                        className={[
                          "rounded-[1rem] border px-4 py-4 text-left transition",
                          isSelected
                            ? "border-primary/25 bg-[linear-gradient(135deg,rgba(217,162,162,0.16)_0%,rgba(255,255,255,0.98)_100%)] shadow-[0_10px_24px_rgba(127,82,83,0.08)]"
                            : "border-border/70 bg-[#fbf8f6] hover:border-primary/20 hover:bg-white",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="block text-sm font-semibold text-foreground">
                              {option.label}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-text-muted">
                              {option.value === "pay_at_salon"
                                ? "Thanh toán trực tiếp khi đến lịch hẹn."
                                : option.value === "bank_transfer"
                                  ? "Hiển thị QR và thông tin tài khoản demo để khách tham khảo."
                                  : "Nhập thông tin thẻ nội địa demo trước khi xác nhận."}
                            </span>
                          </div>
                          <span
                            className={[
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              isSelected
                                ? "border-primary bg-primary text-white"
                                : "border-[#d8cbc5] bg-white text-transparent",
                            ].join(" ")}
                          >
                            •
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {paymentValues.method === "bank_transfer" ? (
                  <section className="rounded-[1.1rem] border border-border/40 bg-white p-5 shadow-[0_12px_40px_rgba(127,82,83,0.06)] sm:p-6">
                    <div className="grid gap-5 sm:grid-cols-[1.05fr_1fr]">
                      <div className="rounded-[1rem] bg-[linear-gradient(135deg,#7f5253_0%,#d9a2a2_100%)] p-4 text-white">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
                          QR demo
                        </p>
                        <div className="mt-3 rounded-[0.9rem] bg-white p-4 text-center text-primary shadow-[inset_0_0_0_1px_rgba(127,82,83,0.08)]">
                          <div className="mx-auto grid h-36 w-36 grid-cols-6 gap-1">
                            {Array.from({ length: 36 }).map((_, index) => (
                              <span
                                key={index}
                                className={
                                  index % 2 === 0 || index % 5 === 0
                                    ? "rounded-[2px] bg-primary"
                                    : "rounded-[2px] bg-[#f2e9e5]"
                                }
                              />
                            ))}
                          </div>
                          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em]">
                            Quét mã để chuyển khoản demo
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <TransferRow label="Ngân hàng" value="MB Bank" />
                        <TransferRow label="Số tài khoản" value="1900191900" />
                        <TransferRow
                          label="Chủ tài khoản"
                          value="19NAIL STUDIO DEMO"
                        />
                        <TransferRow
                          label="Nội dung"
                          value={transferReference}
                        />
                      </div>
                    </div>
                  </section>
                ) : null}

                {paymentValues.method === "local_card" ? (
                  <section className="rounded-[1.1rem] border border-border/40 bg-white p-5 shadow-[0_12px_40px_rgba(127,82,83,0.06)] sm:p-6">
                    <div className="mb-5 rounded-[1rem] bg-[linear-gradient(135deg,#2f2626_0%,#6c5151_100%)] p-5 text-white shadow-[0_12px_32px_rgba(47,38,38,0.18)]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
                        Thẻ nội địa demo
                      </p>
                      <p className="mt-6 text-lg tracking-[0.18em]">
                        {paymentValues.cardNumber || "•••• •••• •••• ••••"}
                      </p>
                      <div className="mt-6 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">
                            Chủ thẻ
                          </p>
                          <p className="mt-1 text-sm">
                            {paymentValues.cardholderName || "Tên chủ thẻ"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">
                            Hạn thẻ
                          </p>
                          <p className="mt-1 text-sm">
                            {paymentValues.expiry || "MM/YY"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <FieldShell
                          label="Số thẻ"
                          htmlFor="cardNumber"
                          error={
                            hasAttemptedSubmit && paymentErrors.cardNumber
                              ? paymentErrors.cardNumber
                              : undefined
                          }
                        >
                          <input
                            id="cardNumber"
                            type="text"
                            inputMode="numeric"
                            value={paymentValues.cardNumber}
                            onChange={(event) =>
                              updatePaymentField(
                                "cardNumber",
                                formatCardNumber(event.target.value),
                              )
                            }
                            placeholder="9704 0000 0000 0000"
                            className="w-full rounded-xl border border-transparent bg-[#f1edea] px-4 py-4 text-foreground outline-none transition placeholder:text-[#b9aaa3] focus:border-primary/15 focus:bg-white focus:ring-1 focus:ring-primary/30"
                          />
                        </FieldShell>
                      </div>

                      <div className="sm:col-span-2">
                        <FieldShell
                          label="Tên chủ thẻ"
                          htmlFor="cardholderName"
                          error={
                            hasAttemptedSubmit && paymentErrors.cardholderName
                              ? paymentErrors.cardholderName
                              : undefined
                          }
                        >
                          <input
                            id="cardholderName"
                            type="text"
                            value={paymentValues.cardholderName}
                            onChange={(event) =>
                              updatePaymentField("cardholderName", event.target.value)
                            }
                            placeholder="NGUYEN MINH ANH"
                            className="w-full rounded-xl border border-transparent bg-[#f1edea] px-4 py-4 text-foreground outline-none transition placeholder:text-[#b9aaa3] focus:border-primary/15 focus:bg-white focus:ring-1 focus:ring-primary/30"
                          />
                        </FieldShell>
                      </div>

                      <FieldShell
                        label="Ngày hết hạn"
                        htmlFor="expiry"
                        error={
                          hasAttemptedSubmit && paymentErrors.expiry
                            ? paymentErrors.expiry
                            : undefined
                        }
                      >
                        <input
                          id="expiry"
                          type="text"
                          inputMode="numeric"
                          value={paymentValues.expiry}
                          onChange={(event) =>
                            updatePaymentField(
                              "expiry",
                              formatExpiry(event.target.value),
                            )
                          }
                          placeholder="MM/YY"
                          className="w-full rounded-xl border border-transparent bg-[#f1edea] px-4 py-4 text-foreground outline-none transition placeholder:text-[#b9aaa3] focus:border-primary/15 focus:bg-white focus:ring-1 focus:ring-primary/30"
                        />
                      </FieldShell>

                      <FieldShell
                        label="CVV"
                        htmlFor="cvv"
                        error={
                          hasAttemptedSubmit && paymentErrors.cvv
                            ? paymentErrors.cvv
                            : undefined
                        }
                      >
                        <input
                          id="cvv"
                          type="password"
                          inputMode="numeric"
                          value={paymentValues.cvv}
                          onChange={(event) =>
                            updatePaymentField(
                              "cvv",
                              event.target.value.replace(/\D/g, "").slice(0, 4),
                            )
                          }
                          placeholder="123"
                          className="w-full rounded-xl border border-transparent bg-[#f1edea] px-4 py-4 text-foreground outline-none transition placeholder:text-[#b9aaa3] focus:border-primary/15 focus:bg-white focus:ring-1 focus:ring-primary/30"
                        />
                      </FieldShell>
                    </div>
                  </section>
                ) : null}
              </section>

              <div className="pt-2 text-center">
                {submitError ? (
                  <p className="mb-3 text-sm leading-6 text-[#8a5d5f]">
                    {submitError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={
                    !canSubmit || Boolean(activeConflictNotice) || isSubmitting
                  }
                  className={[
                    "w-full rounded-full py-5 font-bold uppercase tracking-[0.12em] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                    canSubmit && !activeConflictNotice && !isSubmitting
                      ? "bg-[linear-gradient(135deg,#7f5253_0%,#d9a2a2_100%)] text-white shadow-[0_12px_40px_rgba(127,82,83,0.12)] active:scale-[0.99]"
                      : "bg-[#eadfdb] text-[#af9a95]",
                  ].join(" ")}
                >
                  {isSubmitting ? "ĐANG XÁC NHẬN" : "XÁC NHẬN"}
                </button>
              </div>
            </form>

            <footer className="mt-20 bg-[#f7f3f0] px-8 py-16 text-center">
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
                <span className="text-[10px] uppercase tracking-[0.1em] text-[#837373]">
                  Services
                </span>
                <span className="text-[10px] uppercase tracking-[0.1em] text-[#837373]">
                  Gallery
                </span>
                <span className="text-[10px] uppercase tracking-[0.1em] text-[#837373]">
                  Privacy
                </span>
                <span className="text-[10px] uppercase tracking-[0.1em] text-[#837373]">
                  Terms
                </span>
              </div>
              <p className="mt-8 text-[10px] uppercase tracking-[0.1em] text-primary">
                © 2024 19NAIL.STUDIO. THE ETHEREAL ATELIER.
              </p>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

function TransferRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[0.95rem] bg-[#faf6f3] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9a8983]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
