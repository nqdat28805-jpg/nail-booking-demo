export interface SchemaFieldDraft {
  name: string;
  type: string;
  required: boolean;
  notes?: string;
}

export interface SchemaEntityDraft {
  name: string;
  description: string;
  fields: SchemaFieldDraft[];
  relationships: string[];
}

export const SHARED_SCHEMA_DRAFT: SchemaEntityDraft[] = [
  {
    name: "bookings",
    description: "Shared booking record for web, staff, and future social-assisted flows.",
    fields: [
      { name: "id", type: "uuid", required: true },
      { name: "reference_code", type: "varchar", required: true },
      { name: "customer_id", type: "uuid", required: false },
      { name: "branch_id", type: "uuid", required: false },
      { name: "source", type: "booking_source", required: true },
      { name: "channel", type: "booking_channel", required: true },
      { name: "status", type: "booking_status", required: true },
      { name: "assigned_staff_mode", type: "varchar", required: true },
      { name: "assigned_staff_id", type: "uuid", required: false },
      { name: "date", type: "date", required: true },
      { name: "start_time", type: "time", required: true },
      { name: "estimated_end_time", type: "time", required: true },
      { name: "duration_minutes", type: "integer", required: true },
      { name: "guest_count", type: "integer", required: true },
      { name: "set_type", type: "varchar", required: true },
      { name: "nail_type", type: "varchar", required: true },
      { name: "polish_style", type: "varchar", required: true },
      { name: "effects", type: "jsonb", required: true },
      { name: "notes", type: "text", required: false },
      { name: "anonymous_session_id", type: "varchar", required: false },
      { name: "created_at", type: "timestamptz", required: true },
      { name: "updated_at", type: "timestamptz", required: true },
      { name: "confirmed_at", type: "timestamptz", required: false },
      { name: "checked_in_at", type: "timestamptz", required: false },
      { name: "actual_completed_at", type: "timestamptz", required: false },
      { name: "cancelled_at", type: "timestamptz", required: false },
    ],
    relationships: [
      "bookings.customer_id -> customers.id",
      "bookings.assigned_staff_id -> staff.id",
    ],
  },
  {
    name: "customers",
    description: "Normalized customer profile shared across all booking channels.",
    fields: [
      { name: "id", type: "uuid", required: true },
      { name: "full_name", type: "varchar", required: true },
      { name: "phone_e164", type: "varchar", required: true },
      { name: "phone_display", type: "varchar", required: false },
      { name: "notes", type: "text", required: false },
      { name: "preferred_locale", type: "varchar", required: false },
      { name: "anonymous_session_id", type: "varchar", required: false },
      { name: "created_at", type: "timestamptz", required: true },
      { name: "updated_at", type: "timestamptz", required: true },
    ],
    relationships: ["customers.id <- bookings.customer_id"],
  },
  {
    name: "staff",
    description: "Bookable technicians and staff users.",
    fields: [
      { name: "id", type: "uuid", required: true },
      { name: "display_name", type: "varchar", required: true },
      { name: "initials", type: "varchar", required: true },
      { name: "branch_id", type: "uuid", required: false },
      { name: "active", type: "boolean", required: true },
      { name: "role", type: "varchar", required: false },
      { name: "created_at", type: "timestamptz", required: true },
      { name: "updated_at", type: "timestamptz", required: true },
    ],
    relationships: [
      "staff.id <- bookings.assigned_staff_id",
      "staff.id <- staff_working_schedules.staff_id",
      "staff.id <- block_off.staff_id",
    ],
  },
  {
    name: "staff_working_schedules",
    description: "Recurring or effective-dated staff availability windows.",
    fields: [
      { name: "id", type: "uuid", required: true },
      { name: "staff_id", type: "uuid", required: true },
      { name: "branch_id", type: "uuid", required: false },
      { name: "day_of_week", type: "smallint", required: true },
      { name: "start_time", type: "time", required: true },
      { name: "end_time", type: "time", required: true },
      { name: "is_working_day", type: "boolean", required: true },
      { name: "timezone", type: "varchar", required: true },
      { name: "effective_from", type: "date", required: false },
      { name: "effective_to", type: "date", required: false },
      { name: "created_at", type: "timestamptz", required: true },
      { name: "updated_at", type: "timestamptz", required: true },
    ],
    relationships: ["staff_working_schedules.staff_id -> staff.id"],
  },
  {
    name: "block_off",
    description: "Staff-, branch-, or global-level non-bookable windows.",
    fields: [
      { name: "id", type: "uuid", required: true },
      { name: "branch_id", type: "uuid", required: false },
      { name: "staff_id", type: "uuid", required: false },
      { name: "scope", type: "varchar", required: true },
      { name: "title", type: "varchar", required: true },
      { name: "reason", type: "text", required: false },
      { name: "start_at", type: "timestamptz", required: true },
      { name: "end_at", type: "timestamptz", required: true },
      { name: "active", type: "boolean", required: true },
      { name: "created_at", type: "timestamptz", required: true },
      { name: "updated_at", type: "timestamptz", required: true },
    ],
    relationships: [
      "block_off.staff_id -> staff.id",
      "block_off windows are consumed by the shared availability engine",
    ],
  },
  {
    name: "service_duration_rules",
    description: "Configurable duration lookup rules used by the shared duration estimator.",
    fields: [
      { name: "id", type: "uuid", required: true },
      { name: "code", type: "varchar", required: true },
      { name: "branch_id", type: "uuid", required: false },
      { name: "set_type", type: "varchar", required: true },
      { name: "nail_type", type: "varchar", required: true },
      { name: "polish_style", type: "varchar", required: true },
      { name: "effect_option", type: "varchar", required: true },
      { name: "base_duration_minutes", type: "integer", required: true },
      { name: "guest_count_strategy", type: "varchar", required: true },
      { name: "guest_count_multiplier", type: "numeric", required: true },
      { name: "block_round_to_minutes", type: "integer", required: true },
      { name: "active", type: "boolean", required: true },
      { name: "notes", type: "text", required: false },
      { name: "created_at", type: "timestamptz", required: true },
      { name: "updated_at", type: "timestamptz", required: true },
    ],
    relationships: [
      "service_duration_rules feed duration estimation before availability queries",
    ],
  },
  {
    name: "audit_logs",
    description: "Immutable audit trail for booking lifecycle mutations.",
    fields: [
      { name: "id", type: "uuid", required: true },
      { name: "entity_type", type: "varchar", required: true },
      { name: "entity_id", type: "uuid", required: true },
      { name: "action", type: "varchar", required: true },
      { name: "previous_status", type: "varchar", required: false },
      { name: "next_status", type: "varchar", required: false },
      { name: "performed_by_actor_type", type: "varchar", required: true },
      { name: "performed_by_actor_id", type: "uuid", required: false },
      { name: "occurred_at", type: "timestamptz", required: true },
      { name: "notes", type: "text", required: false },
      { name: "payload", type: "jsonb", required: false },
    ],
    relationships: ["audit_logs.entity_id -> bookings.id when entity_type = 'booking'"],
  },
];
