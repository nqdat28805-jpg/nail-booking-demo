"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/noi-bo", label: "Tổng quan" },
  { href: "/noi-bo/nhan-su", label: "Nhân sự" },
  { href: "/noi-bo/lich-lam-viec", label: "Lịch làm việc" },
  { href: "/noi-bo/block-off", label: "Block-off" },
  { href: "/noi-bo/cau-hinh", label: "Cấu hình" },
];

export function InternalDashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 md:flex-col">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/noi-bo" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-full border px-4 py-2 text-sm font-medium transition md:rounded-2xl md:px-4 md:py-3",
              active
                ? "border-primary bg-primary text-white shadow-[0_14px_28px_rgba(138,90,93,0.18)]"
                : "border-border/80 bg-white/85 text-text-muted hover:border-primary/40 hover:text-primary",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
