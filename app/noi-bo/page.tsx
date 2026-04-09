import { getInternalDashboardSnapshot } from "@/src/server/staff-setup";

export const dynamic = "force-dynamic";

export default async function InternalDashboardHomePage() {
  const snapshot = await getInternalDashboardSnapshot();

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border/80 bg-white/88 p-6 shadow-[0_20px_40px_rgba(37,28,28,0.06)]">
        <h1 className="font-serif text-3xl text-foreground">Tổng quan vận hành nội bộ</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Nhân sự", value: snapshot.counts.staff },
          { label: "Nhân sự đang hoạt động", value: snapshot.counts.activeStaff },
          { label: "Lịch làm việc", value: snapshot.counts.schedules },
          { label: "Quy tắc thời lượng", value: snapshot.counts.rules },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-[1.6rem] border border-border/80 bg-white/88 p-5 shadow-[0_12px_28px_rgba(37,28,28,0.05)]"
          >
            <p className="text-sm text-text-muted">{item.label}</p>
            <p className="mt-3 font-serif text-4xl text-primary">{item.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
