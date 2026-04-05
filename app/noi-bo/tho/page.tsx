import { TechnicianOpsScreen } from "../_components/technician-ops-screen";
import { listInternalCalendarBookings } from "@/src/server/staff-calendar";

export const dynamic = "force-dynamic";

export default async function TechnicianTodayPage() {
  const initialDate = getBangkokTodayIso();
  const initialData = await listInternalCalendarBookings({
    date: initialDate,
    staffId: "all",
    status: "all",
  });

  return <TechnicianOpsScreen initialDate={initialDate} initialData={initialData} />;
}

function getBangkokTodayIso() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}
