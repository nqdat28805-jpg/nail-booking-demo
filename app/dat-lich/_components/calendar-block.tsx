import type { CalendarDay } from "../booking-mock";
import { WEEKDAY_LABELS } from "../booking-mock";

type CalendarBlockProps = {
  monthLabel: string;
  days: CalendarDay[];
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

const statusDotClasses = {
  available: "bg-primary",
  limited: "bg-secondary",
  closed: "bg-[#9c938f]",
  outside: "bg-transparent",
};

const statusLabels = {
  available: "Còn chỗ",
  limited: "Gần hết",
  closed: "Hết chỗ hoặc đóng cửa",
  outside: "Ngoài tháng hiện tại",
};

export function CalendarBlock({
  monthLabel,
  days,
  selectedDate,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
}: CalendarBlockProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="font-serif text-lg text-primary">{monthLabel}</h2>
        <div className="flex items-center gap-2 text-[#8e807c]">
          <button
            type="button"
            onClick={onPreviousMonth}
            aria-label="Tháng trước"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-lg transition hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="Tháng sau"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-lg transition hover:bg-white"
          >
            ›
          </button>
        </div>
      </div>

      <div className="rounded-[1.15rem] border border-border/70 bg-[#f7f3f0] p-4 shadow-[0_8px_24px_rgba(127,82,83,0.05)] sm:p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusLegend label="Còn chỗ" className="bg-primary" />
          <StatusLegend label="Gần hết" className="bg-secondary" />
          <StatusLegend label="Hết chỗ / đóng" className="bg-[#9c938f]" />
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_LABELS.map((label) => (
            <span
              key={label}
              className="pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#b5aaa3]"
            >
              {label}
            </span>
          ))}

          {days.map((day) => {
            const isSelected = day.iso === selectedDate;
            const canSelect = day.iso && !day.disabled;
            const dayIso = day.iso;

            if (!dayIso) {
              return (
                <span
                  key={day.key}
                  className="flex min-h-11 items-center justify-center py-2 text-xs italic text-[#c6bbb4]"
                >
                  {day.dayNumber}
                </span>
              );
            }

            return (
                <button
                  key={day.key}
                  type="button"
                  disabled={!canSelect}
                  onClick={() => onSelectDate(dayIso)}
                  aria-pressed={isSelected}
                  aria-label={`${day.dayNumber} ${monthLabel}, ${statusLabels[day.status]}${!canSelect ? ", không khả dụng" : ""}`}
                className={[
                  "relative flex min-h-11 flex-col items-center justify-center rounded-[0.95rem] py-2 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 sm:min-h-12",
                  isSelected
                    ? "bg-primary font-bold text-white shadow-[0_10px_24px_rgba(127,82,83,0.2)]"
                    : canSelect
                      ? "text-foreground hover:bg-white/80"
                      : "cursor-not-allowed text-[#b5aaa3]",
                ].join(" ")}
              >
                <span
                  className={
                    day.status === "closed" && !isSelected ? "line-through" : ""
                  }
                >
                  {day.dayNumber}
                </span>
                <span
                  className={[
                    "mt-1 h-1.5 w-1.5 rounded-full",
                    isSelected
                      ? "bg-white/85"
                      : statusDotClasses[day.status],
                  ].join(" ")}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatusLegend({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
      <span className={["h-2 w-2 rounded-full", className].join(" ")} />
      {label}
    </span>
  );
}
