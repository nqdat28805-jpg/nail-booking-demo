"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { InternalDashboardNav } from "./internal-dashboard-nav";

export function InternalDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isTechnicianRoute = pathname.startsWith("/noi-bo/tho");

  if (isTechnicianRoute) {
    return <div className="min-h-screen bg-[#fdf9f6] text-foreground">{children}</div>;
  }

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
              </div>
              <p className="font-serif text-2xl text-foreground">Vận hành nội bộ</p>
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
