type BookingSummaryBarProps = {
  selectedDateLabel: string | null;
  selectedSlot: string | null;
  staffName: string;
  serviceSummaryLabel: string;
  durationMinutes: number;
  endTime: string | null;
  holdCountdownLabel: string | null;
  canContinue: boolean;
  onContinue: () => void;
};

export function BookingSummaryBar({
  selectedDateLabel,
  selectedSlot,
  staffName,
  serviceSummaryLabel,
  durationMinutes,
  endTime,
  holdCountdownLabel,
  canContinue,
  onContinue,
}: BookingSummaryBarProps) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-secondary/20 bg-[#f9f5f2]/95 pb-[max(env(safe-area-inset-bottom),0px)] shadow-[0_-6px_24px_rgba(184,147,82,0.1)] backdrop-blur-md">
      <div className="mx-auto max-w-lg px-5 pb-6 pt-4 sm:px-6">
        {canContinue ? (
          <div className="flex items-start justify-between gap-4 rounded-[1rem] border border-white/50 bg-white/65 px-4 py-3 shadow-[0_10px_30px_rgba(127,82,83,0.05)]">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
                Tóm tắt
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#9e8071]">
                {selectedDateLabel}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#9e8071]">
                {staffName} · {selectedSlot}
              </p>
              <p className="max-w-[14rem] truncate text-[11px] font-medium uppercase tracking-[0.08em] text-[#9e8071]">
                {serviceSummaryLabel}
              </p>
              {holdCountdownLabel ? (
                <p
                  aria-live="polite"
                  className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary"
                >
                  Giữ tạm còn {holdCountdownLabel}
                </p>
              ) : null}
            </div>

            <div className="space-y-1 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
                Thời lượng {durationMinutes}p
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#9e8071]">
                Kết thúc {endTime}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
              Tóm tắt lịch hẹn
            </p>
            <p className="text-sm leading-6 text-text-muted">
              Chọn ngày, dịch vụ, thợ và khung giờ để hoàn thiện tóm tắt lịch
              hẹn trước khi tiếp tục.
            </p>
          </div>
        )}

        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={[
            "mt-4 w-full rounded-full py-4 text-sm font-bold uppercase tracking-[0.18em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
            canContinue
              ? "bg-[linear-gradient(135deg,#d9a2a2_0%,#c28d8d_100%)] text-white shadow-[0_14px_32px_rgba(217,162,162,0.28)] hover:brightness-[0.98]"
              : "bg-[#eadfdb] text-[#aa9892]",
          ].join(" ")}
        >
          Tiếp tục
        </button>
      </div>
    </footer>
  );
}
