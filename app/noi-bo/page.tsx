import Link from "next/link";
import { getInternalDashboardSnapshot } from "@/src/server/staff-setup";

export const dynamic = "force-dynamic";

export default async function InternalDashboardHomePage() {
  const snapshot = await getInternalDashboardSnapshot();

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border/80 bg-white/88 p-6 shadow-[0_20px_40px_rgba(37,28,28,0.06)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
              MVP internal setup
            </p>
            <h1 className="font-serif text-3xl text-foreground">
              Dữ liệu staff setup đang cấp nguồn cho availability chung
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-text-muted">
              Customer flow và staff MVP tiếp theo sẽ dùng cùng staff, working schedule,
              block-off, và duration rule từ shared runtime.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm text-text-muted">
            Runtime hiện tại:{" "}
            <span className="font-semibold text-primary">{snapshot.source}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Nhân sự", value: snapshot.counts.staff },
          { label: "Nhân sự đang hoạt động", value: snapshot.counts.activeStaff },
          { label: "Dòng lịch làm việc", value: snapshot.counts.schedules },
          { label: "Duration rules", value: snapshot.counts.rules },
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

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <article className="rounded-[1.8rem] border border-border/80 bg-white/88 p-6 shadow-[0_16px_32px_rgba(37,28,28,0.05)]">
          <h2 className="font-serif text-2xl text-foreground">Các khu cấu hình hiện có</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              {
                href: "/noi-bo/nhan-su",
                title: "Nhân sự",
                body: "Thêm, sửa, bật/tắt staff và quản lý thứ tự hiển thị.",
              },
              {
                href: "/noi-bo/lich-lam-viec",
                title: "Lịch làm việc",
                body: "Thiết lập lịch tuần theo staff, ngày nghỉ và khoảng nghỉ.",
              },
              {
                href: "/noi-bo/block-off",
                title: "Block-off",
                body: "Khóa giờ salon-wide hoặc theo staff để customer availability phản ánh ngay.",
              },
              {
                href: "/noi-bo/cau-hinh",
                title: "Duration rules",
                body: "Xem và chỉnh rule thời lượng cơ bản cho tổ hợp dịch vụ hiện tại.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[1.35rem] border border-border/80 bg-surface px-5 py-4 transition hover:border-primary/40 hover:shadow-[0_12px_26px_rgba(138,90,93,0.12)]"
              >
                <p className="font-semibold text-primary">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-text-muted">{item.body}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-border/80 bg-[#3b2d2f] p-6 text-white shadow-[0_20px_40px_rgba(37,28,28,0.18)]">
          <h2 className="font-serif text-2xl">Customer availability đang đọc gì</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-white/80">
            <li>Staff active/inactive từ shared repository.</li>
            <li>Working schedule theo weekday và giờ mở/đóng của từng staff.</li>
            <li>Block-off salon-wide hoặc staff-specific.</li>
            <li>Duration rules cho estimateDuration và blocked duration.</li>
          </ul>
          <p className="mt-4 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm leading-6 text-white/75">
            Chưa bao gồm staff calendar đầy đủ, persisted temp hold, auth và báo cáo vận hành.
          </p>
        </article>
      </div>
    </section>
  );
}
