"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BOOKING_STORAGE_KEY,
  BOOKING_STORAGE_UPDATED_EVENT,
  formatVietnamesePhone,
  formatHoldCountdown,
  GUEST_DETAILS_STORAGE_KEY,
  getHoldRemainingMs,
  notifyBookingStorageUpdated,
  notifyGuestStorageUpdated,
  normalizeVietnamesePhone,
  readStoredJson,
  simulateFinalAvailabilityCheck,
  type BookingFlowNotice,
  type PersistedBookingDraft,
  type PersistedGuestDetailsDraft,
} from "../../booking-mock";
import { FieldShell } from "./field-shell";
import { GuestSummaryCard } from "./guest-summary-card";

type GuestFormValues = {
  fullName: string;
  phone: string;
  guestCount: string;
  setCount: string;
  nailType: string;
  polishStyle: string;
  effect: string;
  note: string;
};

type GuestFormErrors = Partial<Record<keyof GuestFormValues, string>>;

const defaultFormValues: GuestFormValues = {
  fullName: "",
  phone: "",
  guestCount: "1 khách",
  setCount: "1 bộ",
  nailType: "Móng tự nhiên",
  polishStyle: "Sơn gel",
  effect: "Không chọn",
  note: "",
};

const guestCountOptions = ["1 khách", "2 khách", "3 khách"];
const setCountOptions = ["1 bộ", "2 bộ", "3 bộ"];
const nailTypeOptions = ["Móng tự nhiên", "Nail tip / nối móng"];
const polishStyleOptions = ["Sơn gel", "Sơn thường", "Cat eye"];
const effectOptions = [
  "Không chọn",
  "Đính đá nhẹ",
  "Tráng gương",
  "Vẽ đơn giản",
];

function getInitialGuestFormValues() {
  const storedGuestDraft =
    readStoredJson<PersistedGuestDetailsDraft>(GUEST_DETAILS_STORAGE_KEY);

  if (!storedGuestDraft) {
    return defaultFormValues;
  }

  return {
    fullName: storedGuestDraft.fullName,
    phone: storedGuestDraft.phone,
    guestCount: storedGuestDraft.guestCount,
    setCount: storedGuestDraft.setCount,
    nailType: storedGuestDraft.nailType,
    polishStyle: storedGuestDraft.polishStyle,
    effect: storedGuestDraft.effect,
    note: storedGuestDraft.note,
  };
}

function validate(values: GuestFormValues) {
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

function buildServiceLabel(values: GuestFormValues) {
  const details = [values.nailType, values.polishStyle];

  if (values.effect !== "Không chọn") {
    details.push(values.effect);
  }

  return details.join(" · ");
}

export function GuestDetailsExperience() {
  const router = useRouter();
  const [bookingDraft, setBookingDraft] = useState<PersistedBookingDraft | null>(
    () => readStoredJson<PersistedBookingDraft>(BOOKING_STORAGE_KEY),
  );
  const [formValues, setFormValues] = useState(getInitialGuestFormValues);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof GuestFormValues, boolean>>
  >({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [availabilityConflict, setAvailabilityConflict] =
    useState<BookingFlowNotice | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const errors = validate(formValues);
  const canSubmit = Object.keys(errors).length === 0;
  const serviceLabel = buildServiceLabel(formValues);
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
  const conflictMessage = activeConflictNotice?.message ?? "";
  const conflictAlternativeSlots = activeConflictNotice?.alternativeSlots ?? [];

  useEffect(() => {
    router.prefetch("/dat-lich/xac-nhan");
  }, [router]);

  useEffect(() => {
    const syncBookingDraft = () => {
      setBookingDraft(readStoredJson<PersistedBookingDraft>(BOOKING_STORAGE_KEY));
      setFormValues(getInitialGuestFormValues());
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

  function handleBlur(field: keyof GuestFormValues) {
    setTouchedFields((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function handlePhoneChange(value: string) {
    updateField("phone", formatVietnamesePhone(value));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasAttemptedSubmit(true);
    setAvailabilityConflict(null);

    if (!canSubmit || bookingContextMissing) {
      return;
    }

    const persistedGuestDraft: PersistedGuestDetailsDraft = {
      ...formValues,
      phone: formatVietnamesePhone(formValues.phone),
      normalizedPhone: normalizeVietnamesePhone(formValues.phone),
      serviceLabel,
    };

    window.sessionStorage.setItem(
      GUEST_DETAILS_STORAGE_KEY,
      JSON.stringify(persistedGuestDraft),
    );
    notifyGuestStorageUpdated();

    const recheckResult = simulateFinalAvailabilityCheck(
      bookingDraft,
      persistedGuestDraft,
      Date.now(),
    );

    if (!recheckResult.success) {
      const conflictNotice: BookingFlowNotice = {
        type: "recheck_conflict",
        message: recheckResult.message,
        alternativeSlots: recheckResult.alternativeSlots,
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

      return;
    }

    window.sessionStorage.setItem(
      BOOKING_STORAGE_KEY,
      JSON.stringify({
        ...bookingDraft,
        status: "pending",
        holdSlot: null,
        holdExpiresAt: null,
        latestNotice: null,
      }),
    );
    notifyBookingStorageUpdated();

    router.push("/dat-lich/xac-nhan");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-secondary/15 bg-[#f9f5f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-5 sm:px-6">
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
        <div className="mb-10 text-center">
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Step 03
          </span>
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

            {activeConflictNotice ? (
              <section
                role="status"
                aria-live="polite"
                className="mb-6 rounded-[1rem] border border-border/40 bg-white p-5 shadow-[0_12px_40px_rgba(127,82,83,0.06)]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Khung giờ vừa thay đổi
                </p>
                <p className="mt-3 text-sm leading-7 text-text-muted">
                  {conflictMessage}
                </p>
                {conflictAlternativeSlots.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {conflictAlternativeSlots.map((slot) => (
                      <span
                        key={slot}
                        className="rounded-full border border-primary/15 bg-[#fffaf7] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-6">
                  <Link
                    href="/dat-lich"
                    className="inline-flex rounded-full bg-[linear-gradient(135deg,#7f5253_0%,#d9a2a2_100%)] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_12px_32px_rgba(127,82,83,0.12)]"
                  >
                    Quay lại chọn giờ khác
                  </Link>
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
              guestCount={formValues.guestCount}
              setCount={formValues.setCount}
            />

            <section className="space-y-8">
              <div className="mb-4">
                <h2 className="font-serif text-xl text-foreground">
                  Thông tin cá nhân
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[#8e807c]">
                  Vui lòng để lại thông tin để salon giữ chỗ và chuẩn bị đúng
                  dịch vụ bạn mong muốn.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <FieldShell
                  label="Họ tên"
                  htmlFor="fullName"
                  error={
                    (hasAttemptedSubmit || touchedFields.fullName) &&
                    errors.fullName
                      ? errors.fullName
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
                    (hasAttemptedSubmit || touchedFields.phone) && errors.phone
                      ? errors.phone
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

                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    id="guestCount"
                    label="Số người"
                    value={formValues.guestCount}
                    options={guestCountOptions}
                    onChange={(value) => updateField("guestCount", value)}
                  />
                  <SelectField
                    id="setCount"
                    label="Số bộ"
                    value={formValues.setCount}
                    options={setCountOptions}
                    onChange={(value) => updateField("setCount", value)}
                  />
                </div>

                <SelectField
                  id="nailType"
                  label="Loại móng"
                  value={formValues.nailType}
                  options={nailTypeOptions}
                  onChange={(value) => updateField("nailType", value)}
                />

                <SelectField
                  id="polishStyle"
                  label="Kiểu sơn"
                  value={formValues.polishStyle}
                  options={polishStyleOptions}
                  onChange={(value) => updateField("polishStyle", value)}
                />

                <SelectField
                  id="effect"
                  label="Hiệu ứng"
                  value={formValues.effect}
                  options={effectOptions}
                  onChange={(value) => updateField("effect", value)}
                />

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

                <div className="pt-4 text-center">
                  <button
                    type="submit"
                    disabled={!canSubmit || Boolean(activeConflictNotice)}
                    className={[
                      "w-full rounded-full py-5 font-bold uppercase tracking-[0.12em] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                      canSubmit && !activeConflictNotice
                        ? "bg-[linear-gradient(135deg,#7f5253_0%,#d9a2a2_100%)] text-white shadow-[0_12px_40px_rgba(127,82,83,0.12)] active:scale-[0.99]"
                        : "bg-[#eadfdb] text-[#af9a95]",
                    ].join(" ")}
                  >
                    Tiếp tục đến xác nhận
                  </button>
                  <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.16em] text-[#9a8983]">
                    Dữ liệu lưu cục bộ trong trình duyệt để sang bước xác nhận
                  </p>
                </div>
              </form>
            </section>

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

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: SelectFieldProps) {
  return (
    <FieldShell label={label} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-transparent bg-[#f1edea] px-4 py-4 text-foreground outline-none transition focus:border-primary/15 focus:bg-white focus:ring-1 focus:ring-primary/30"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
