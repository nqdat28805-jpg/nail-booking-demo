"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BOOKING_STORAGE_KEY,
  BOOKING_STORAGE_UPDATED_EVENT,
  GUEST_DETAILS_STORAGE_KEY,
  GUEST_STORAGE_UPDATED_EVENT,
  readStoredJson,
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

  const isMissingData =
    !bookingDraft?.dateLabel ||
    !bookingDraft.startTime ||
    !bookingDraft.endTime ||
    !bookingDraft.staffName ||
    bookingDraft.status !== "pending" ||
    !guestDraft?.fullName ||
    !guestDraft.phone;

  const bookingReference =
    bookingDraft && guestDraft
      ? createBookingReference(bookingDraft, guestDraft)
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
                <div className="absolute inset-0 rounded-full border border-primary/10 animate-pulse" />
                <span className="text-4xl text-primary">✓</span>
              </div>
              <h1 className="mb-2 font-serif text-3xl leading-tight tracking-tight text-foreground">
                Lịch hẹn đã được ghi nhận
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
                <ConfirmationRow label="Trạng thái" value="pending" accent />
                <ConfirmationRow
                  label="Khách hàng"
                  value={guestDraft.fullName}
                />
                <ConfirmationRow
                  label="Dịch vụ"
                  value={guestDraft.serviceLabel || "Dịch vụ móng theo yêu cầu"}
                  detail={`${guestDraft.guestCount} • ${guestDraft.setCount}`}
                />
                <ConfirmationRow label="Ngày" value={bookingDraft.dateLabel!} />
                <ConfirmationRow
                  label="Giờ bắt đầu"
                  value={bookingDraft.startTime!}
                />
                <ConfirmationRow
                  label="Giờ dự kiến xong"
                  value={bookingDraft.endTime!}
                />
                <ConfirmationRow
                  label="Thời lượng dự kiến"
                  value={`${bookingDraft.durationMinutes} phút`}
                />
                <ConfirmationRow label="Thợ" value={bookingDraft.staffName} />
              </div>
            </section>

            <section className="mb-8 rounded-[1.1rem] bg-[#f7f3f0] p-5 shadow-[0_12px_40px_rgba(127,82,83,0.04)]">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 text-primary">i</span>
                <div>
                  <h3 className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-foreground">
                    Lưu ý từ salon
                  </h3>
                  <p className="text-xs leading-relaxed text-text-muted">
                    Vui lòng đến sớm 5 phút để salon sắp xếp chỗ ngồi. Mã lịch
                    hẹn và nội dung nhắc hẹn hiện là dữ liệu mô phỏng cục bộ cho
                    bản demo public flow.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8 space-y-6">
              <h3 className="font-serif text-xl text-foreground">
                Thông tin khách
              </h3>
              <div className="rounded-[1.1rem] bg-white p-5 shadow-[0_12px_40px_rgba(127,82,83,0.06)] sm:p-6">
                <div className="space-y-4">
                  <ConfirmationRow label="Họ tên" value={guestDraft.fullName} />
                  <ConfirmationRow
                    label="Số điện thoại"
                    value={guestDraft.phone}
                  />
                  <ConfirmationRow
                    label="Loại móng"
                    value={guestDraft.nailType}
                  />
                  <ConfirmationRow
                    label="Kiểu sơn"
                    value={guestDraft.polishStyle}
                  />
                  <ConfirmationRow
                    label="Hiệu ứng"
                    value={guestDraft.effect}
                  />
                  <ConfirmationRow
                    label="Ghi chú"
                    value={guestDraft.note || "Không có ghi chú thêm"}
                  />
                </div>
              </div>
            </section>

            <section className="mb-12 rounded-[1.1rem] border border-border/40 bg-white p-5 shadow-[0_12px_40px_rgba(127,82,83,0.06)] sm:p-6">
              <h3 className="mb-4 font-serif text-xl text-foreground">
                Thông tin salon
              </h3>
              <div className="space-y-3 text-sm leading-7 text-text-muted">
                <p>19NAIL.STUDIO sẽ liên hệ lại qua số điện thoại bạn đã cung cấp nếu cần xác nhận thêm chi tiết.</p>
                <p>Khung giờ hiển thị là lịch hẹn dự kiến cho bản MVP customer-side, chưa kết nối backend thời gian thực.</p>
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
