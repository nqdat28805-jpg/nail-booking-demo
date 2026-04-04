type GuestSummaryCardProps = {
  dateLabel: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  staffName: string;
  serviceLabel: string;
};

export function GuestSummaryCard({
  dateLabel,
  startTime,
  endTime,
  durationMinutes,
  staffName,
  serviceLabel,
}: GuestSummaryCardProps) {
  return (
    <section className="mb-10">
      <div className="rounded-[1.1rem] border border-border/40 bg-white p-5 shadow-[0_12px_40px_rgba(127,82,83,0.06)] sm:p-6">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,rgba(127,82,83,0.1)_0%,rgba(255,255,255,0.98)_100%)] shadow-[inset_0_0_0_1px_rgba(127,82,83,0.08)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/15 bg-white text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              19N
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg text-foreground">
              Tóm tắt lịch hẹn
            </h3>
            <p className="mt-1 text-sm text-[#8e807c]">
              Tóm tắt lịch đã chọn
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[1rem] bg-[#faf6f3] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Dịch vụ
            </p>
            <p className="mt-1 break-words font-medium text-foreground">
              {serviceLabel}
            </p>
            <p className="mt-1 text-xs text-[#8e807c]">
              {durationMinutes} phút
            </p>
          </div>

          <div className="grid gap-4 border-t border-[#efe7e2] pt-4 sm:grid-cols-2">
            <SummaryItem label="Ngày" value={dateLabel} />
            <SummaryItem label="Thợ" value={staffName} />
            <SummaryItem label="Bắt đầu" value={startTime} />
            <SummaryItem label="Kết thúc dự kiến" value={endTime} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
