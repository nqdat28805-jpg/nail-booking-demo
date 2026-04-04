"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSharedBookingById, type SharedBookingRecordPayload } from "../../booking-api";
import {
  BOOKING_STORAGE_KEY,
  BOOKING_STORAGE_UPDATED_EVENT,
  DEFAULT_PAYMENT_METHOD,
  GUEST_DETAILS_STORAGE_KEY,
  GUEST_STORAGE_UPDATED_EVENT,
  readStoredJson,
  type PaymentMethod,
  type PersistedBookingDraft,
  type PersistedGuestDetailsDraft,
} from "../../booking-mock";

function createBookingReference(
  bookingDraft: PersistedBookingDraft,
  guestDraft: PersistedGuestDetailsDraft,
) {
  const datePart = bookingDraft.date?.replaceAll("-", "") ?? "20260420";
  const phonePart = guestDraft.normalizedPhone.slice(-4).padStart(4, "0");

  return `NL-${datePart}-${phonePart}`;
}

export function ConfirmationExperience() {
  const [bookingDraft, setBookingDraft] = useState<PersistedBookingDraft | null>(
    () => readStoredJson<PersistedBookingDraft>(BOOKING_STORAGE_KEY),
  );
  const [guestDraft, setGuestDraft] = useState<PersistedGuestDetailsDraft | null>(
    () => readStoredJson<PersistedGuestDetailsDraft>(GUEST_DETAILS_STORAGE_KEY),
  );
  const [hasHydrated, setHasHydrated] = useState(false);
  const [sharedBookingRecord, setSharedBookingRecord] =
    useState<SharedBookingRecordPayload | null>(null);

  useEffect(() => {
    const syncDrafts = () => {
      setBookingDraft(readStoredJson<PersistedBookingDraft>(BOOKING_STORAGE_KEY));
      setGuestDraft(
        readStoredJson<PersistedGuestDetailsDraft>(GUEST_DETAILS_STORAGE_KEY),
      );
      setHasHydrated(true);
    };

    syncDrafts();

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.sessionStorage) {
        return;
      }

      if (
        event.key !== null &&
        event.key !== BOOKING_STORAGE_KEY &&
        event.key !== GUEST_DETAILS_STORAGE_KEY
      ) {
        return;
      }

      syncDrafts();
    };

    window.addEventListener(BOOKING_STORAGE_UPDATED_EVENT, syncDrafts);
    window.addEventListener(GUEST_STORAGE_UPDATED_EVENT, syncDrafts);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(BOOKING_STORAGE_UPDATED_EVENT, syncDrafts);
      window.removeEventListener(GUEST_STORAGE_UPDATED_EVENT, syncDrafts);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!bookingDraft?.persistedBookingId) {
      setSharedBookingRecord(null);
      return;
    }

    let cancelled = false;

    void fetchSharedBookingById(bookingDraft.persistedBookingId)
      .then((payload) => {
        if (!cancelled) {
          setSharedBookingRecord(payload);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSharedBookingRecord(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookingDraft?.persistedBookingId]);

  const persistedBooking = sharedBookingRecord?.booking ?? null;
  const displayDate =
    bookingDraft?.dateLabel ?? persistedBooking?.date ?? null;
  const displayStartTime =
    persistedBooking?.startTime ?? bookingDraft?.startTime ?? null;
  const displayEndTime =
    persistedBooking?.estimatedEndTime ?? bookingDraft?.endTime ?? null;
  const displayDuration =
    persistedBooking?.durationMinutes ?? bookingDraft?.durationMinutes ?? null;
  const displayStaffName =
    sharedBookingRecord?.assignedStaffName ??
    bookingDraft?.staffName ??
    "Bất kỳ thợ nào";

  const isMissingData =
    !displayDate ||
    !displayStartTime ||
    !displayEndTime ||
    !guestDraft?.fullName ||
    !guestDraft.phone;

  const bookingReference =
    persistedBooking?.referenceCode ??
    bookingDraft?.referenceCode ??
    (bookingDraft && guestDraft
      ? createBookingReference(bookingDraft, guestDraft)
      : null);
  const selectedPaymentMethod =
    persistedBooking?.paymentSummary?.method ??
    guestDraft?.paymentMethod ??
    DEFAULT_PAYMENT_METHOD;
  const paymentDetail =
    persistedBooking?.paymentSummary?.detailValue
      ? {
          label:
            persistedBooking.paymentSummary.detailLabel ?? "Chi tiết thanh toán",
          value: persistedBooking.paymentSummary.detailValue,
        }
      : guestDraft
        ? getPaymentDetail(selectedPaymentMethod, guestDraft)
        : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fdf9f6]/80 px-6 py-4 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link
            href="/dat-lich/thong-tin"
            className="text-xl text-primary transition hover:opacity-70"
          >
            ←
          </Link>
          <span className="font-serif text-xl tracking-[-0.02em] text-primary">
            19NAIL.STUDIO
          </span>
          <span className="w-4 text-right text-xs text-primary">•</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-24 pt-24 sm:px-5">
        {!hasHydrated ? (
          <section className="rounded-[1rem] border border-border/40 bg-white p-6 shadow-[0_12px_40px_rgba(127,82,83,0.06)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Đang tải xác nhận
            </p>
            <h1 className="mt-3 font-serif text-3xl leading-tight text-foreground">
              Đang khôi phục dữ liệu lịch hẹn cuối cùng của bạn.
            </h1>
            <p className="mt-4 text-sm leading-7 text-text-muted">
              Vui lòng đợi trong giây lát để hoàn thiện màn xác nhận trong cùng
              phiên đặt lịch.
            </p>
          </section>
        ) : isMissingData || !bookingDraft || !guestDraft ? (
          <section className="rounded-[1rem] border border-border/40 bg-white p-6 shadow-[0_12px_40px_rgba(127,82,83,0.06)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Thiếu dữ liệu xác nhận
            </p>
            <h1 className="mt-3 font-serif text-3xl leading-tight text-foreground">
              Không tìm thấy thông tin lịch hẹn để hiển thị màn xác nhận.
            </h1>
            <p className="mt-4 text-sm leading-7 text-text-muted">
              Hãy quay lại trang đặt lịch và hoàn tất lại các bước chọn ngày giờ
              và thông tin khách hàng trước khi xem xác nhận.
            </p>
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
            <section className="mb-12 text-center">
              <div className="relative mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#f1edea]">
                <div className="absolute inset-0 animate-pulse rounded-full border border-primary/10" />
                <span className="text-4xl text-primary">✓</span>
              </div>
              <h1 className="mb-2 font-serif text-3xl leading-tight tracking-tight text-foreground">
                Đặt lịch thành công
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8e807c]">
                Mã lịch hẹn: #{bookingReference}
              </p>
            </section>

            <section className="relative mb-8 overflow-hidden rounded-[1.1rem] bg-white p-5 shadow-[0_12px_40px_rgba(127,82,83,0.06)] sm:p-6">
              <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
              <h2 className="mb-6 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
                Thông tin đặt lịch
              </h2>
              <div className="space-y-5">
                <ConfirmationRow label="Khách hàng" value={guestDraft.fullName} />
                <ConfirmationRow label="Số điện thoại" value={guestDraft.phone} />
                <ConfirmationRow
                  label="Dịch vụ"
                  value={
                    persistedBooking?.pricingSummary?.serviceDisplayLabel ??
                    guestDraft.serviceLabel ??
                    "Dịch vụ móng theo yêu cầu"
                  }
                  detail={`${guestDraft.guestCount} • ${guestDraft.setType}`}
                />
                <ConfirmationRow label="Ngày" value={displayDate} />
                <ConfirmationRow label="Giờ bắt đầu" value={displayStartTime} />
                <ConfirmationRow
                  label="Giờ dự kiến xong"
                  value={displayEndTime}
                />
                <ConfirmationRow
                  label="Thời lượng dự kiến"
                  value={`${displayDuration} phút`}
                />
                <ConfirmationRow label="Thợ" value={displayStaffName} />
                <ConfirmationRow
                  label="Phương thức thanh toán"
                  value={getPaymentMethodLabel(selectedPaymentMethod)}
                />
                <ConfirmationRow
                  label="Trạng thái thanh toán"
                  value={
                    persistedBooking?.paymentSummary?.status
                      ? getPaymentStatusLabelFromSummary(
                          persistedBooking.paymentSummary.status,
                        )
                      : getPaymentStatusLabel(selectedPaymentMethod)
                  }
                />
                {paymentDetail ? (
                  <ConfirmationRow
                    label={paymentDetail.label}
                    value={paymentDetail.value}
                  />
                ) : null}
              </div>
            </section>

            <footer className="flex flex-col gap-4">
              <Link
                href="/dat-lich"
                className="rounded-full bg-[linear-gradient(135deg,#7f5253_0%,#d9a2a2_100%)] px-8 py-4 text-center text-sm font-bold uppercase tracking-[0.1em] text-white shadow-[0_12px_40px_rgba(127,82,83,0.12)] transition-transform active:scale-[0.99]"
              >
                Đặt lịch khác
              </Link>
              <Link
                href="/"
                className="rounded-full px-8 py-3 text-center text-xs font-medium uppercase tracking-[0.1em] text-primary transition-colors hover:bg-[#f1edea]"
              >
                Về trang chủ
              </Link>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

function ConfirmationRow({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm font-light text-[#8e807c]">{label}</span>
      <span className="min-w-0 max-w-[65%] break-words text-right font-medium text-foreground">
        {accent ? (
          <span className="inline-flex rounded-full bg-[#f1edea] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {value}
          </span>
        ) : (
          value
        )}
        {detail ? (
          <span className="block text-[11px] font-normal uppercase tracking-[0.14em] text-[#8e807c]">
            {detail}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function getPaymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case "bank_transfer":
      return "Chuyển khoản";
    case "local_card":
      return "Thẻ nội địa";
    default:
      return "Thanh toán tại salon";
  }
}

function getPaymentStatusLabel(method: PaymentMethod) {
  switch (method) {
    case "bank_transfer":
      return "Chờ thanh toán chuyển khoản";
    case "local_card":
      return "Đã nhập thông tin thẻ";
    default:
      return "Thanh toán khi đến lịch";
  }
}

function getPaymentStatusLabelFromSummary(status: string) {
  switch (status) {
    case "awaiting_bank_transfer":
      return "Chờ thanh toán chuyển khoản";
    case "card_details_captured":
      return "Đã nhập thông tin thẻ";
    case "pay_at_salon":
      return "Thanh toán khi đến lịch";
    case "paid":
      return "Đã thanh toán";
    default:
      return "Chờ xác nhận thanh toán";
  }
}

function getPaymentDetail(
  method: PaymentMethod,
  guestDraft: PersistedGuestDetailsDraft,
): { label: string; value: string } | null {
  if (method === "bank_transfer") {
    return {
      label: "Chi tiết thanh toán",
      value: guestDraft.paymentDetails?.transferReference ?? "19NAIL-0000",
    };
  }

  if (method === "local_card") {
    return {
      label: "Chi tiết thanh toán",
      value: maskCardNumber(guestDraft.paymentDetails?.cardNumber),
    };
  }

  return null;
}

function maskCardNumber(value?: string) {
  if (!value) {
    return "•••• •••• •••• ••••";
  }

  const digits = value.replace(/\D/g, "");
  const visible = digits.slice(-4).padStart(digits.length, "•");
  return visible.replace(/(.{4})/g, "$1 ").trim();
}
