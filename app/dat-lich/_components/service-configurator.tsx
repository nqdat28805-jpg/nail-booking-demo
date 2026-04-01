import {
  EFFECT_OPTIONS,
  GUEST_COUNT_OPTIONS,
  NAIL_TYPE_OPTIONS,
  POLISH_STYLE_OPTIONS,
  SET_COUNT_OPTIONS,
  type EffectOption,
  type ServiceSelections,
} from "../booking-mock";

type ServiceConfiguratorProps = {
  selections: ServiceSelections;
  durationMinutes: number;
  serviceSummaryLabel: string;
  onChange: <K extends keyof ServiceSelections>(
    field: K,
    value: ServiceSelections[K],
  ) => void;
};

export function ServiceConfigurator({
  selections,
  durationMinutes,
  serviceSummaryLabel,
  onChange,
}: ServiceConfiguratorProps) {
  function handleEffectToggle(effect: EffectOption) {
    if (effect === "none") {
      onChange("effect", ["none"]);
      return;
    }

    const nextEffects = selections.effect.includes(effect)
      ? selections.effect.filter((currentEffect) => currentEffect !== effect)
      : [...selections.effect.filter((currentEffect) => currentEffect !== "none"), effect];

    onChange("effect", nextEffects.length > 0 ? nextEffects : ["none"]);
  }

  return (
    <section className="space-y-4">
      <div className="space-y-2 px-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Dịch vụ dự kiến
        </p>
        <h2 className="font-serif text-lg text-primary">Chọn tổ hợp dịch vụ</h2>
        <p className="text-sm leading-6 text-text-muted">
          Thời lượng dự kiến sẽ tự cập nhật để bạn chọn khung giờ phù hợp hơn.
        </p>
      </div>

      <div className="rounded-[1.15rem] border border-border/70 bg-white/80 p-4 shadow-[0_8px_24px_rgba(127,82,83,0.04)] sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberSelectGroup
            label="Số người"
            value={selections.guestCount}
            options={GUEST_COUNT_OPTIONS}
            onChange={(value) => onChange("guestCount", value)}
          />
          <ChipGroup
            label="Số bộ"
            options={SET_COUNT_OPTIONS}
            selectedValue={selections.setCount}
            onChange={(value) => onChange("setCount", value)}
          />
          <SelectGroup
            label="Loại móng"
            value={selections.nailType}
            options={NAIL_TYPE_OPTIONS}
            onChange={(value) => onChange("nailType", value)}
          />
          <SelectGroup
            label="Kiểu sơn"
            value={selections.polishStyle}
            options={POLISH_STYLE_OPTIONS}
            onChange={(value) => onChange("polishStyle", value)}
          />
          <div className="sm:col-span-2">
            <EffectGroup
              selectedValues={selections.effect}
              onToggle={handleEffectToggle}
            />
          </div>
        </div>

        <div className="mt-5 rounded-[1rem] bg-[#f7f3f0] px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
                Tóm tắt dịch vụ
              </p>
              <p className="text-sm leading-6 text-foreground">
                {serviceSummaryLabel}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
                Thời lượng
              </p>
              <p className="mt-1 text-sm font-semibold text-primary">
                {durationMinutes} phút
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChipGroup<TValue extends string>({
  label,
  options,
  selectedValue,
  onChange,
}: {
  label: string;
  options: readonly { value: TValue; label: string }[];
  selectedValue: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8983]">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option.value === selectedValue;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isSelected}
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all",
                isSelected
                  ? "bg-[linear-gradient(135deg,#7f5253_0%,#d9a2a2_100%)] text-white shadow-[0_10px_24px_rgba(127,82,83,0.14)]"
                  : "border border-border bg-[#f7f3f0] text-text-muted hover:border-primary/30 hover:text-primary",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NumberSelectGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8983]">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full appearance-none rounded-[0.95rem] border border-transparent bg-[#f1edea] px-4 py-3 pr-10 text-sm text-foreground outline-none transition focus:border-primary/15 focus:bg-white focus:ring-1 focus:ring-primary/30"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#8f7b74]">
          ▾
        </span>
      </div>
    </label>
  );
}

function SelectGroup<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: TValue;
  options: readonly { value: TValue; label: string }[];
  onChange: (value: TValue) => void;
}) {
  return (
    <label className="block space-y-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8983]">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as TValue)}
          className="w-full appearance-none rounded-[0.95rem] border border-transparent bg-[#f1edea] px-4 py-3 pr-10 text-sm text-foreground outline-none transition focus:border-primary/15 focus:bg-white focus:ring-1 focus:ring-primary/30"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#8f7b74]">
          ▾
        </span>
      </div>
    </label>
  );
}

function EffectGroup({
  selectedValues,
  onToggle,
}: {
  selectedValues: EffectOption[];
  onToggle: (value: EffectOption) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8983]">
        Hiệu ứng
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {EFFECT_OPTIONS.map((option) => {
          const isSelected = selectedValues.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              aria-pressed={isSelected}
              className={[
                "rounded-[1rem] border px-4 py-3 text-left transition-all",
                isSelected
                  ? "border-primary/30 bg-[linear-gradient(135deg,rgba(217,162,162,0.18)_0%,rgba(255,255,255,0.96)_100%)] shadow-[0_10px_24px_rgba(127,82,83,0.08)]"
                  : "border-border/70 bg-[#fbf8f6] hover:border-primary/20 hover:bg-white",
              ].join(" ")}
            >
              <span className="block text-sm font-semibold text-foreground">
                {option.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-text-muted">
                {option.value === "none"
                  ? "Giữ dịch vụ tối giản và thời lượng gọn hơn."
                  : option.value === "sticker"
                    ? "Điểm nhấn nhẹ nhàng cho từng bộ móng."
                    : "Thêm thời gian cho phần vẽ design chi tiết."}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
