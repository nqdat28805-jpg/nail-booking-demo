import Link from "next/link";
import type { ReactNode } from "react";
import { InternalDashboardNav } from "./_components/internal-dashboard-nav";

export default function InternalDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbf6f1_0%,#f3ebe5_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:gap-6 md:px-6 md:py-6">
        <aside className="md:w-72 md:shrink-0">
          <div className="rounded-[2rem] border border-border/80 bg-white/88 p-5 shadow-[0_20px_40px_rgba(37,28,28,0.06)] backdrop-blur">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Link href="/" className="font-serif text-xl text-primary">
                  19NAIL.STUDIO
                </Link>
                <span className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Noi bo demo
                </span>
              </div>
              <div className="space-y-1">
                <p className="font-serif text-2xl text-foreground">Staff Operations MVP</p>
                <p className="text-sm leading-6 text-text-muted">
                  Khu van hanh noi bo cho setup va calendar. Chua co auth, dung cho demo
                  MVP staff.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <InternalDashboardNav />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
