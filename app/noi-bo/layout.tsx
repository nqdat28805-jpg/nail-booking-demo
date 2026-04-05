import type { ReactNode } from "react";
import { InternalDashboardShell } from "./_components/internal-dashboard-shell";

export default function InternalDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <InternalDashboardShell>{children}</InternalDashboardShell>;
}
