type GuestSummaryCardProps = {
  dateLabel: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  staffName: string;
  serviceLabel: string;
  guestCount: string;
  setCount: string;
};

export function GuestSummaryCard({
  dateLabel,
  startTime,
  endTime,
  durationMinutes,
  staffName,
  serviceLabel,
  guestCount,
  setCount,
}: GuestSummaryCardProps) {
  return (
    <section className="mb-12">
      <div className="rounded-[1.1rem] border border-border/40 bg-white p-5 shadow-[0_12px_40px_rgba(127,82,83,0.06)] sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg text-foreground">
              Tóm tắt lịch hẹn
            </h3>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-[#9a8983]">
              Kiểm tra lựa chọn của bạn
            </p>
          </div>
          <span className="border-b border-primary/20 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            Tự động cập nhật
          </span>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#221f1f_0%,#5a4b47_100%)] text-sm font-semibold uppercase tracking-[0.18em] text-white">
              19
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Dịch vụ
              </p>
              <p className="mt-1 break-words font-medium text-foreground">
                {serviceLabel}
              </p>
              <p className="mt-0.5 text-xs text-[#8e807c]">
                {durationMinutes} phút • {guestCount} • {setCount}
              </p>
            </div>
          </div>

          <div className="grid gap-4 border-t border-[#efe7e2] pt-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Ngày & giờ
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {dateLabel}
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {startTime} - {endTime}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Thợ
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {staffName}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Kết thúc dự kiến
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {endTime}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
