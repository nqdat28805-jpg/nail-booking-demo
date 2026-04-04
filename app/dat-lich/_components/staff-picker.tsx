import type { StaffOption } from "../booking-mock";

type StaffPickerProps = {
  staffOptions: StaffOption[];
  selectedStaffId: string;
  onSelect: (staffId: string) => void;
};

const avatarBackgrounds: Record<string, string> = {
  any: "bg-primary text-white",
  mia: "bg-[linear-gradient(135deg,#9b6d6f_0%,#dcb3a8_100%)] text-white",
  bella: "bg-[linear-gradient(135deg,#c8ae8c_0%,#f1d9be_100%)] text-[#5b4637]",
  elena: "bg-[linear-gradient(135deg,#7d5a58_0%,#c99c8e_100%)] text-white",
};

export function StaffPicker({
  staffOptions,
  selectedStaffId,
  onSelect,
}: StaffPickerProps) {
  return (
    <section className="space-y-4">
      <div className="px-2">
        <h2 className="font-serif text-lg text-primary">Chọn thợ</h2>
      </div>
      <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {staffOptions.map((staff) => {
          const isSelected = staff.id === selectedStaffId;

          return (
            <button
              key={staff.id}
              type="button"
              onClick={() => onSelect(staff.id)}
              aria-pressed={isSelected}
              className="flex shrink-0 snap-start flex-col items-center gap-2 text-center"
            >
              <span
                className={[
                  "flex h-20 w-20 items-center justify-center rounded-full p-1 transition-all focus-visible:ring-2 focus-visible:ring-primary/20",
                  isSelected
                    ? "border-2 border-primary bg-surface-muted shadow-[0_10px_25px_rgba(127,82,83,0.12)]"
                    : "border border-border bg-white/70",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-full w-full items-center justify-center rounded-full text-xl font-semibold tracking-[0.12em]",
                    avatarBackgrounds[staff.id] ?? "bg-primary text-white",
                  ].join(" ")}
                >
                  {staff.initials}
                </span>
              </span>
              <span
                className={[
                  "max-w-[92px] text-xs leading-5",
                  isSelected
                    ? "font-bold text-primary"
                    : "font-medium text-text-muted",
                ].join(" ")}
              >
                {staff.displayName}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
