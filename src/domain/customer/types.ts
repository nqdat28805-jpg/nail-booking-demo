export interface Customer {
  id: string;
  fullName: string;
  phoneE164: string;
  phoneDisplay?: string | null;
  notes?: string | null;
  preferredLocale?: "vi-VN" | "en-US" | string;
  anonymousSessionId?: string | null;
  latestBookingId?: string | null;
  createdAt: string;
  updatedAt: string;
}
